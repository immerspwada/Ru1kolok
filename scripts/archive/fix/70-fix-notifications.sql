-- Fix notifications table schema

-- Drop existing policies first
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admins manage all notifications" ON notifications;

-- Add missing columns if they don't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS performance_id UUID REFERENCES performance_records(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Recreate RLS policies
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage all notifications"
  ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
