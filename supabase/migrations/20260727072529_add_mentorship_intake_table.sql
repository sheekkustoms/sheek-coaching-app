/*
# Add mentorship intake table for student business stage tracking

1. Overview
   Students joining the mentorship program may be at different stages:
   - "just_starting": brand new, no store, no sales, no numbers
   - "established": has an existing business with sales data to audit

   This table tracks each student's self-selected stage and gives the mentor
   a place to record intake responses and build a tailored game plan.

2. New Table
   - `mentorship_intake`
     - user_id (uuid, FK to auth.users)
     - business_stage (text): 'just_starting' | 'established'
     - intake_responses (jsonb): mentor-entered Q&A responses
     - game_plan (text): mentor's tailored plan for this student
     - created_at / updated_at

3. Security (RLS)
   - SELECT: student reads own row; admin reads all
   - INSERT/UPDATE: student can set their own stage; admin can update all
   - DELETE: admin only
*/

CREATE TABLE IF NOT EXISTS mentorship_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_stage text NOT NULL DEFAULT 'established',
  intake_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  game_plan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentorship_intake ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mentorship_intake" ON mentorship_intake;
CREATE POLICY "select_mentorship_intake" ON mentorship_intake FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "upsert_mentorship_intake" ON mentorship_intake;
CREATE POLICY "upsert_mentorship_intake" ON mentorship_intake FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_mentorship_intake" ON mentorship_intake;
CREATE POLICY "update_mentorship_intake" ON mentorship_intake FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "delete_mentorship_intake" ON mentorship_intake;
CREATE POLICY "delete_mentorship_intake" ON mentorship_intake FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_mentorship_intake_user ON mentorship_intake(user_id);
