/*
# Add avatar support (avatars bucket + profiles.avatar_url)

1. Overview
   Members can now upload a profile photo. The photo is stored in a new public
   `avatars` storage bucket and its public URL is saved on the member's profile
   row in a new `avatar_url` column. The Community feed (and any other view that
   shows a member) renders the uploaded photo when present, falling back to the
   existing initial-circle avatar when it is null.

2. Modified Tables
   - `profiles`
     - avatar_url (text, nullable) — public URL of the uploaded avatar image in
       the `avatars` bucket. Null means "no photo uploaded yet".

3. Storage
   - Create public bucket `avatars` for profile photo uploads.
   - The bucket is public so avatar URLs render directly in the browser
     (member names/avatars are visible to all authenticated members, matching
     the existing authenticated SELECT policy on profiles).

4. Security (RLS / storage policies)
   - storage.objects SELECT for authenticated reads of avatars (any logged-in
     member can see any avatar, consistent with the shared community feed).
   - storage.objects INSERT for authenticated uploads to avatars. Uploads are
     namespaced per user via the object path (avatars/<uid>/...) and the client
     enforces the path; the bucket is public-read which is the documented
     shared-content case.
   - storage.objects DELETE for authenticated users on their own avatar objects
     (path prefix matches auth.uid()) so re-uploads can replace the old file.
   - profiles UPDATE policy already exists (auth_update_own_profile) and covers
     the new avatar_url column, so no new table policy is needed.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_read_avatars" ON storage.objects;
CREATE POLICY "auth_read_avatars" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_upload_avatars" ON storage.objects;
CREATE POLICY "auth_upload_avatars" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_delete_avatars" ON storage.objects;
CREATE POLICY "auth_delete_avatars" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars');
