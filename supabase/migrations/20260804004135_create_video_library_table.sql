/*
# Create Video Library table

1. New Tables
- `video_library` — a browsable collection of Vimeo-hosted tutorial videos for the classroom.
  - `id` (uuid, primary key — preserves original IDs from seed data)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `vimeo_url` (text, nullable — full Vimeo iframe embed HTML)
  - `thumbnail_emoji` (text, default '🎬')
  - `category` (text, default 'general')
  - `published_at` (timestamptz, nullable)
  - `is_visible` (boolean, default true)
  - `sort_order` (integer, default 0)
  - `created_at` (timestamptz, default now())
  - `thumbnail_url` (text, nullable — vumbnail.com thumbnail image URL)
  - `resource_pdf_url` (text, nullable — link to downloadable PDF resource)
  - `templates_zip_url` (text, nullable — link to downloadable ZIP of templates)

2. Security
- Enable RLS on `video_library`.
- SELECT: any authenticated user can see videos where is_visible = true.
  Admins (profiles.is_admin) can see all videos regardless of visibility.
- INSERT / UPDATE / DELETE: only authenticated admin users.
*/

CREATE TABLE IF NOT EXISTS video_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  vimeo_url text,
  thumbnail_emoji text NOT NULL DEFAULT '🎬',
  category text NOT NULL DEFAULT 'general',
  published_at timestamptz,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  thumbnail_url text,
  resource_pdf_url text,
  templates_zip_url text
);

ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users see visible videos; admins see all
DROP POLICY IF EXISTS "select_video_library" ON video_library;
CREATE POLICY "select_video_library"
ON video_library FOR SELECT
TO authenticated
USING (
  is_visible = true
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- INSERT: admin only
DROP POLICY IF EXISTS "insert_video_library" ON video_library;
CREATE POLICY "insert_video_library"
ON video_library FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- UPDATE: admin only
DROP POLICY IF EXISTS "update_video_library" ON video_library;
CREATE POLICY "update_video_library"
ON video_library FOR UPDATE
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
DROP POLICY IF EXISTS "delete_video_library" ON video_library;
CREATE POLICY "delete_video_library"
ON video_library FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
