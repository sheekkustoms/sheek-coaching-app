/*
# Add mentorship tier and dashboard tables

1. Overview
   Adds a `tier` field to profiles ("member" or "mentorship"). Mentorship is a
   higher subscription tier purchased via Stripe. Also adds tables for the
   mentorship dashboard: week progress, deliverable submissions, and
   subscription tracking.

2. Modified Tables
   - `profiles`
     - tier (text, not null, default 'member') — 'member' or 'mentorship'

3. New Tables
   - `mentorship_subscriptions` — tracks Stripe subscription state per user.
   - `mentorship_progress` — week completion state (1-12) per user.
   - `mentorship_deliverables` — submitted notes/checklist per week per user.

4. Security (RLS)
   - All tables are owner-scoped. Webhook uses service-role key (bypasses RLS).
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'member';

CREATE TABLE IF NOT EXISTS mentorship_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentorship_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mentorship_sub" ON mentorship_subscriptions;
CREATE POLICY "select_own_mentorship_sub" ON mentorship_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mentorship_sub" ON mentorship_subscriptions;
CREATE POLICY "insert_own_mentorship_sub" ON mentorship_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mentorship_sub" ON mentorship_subscriptions;
CREATE POLICY "update_own_mentorship_sub" ON mentorship_subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mentorship_sub_user_id ON mentorship_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS mentorship_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number int NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE (user_id, week_number)
);

ALTER TABLE mentorship_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mentorship_progress" ON mentorship_progress;
CREATE POLICY "select_own_mentorship_progress" ON mentorship_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mentorship_progress" ON mentorship_progress;
CREATE POLICY "insert_own_mentorship_progress" ON mentorship_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mentorship_progress" ON mentorship_progress;
CREATE POLICY "update_own_mentorship_progress" ON mentorship_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mentorship_progress" ON mentorship_progress;
CREATE POLICY "delete_own_mentorship_progress" ON mentorship_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mentorship_progress_user ON mentorship_progress(user_id);

CREATE TABLE IF NOT EXISTS mentorship_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  checklist_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentorship_deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mentorship_deliverables" ON mentorship_deliverables;
CREATE POLICY "select_own_mentorship_deliverables" ON mentorship_deliverables FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mentorship_deliverables" ON mentorship_deliverables;
CREATE POLICY "insert_own_mentorship_deliverables" ON mentorship_deliverables FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mentorship_deliverables" ON mentorship_deliverables;
CREATE POLICY "update_own_mentorship_deliverables" ON mentorship_deliverables FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mentorship_deliverables" ON mentorship_deliverables;
CREATE POLICY "delete_own_mentorship_deliverables" ON mentorship_deliverables FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mentorship_deliverables_user_week ON mentorship_deliverables(user_id, week_number);
