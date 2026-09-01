/*
# Add mentor teaching system — plans, files, and feedback

1. Overview
   This gives the mentor (admin) their own side of the 12-week program:
   a teaching plan per week, the ability to attach homework files / worksheets
   to each week, and the ability to leave feedback on student deliverable
   submissions.

2. New Tables
   - `mentor_week_plans` — the mentor's private teaching plan for each week (1-12).
     Stores the teaching objective, talking points, prep checklist, common
     student struggles, and mentor notes. Only the admin writes this; mentorship
     students can read it so they see what the mentor is working on with them.
   - `mentor_week_files` — files the mentor attaches to a week (homework,
     worksheets, templates). Stored as Supabase Storage paths. Students can
     download them.
   - `mentor_deliverable_feedback` — feedback the mentor leaves on a student's
     deliverable submission. One feedback row per deliverable.

3. Storage
   - A `mentor-files` storage bucket is created (public read) so students can
     download homework files the mentor uploads.

4. Security (RLS)
   - `mentor_week_plans`: admin can do all CRUD; authenticated students can
     SELECT (read-only) so they see the plan.
   - `mentor_week_files`: admin can do all CRUD; authenticated students can
     SELECT (read-only).
   - `mentor_deliverable_feedback`: admin can do all CRUD; the student who owns
     the deliverable can SELECT (read-only) feedback left for them.
*/

-- Storage bucket for mentor-uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-files', 'mentor-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS mentor_week_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number int NOT NULL CHECK (week_number >= 1 AND week_number <= 12) UNIQUE,
  teaching_objective text,
  talking_points text,
  prep_checklist text,
  common_struggles text,
  mentor_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentor_week_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mentor_week_plans" ON mentor_week_plans;
CREATE POLICY "select_mentor_week_plans" ON mentor_week_plans FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_mentor_week_plans" ON mentor_week_plans;
CREATE POLICY "insert_mentor_week_plans" ON mentor_week_plans FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "update_mentor_week_plans" ON mentor_week_plans;
CREATE POLICY "update_mentor_week_plans" ON mentor_week_plans FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "delete_mentor_week_plans" ON mentor_week_plans;
CREATE POLICY "delete_mentor_week_plans" ON mentor_week_plans FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE TABLE IF NOT EXISTS mentor_week_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number int NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentor_week_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mentor_week_files" ON mentor_week_files;
CREATE POLICY "select_mentor_week_files" ON mentor_week_files FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_mentor_week_files" ON mentor_week_files;
CREATE POLICY "insert_mentor_week_files" ON mentor_week_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "update_mentor_week_files" ON mentor_week_files;
CREATE POLICY "update_mentor_week_files" ON mentor_week_files FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "delete_mentor_week_files" ON mentor_week_files;
CREATE POLICY "delete_mentor_week_files" ON mentor_week_files FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_mentor_week_files_week ON mentor_week_files(week_number);

CREATE TABLE IF NOT EXISTS mentor_deliverable_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid NOT NULL REFERENCES mentorship_deliverables(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  status text NOT NULL DEFAULT 'reviewed' CHECK (status IN ('reviewed', 'needs_revision', 'approved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id)
);

ALTER TABLE mentor_deliverable_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mentor_feedback" ON mentor_deliverable_feedback;
CREATE POLICY "select_mentor_feedback" ON mentor_deliverable_feedback FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "insert_mentor_feedback" ON mentor_deliverable_feedback;
CREATE POLICY "insert_mentor_feedback" ON mentor_deliverable_feedback FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "update_mentor_feedback" ON mentor_deliverable_feedback;
CREATE POLICY "update_mentor_feedback" ON mentor_deliverable_feedback FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "delete_mentor_feedback" ON mentor_deliverable_feedback;
CREATE POLICY "delete_mentor_feedback" ON mentor_deliverable_feedback FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_mentor_feedback_student ON mentor_deliverable_feedback(student_id);
