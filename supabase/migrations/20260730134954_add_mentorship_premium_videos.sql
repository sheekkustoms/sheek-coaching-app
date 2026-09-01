/*
# Add Mentorship Premium Videos

1. New Tables
- `mentorship_videos` — exclusive video lessons visible only to mentorship-tier members and admins.
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `video_url` (text, nullable — Vimeo embed URL)
  - `thumbnail_url` (text, nullable)
  - `position` (integer, default 0 — display order)
  - `published` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `mentorship_videos`.
- SELECT: only authenticated users whose profile tier is 'mentorship' OR who are admin.
  Admins see all videos (including unpublished); mentorship members see published only.
- INSERT / UPDATE / DELETE: only authenticated admin users.

3. Notes
- Uses EXISTS subquery against `profiles` to verify tier/admin status at query time.
*/

CREATE TABLE IF NOT EXISTS mentorship_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mentorship_videos ENABLE ROW LEVEL SECURITY;

-- SELECT: mentorship tier members see published; admins see all
DROP POLICY IF EXISTS "select_mentorship_videos" ON mentorship_videos;
CREATE POLICY "select_mentorship_videos"
ON mentorship_videos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
  OR (
    published = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tier = 'mentorship'
    )
  )
);

-- INSERT: admin only
DROP POLICY IF EXISTS "insert_mentorship_videos" ON mentorship_videos;
CREATE POLICY "insert_mentorship_videos"
ON mentorship_videos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- UPDATE: admin only
DROP POLICY IF EXISTS "update_mentorship_videos" ON mentorship_videos;
CREATE POLICY "update_mentorship_videos"
ON mentorship_videos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- DELETE: admin only
DROP POLICY IF EXISTS "delete_mentorship_videos" ON mentorship_videos;
CREATE POLICY "delete_mentorship_videos"
ON mentorship_videos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
