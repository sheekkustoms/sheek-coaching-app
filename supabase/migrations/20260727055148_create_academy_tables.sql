/*
# Create academy tables (courses, sections, lessons)

1. Overview
   Oh Sew Sheek Academy is a shared, members-only academy. Access is gated by
   Supabase email/password auth — only authenticated members can reach the app.
   Course content is intentionally shared across all members (any logged-in
   member can browse, create, and edit courses/sections/lessons), so the RLS
   policies below grant authenticated users full CRUD on all rows. This is the
   documented "intentionally shared data" case, not an ownership shortcut.

2. New Tables
   - `courses`
     - id (uuid, primary key)
     - title (text, not null)
     - created_at (timestamptz, default now())
   - `sections`
     - id (uuid, primary key)
     - title (text, not null)
     - course_id (uuid, FK -> courses.id ON DELETE CASCADE)
     - position (int, default 0)
     - created_at (timestamptz, default now())
   - `lessons`
     - id (uuid, primary key)
     - title (text, not null)
     - body (text, nullable)
     - published (boolean, default false)   -- false == "Draft"
     - section_id (uuid, FK -> sections.id ON DELETE CASCADE)
     - position (int, default 0)
     - created_at (timestamptz, default now())

3. Indexes
   - sections(course_id), lessons(section_id) for fast nested fetches.

4. Security (RLS)
   - RLS enabled on all three tables.
   - Authenticated-only CRUD (SELECT/INSERT/UPDATE/DELETE) for all rows, because
     course content is shared academy content. No anon access — the app requires
     sign-in, so anon-key clients (unauthenticated visitors) get nothing.
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_courses" ON courses;
CREATE POLICY "auth_select_courses" ON courses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_courses" ON courses;
CREATE POLICY "auth_insert_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_courses" ON courses;
CREATE POLICY "auth_update_courses" ON courses FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_courses" ON courses;
CREATE POLICY "auth_delete_courses" ON courses FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_sections" ON sections;
CREATE POLICY "auth_select_sections" ON sections FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sections" ON sections;
CREATE POLICY "auth_insert_sections" ON sections FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sections" ON sections;
CREATE POLICY "auth_update_sections" ON sections FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_sections" ON sections;
CREATE POLICY "auth_delete_sections" ON sections FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  published boolean NOT NULL DEFAULT false,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_lessons" ON lessons;
CREATE POLICY "auth_select_lessons" ON lessons FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_lessons" ON lessons;
CREATE POLICY "auth_insert_lessons" ON lessons FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_lessons" ON lessons;
CREATE POLICY "auth_update_lessons" ON lessons FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_lessons" ON lessons;
CREATE POLICY "auth_delete_lessons" ON lessons FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sections_course_id ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_section_id ON lessons(section_id);
