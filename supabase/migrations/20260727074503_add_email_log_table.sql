/*
# Email log table for tracking sent emails from the system

1. Overview
   Tracks every email sent from the Mentor Studio email composer.
   Admin can see history of sent emails, who they went to, subject, and body.

2. New Table
   - `email_log`
     - sender_id (uuid, FK to auth.users) — the admin who sent it
     - recipients (text[]) — email addresses it was sent to
     - recipient_user_ids (uuid[]) — user IDs it was sent to (for filtering)
     - subject (text)
     - body (text) — plain text body
     - status (text) — 'sent' | 'failed'
     - error_message (text, nullable)
     - sent_at (timestamptz)

3. Security (RLS)
   - SELECT: admin only
   - INSERT: admin only (edge function uses service role, bypasses RLS)
   - DELETE: admin only
*/

CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipients text[] NOT NULL DEFAULT '{}',
  recipient_user_ids uuid[] NOT NULL DEFAULT '{}',
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_email_log" ON email_log;
CREATE POLICY "select_email_log" ON email_log FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "insert_email_log" ON email_log;
CREATE POLICY "insert_email_log" ON email_log FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "delete_email_log" ON email_log;
CREATE POLICY "delete_email_log" ON email_log FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at DESC);
