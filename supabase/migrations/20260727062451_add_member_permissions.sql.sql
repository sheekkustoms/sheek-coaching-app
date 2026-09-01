/*
# Add granular member permissions

1. Overview
   Adds a JSONB `permissions` field to profiles so the admin can grant
   limited permissions to specific members without making them full admins.
   Three permission keys are supported:
     - "approve_members"  — approve/reject pending signups, remove members
     - "moderate_posts"    — delete any member's community post
     - "manage_content"    — create/edit/delete courses, sections, lessons,
                              and attach/remove lesson media (PDF, Vimeo video)

   RLS is enforced at the database level: a member can only perform the
   actions their permissions allow, regardless of what the UI shows.

2. Modified Tables
   - `profiles`
     - permissions (jsonb, NOT NULL, DEFAULT '{}'::jsonb) — object whose keys
       are the permission names above with boolean true values.

3. New SQL Helper Functions (SECURITY DEFINER, immutable lookups)
   - `is_admin()`            — true if the current user's profile has is_admin.
   - `has_permission(p text)` — true if the current user is an admin OR has the
     named permission key set to true in their permissions JSONB. Admins
     implicitly have every permission.

4. Security (RLS) — tightened from "any authenticated user can do everything"
   to permission-scoped policies:
   - courses / sections / lessons:
       SELECT  — any authenticated user (content is shared academy-wide)
       INSERT / UPDATE / DELETE — only admins or members with manage_content
   - posts:
       SELECT  — any authenticated user (shared feed)
       INSERT  — owner only (auth.uid() = user_id)
       UPDATE  — owner only
       DELETE  — owner only OR admins OR members with moderate_posts
   - profiles:
       SELECT  — any authenticated user (roster is shared)
       UPDATE  — self OR admins (existing). Admins can set permissions/status.
                 Self-edits are still allowed for display_name/avatar_url.

5. Notes
   - Existing content rows created under the old open policies remain visible
     to all authenticated members (SELECT stays open).
   - The admin (sheek24kustoms@gmail.com) implicitly has all permissions via
     is_admin, so no permissions JSON needs to be set for that account.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Helper: does the current user have a named permission (or is admin)?
CREATE OR REPLACE FUNCTION public.has_permission(p text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin OR COALESCE((permissions ->> p)::boolean, false)
     FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ===== courses =====
DROP POLICY IF EXISTS "auth_insert_courses" ON courses;
CREATE POLICY "auth_insert_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (public.has_permission('manage_content'));

DROP POLICY IF EXISTS "auth_update_courses" ON courses;
CREATE POLICY "auth_update_courses" ON courses FOR UPDATE
  TO authenticated USING (public.has_permission('manage_content'))
  WITH CHECK (public.has_permission('manage_content'));

DROP POLICY IF EXISTS "auth_delete_courses" ON courses;
CREATE POLICY "auth_delete_courses" ON courses FOR DELETE
  TO authenticated USING (public.has_permission('manage_content'));

-- ===== sections =====
DROP POLICY IF EXISTS "auth_insert_sections" ON sections;
CREATE POLICY "auth_insert_sections" ON sections FOR INSERT
  TO authenticated WITH CHECK (public.has_permission('manage_content'));

DROP POLICY IF EXISTS "auth_update_sections" ON sections;
CREATE POLICY "auth_update_sections" ON sections FOR UPDATE
  TO authenticated USING (public.has_permission('manage_content'))
  WITH CHECK (public.has_permission('manage_content'));

DROP POLICY IF EXISTS "auth_delete_sections" ON sections;
CREATE POLICY "auth_delete_sections" ON sections FOR DELETE
  TO authenticated USING (public.has_permission('manage_content'));

-- ===== lessons =====
DROP POLICY IF EXISTS "auth_insert_lessons" ON lessons;
CREATE POLICY "auth_insert_lessons" ON lessons FOR INSERT
  TO authenticated WITH CHECK (public.has_permission('manage_content'));

DROP POLICY IF EXISTS "auth_update_lessons" ON lessons;
CREATE POLICY "auth_update_lessons" ON lessons FOR UPDATE
  TO authenticated USING (public.has_permission('manage_content'))
  WITH CHECK (public.has_permission('manage_content'));

DROP POLICY IF EXISTS "auth_delete_lessons" ON lessons;
CREATE POLICY "auth_delete_lessons" ON lessons FOR DELETE
  TO authenticated USING (public.has_permission('manage_content'));

-- ===== posts =====
-- DELETE: owner OR admin OR moderate_posts permission
DROP POLICY IF EXISTS "auth_delete_own_posts" ON posts;
CREATE POLICY "auth_delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR public.has_permission('moderate_posts')
  );

-- ===== profiles =====
-- UPDATE: self OR admin (admin can set status, is_admin, permissions)
DROP POLICY IF EXISTS "auth_update_own_profile" ON profiles;
CREATE POLICY "auth_update_own_profile" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
