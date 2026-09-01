/*
# Lock down mentor_week_plans to admin-only

1. Overview
   Students were previously able to read the mentor's teaching plan
   (objective, talking points, prep checklist, common struggles). The mentor
   wants this completely private. This migration changes the SELECT policy on
   mentor_week_plans so only admins can read it. All other operations remain
   admin-only as before.

2. Security (RLS)
   - mentor_week_plans SELECT: now restricted to admin only (was: all authenticated).
   - INSERT / UPDATE / DELETE: unchanged, already admin-only.
*/

DROP POLICY IF EXISTS "select_mentor_week_plans" ON mentor_week_plans;

CREATE POLICY "select_mentor_week_plans" ON mentor_week_plans FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );
