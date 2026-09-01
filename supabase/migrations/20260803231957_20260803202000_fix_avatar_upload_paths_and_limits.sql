/*
# Secure and stabilize profile photo uploads

1. Overview
- Keep profile photos visible to authenticated academy members.
- Ensure each member can only upload, replace, or remove files inside their own folder.
- Add server-enforced photo type and size limits so the avatar bucket accepts real images only.

2. Modified storage
- `storage.buckets` / `avatars`
  - Limit uploads to common image MIME types.
  - Limit each profile photo to 5 MB.

3. Security changes
- Replace broad avatar write policies with owner-folder checks based on `auth.uid()`.
- Keep authenticated SELECT access for shared student profile photos.
- Existing files are preserved; no rows or objects are deleted by this migration.
*/

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
WHERE id = 'avatars';

DROP POLICY IF EXISTS "auth_read_avatars" ON storage.objects;
CREATE POLICY "auth_read_avatars" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_upload_avatars" ON storage.objects;
CREATE POLICY "auth_upload_avatars" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "auth_update_avatars" ON storage.objects;
CREATE POLICY "auth_update_avatars" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "auth_delete_avatars" ON storage.objects;
CREATE POLICY "auth_delete_avatars" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );