-- Enhance leave_requests table with additional fields for better tracking

-- Add review notes field
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Add updated_at timestamp
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER trigger_update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_requests_updated_at();

-- Create view for leave request history with full details
CREATE OR REPLACE VIEW leave_request_history AS
SELECT 
  lr.id,
  lr.session_id,
  lr.athlete_id,
  lr.reason,
  lr.status,
  lr.review_notes,
  lr.requested_at,
  lr.reviewed_at,
  lr.created_at,
  lr.updated_at,
  -- Athlete details
  a.first_name as athlete_first_name,
  a.last_name as athlete_last_name,
  a.nickname as athlete_nickname,
  a.user_id as athlete_user_id,
  -- Session details
  ts.title as session_name,
  ts.session_type,
  ts.session_date,
  ts.start_time,
  ts.end_time,
  -- Coach details (reviewer)
  c.first_name as reviewer_first_name,
  c.last_name as reviewer_last_name,
  lr.reviewed_by as reviewer_id,
  -- Club details
  cl.name as club_name,
  cl.id as club_id
FROM leave_requests lr
JOIN athletes a ON lr.athlete_id = a.id
JOIN training_sessions ts ON lr.session_id = ts.id
LEFT JOIN coaches c ON lr.reviewed_by = c.id
LEFT JOIN clubs cl ON a.club_id = cl.id;

-- Grant access to the view
GRANT SELECT ON leave_request_history TO authenticated;

-- Create index for faster history queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_athlete_created 
  ON leave_requests(athlete_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_created 
  ON leave_requests(status, created_at DESC);

-- Comments
COMMENT ON COLUMN leave_requests.review_notes IS 'Optional notes from coach when reviewing leave request';
COMMENT ON COLUMN leave_requests.updated_at IS 'Timestamp of last update';
COMMENT ON VIEW leave_request_history IS 'Complete view of leave requests with athlete, session, and reviewer details';
