-- Add login_at and logout_at timestamps to login_sessions table
-- This enables proper session management and logout tracking

-- Add login_at column (defaults to created_at for existing records)
ALTER TABLE login_sessions 
ADD COLUMN IF NOT EXISTS login_at TIMESTAMPTZ DEFAULT NOW();

-- Add logout_at column (nullable, set when user logs out)
ALTER TABLE login_sessions 
ADD COLUMN IF NOT EXISTS logout_at TIMESTAMPTZ;

-- Update existing records to set login_at = created_at
UPDATE login_sessions 
SET login_at = created_at 
WHERE login_at IS NULL;

-- Create index for faster logout queries
CREATE INDEX IF NOT EXISTS idx_login_sessions_logout_at ON login_sessions(logout_at);

-- Create index for active sessions (where logout_at is null)
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(user_id, device_id) 
WHERE logout_at IS NULL;

-- Add policy for updating logout_at
CREATE POLICY "Users can update own session logout"
  ON login_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
