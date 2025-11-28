-- สร้างตาราง registration_audit สำหรับติดตามการสมัครสมาชิก
CREATE TABLE IF NOT EXISTS registration_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  step TEXT NOT NULL, -- 'started', 'auth_created', 'profile_created', 'athlete_created', 'completed', 'failed'
  step_data JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_registration_audit_user_id ON registration_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_audit_email ON registration_audit(email);
CREATE INDEX IF NOT EXISTS idx_registration_audit_step ON registration_audit(step);
CREATE INDEX IF NOT EXISTS idx_registration_audit_created_at ON registration_audit(created_at DESC);

-- RLS Policies
ALTER TABLE registration_audit ENABLE ROW LEVEL SECURITY;

-- Admin สามารถดูทั้งหมด
CREATE POLICY "Admin can view all registration audit"
  ON registration_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ผู้ใช้สามารถดูของตัวเอง
CREATE POLICY "Users can view their own registration audit"
  ON registration_audit FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System สามารถสร้าง audit log
CREATE POLICY "System can create registration audit"
  ON registration_audit FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

COMMENT ON TABLE registration_audit IS 'ติดตามขั้นตอนการสมัครสมาชิกแต่ละ step';

-- View สำหรับดูการสมัครที่ไม่สมบูรณ์
CREATE OR REPLACE VIEW incomplete_registrations AS
SELECT 
  ra.email,
  ra.user_id,
  MAX(ra.created_at) as last_attempt,
  ARRAY_AGG(DISTINCT ra.step ORDER BY ra.step) as completed_steps,
  COUNT(*) as attempt_count,
  MAX(ra.error_message) as last_error
FROM registration_audit ra
WHERE ra.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM registration_audit ra2
    WHERE ra2.user_id = ra.user_id
    AND ra2.step = 'completed'
  )
GROUP BY ra.email, ra.user_id
HAVING MAX(ra.created_at) > NOW() - INTERVAL '7 days'
ORDER BY last_attempt DESC;

COMMENT ON VIEW incomplete_registrations IS 'แสดงการสมัครที่ยังไม่เสร็จสมบูรณ์ใน 7 วันที่ผ่านมา';
