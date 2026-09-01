/*
# Add member approval system (status, is_admin, email on profiles)

1. Overview
   Introduces an admin-gated approval workflow for new signups. Every new user
   starts in "pending" status and must be approved by an admin before they can
   access the app. Admins can approve, reject (remove), or later remove approved
   members. Removed members are banned at the auth layer so they cannot log back
   in. An "is_admin" flag on profiles controls who can see the Admin panel.

2. Modified Tables
   - `profiles`
     - status (text, NOT NULL, DEFAULT 'pending') — one of 'pending',
       'approved', 'removed'. New signups default to 'pending'.
     - is_admin (boolean, NOT NULL, DEFAULT false) — whether this member can
       access the Admin panel.
     - email (text, nullable) — denormalized copy of the auth.users email so
       the admin panel can show signup emails without exposing auth.users.

3. Automation
   - `handle_new_user()` trigger updated to also insert the email and
     status='pending' for new signups (previously only set display_name).
   - New `sync_profile_status()` SECURITY DEFINER trigger function: when a
     profile's status changes to 'removed', it sets `banned_until` to
     9999-12-31 on the matching auth.users row so the user is immediately
     blocked from signing in or refreshing their session. When status changes
     back to 'pending' or 'approved', it clears `banned_until` (un-bans).
   - Trigger `on_profile_status_change` fires AFTER UPDATE OF status ON
     profiles.

4. Backfill
   - All existing profiles are set to status='approved' and is_admin=true so
     current members keep access and can administer the panel. Email is
     copied from auth.users. (Adjust is_admin per member later from the panel.)

5. Security (RLS)
   - profiles SELECT already allows any authenticated user to read all rows
     (shared community), so the admin list is readable by all authenticated
     users. This is intentional — the admin panel itself is gated client-side
     by is_admin and the UPDATE policy.
   - New `auth_admin_update_profiles` UPDATE policy: admins (profiles where
     is_admin=true) can update ANY profile row (to change status / is_admin).
   - The existing `auth_update_own_profile` policy remains for self-edits
     (display_name, avatar_url).
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing profiles: approve everyone, make them admins, copy email
UPDATE profiles p
SET
  status = 'approved',
  is_admin = COALESCE(p.is_admin, true),
  email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.is_admin = false OR p.status = 'pending');

-- Update the signup trigger to set email + pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, status)
  VALUES (new.id, split_part(new.email, '@', 1), new.email, 'pending')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    status = CASE WHEN public.profiles.status = 'removed' THEN 'removed' ELSE public.profiles.status END;
  RETURN new;
END;
$$;

-- Ban / unban users when their profile status changes
CREATE OR REPLACE FUNCTION public.sync_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'removed' THEN
    UPDATE auth.users
    SET banned_until = '9999-12-31 23:59:59+00'
    WHERE id = NEW.id;
  ELSE
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_status_change ON profiles;
CREATE TRIGGER on_profile_status_change
  AFTER UPDATE OF status ON profiles
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_profile_status();

-- Admins can update any profile (to approve/reject/remove members)
DROP POLICY IF EXISTS "auth_admin_update_profiles" ON profiles;
CREATE POLICY "auth_admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles pp WHERE pp.id = auth.uid() AND pp.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles pp WHERE pp.id = auth.uid() AND pp.is_admin = true)
  );
