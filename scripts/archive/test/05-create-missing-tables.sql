-- ============================================================================
-- Create Missing Tables for Sports Club Management
-- ============================================================================

-- Create clubs table if not exists
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create coaches table if not exists
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  specialization TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create athletes table if not exists
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  date_of_birth DATE,
  phone_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  health_notes TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'athlete',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance_logs table if not exists
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_records table if not exists
CREATE TABLE IF NOT EXISTS performance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  test_type VARCHAR(100) NOT NULL,
  result_value DECIMAL(10, 2) NOT NULL,
  result_unit VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_club_id ON coaches(club_id);
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id);
CREATE INDEX IF NOT EXISTS idx_athletes_club_id ON athletes(club_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_athlete_id ON attendance_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session_date ON attendance_logs(session_date);
CREATE INDEX IF NOT EXISTS idx_performance_records_athlete_id ON performance_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_performance_records_test_date ON performance_records(test_date);

-- Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Athletes can view own profile" ON athletes;
DROP POLICY IF EXISTS "Athletes can update own profile" ON athletes;
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
DROP POLICY IF EXISTS "Athletes can view own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Athletes can view own performance" ON performance_records;
DROP POLICY IF EXISTS "Admins can do everything on clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can do everything on coaches" ON coaches;
DROP POLICY IF EXISTS "Admins can do everything on athletes" ON athletes;
DROP POLICY IF EXISTS "Admins can do everything on attendance_logs" ON attendance_logs;
DROP POLICY IF EXISTS "Admins can do everything on performance_records" ON performance_records;

-- Create RLS policies for athletes (can view their own data)
CREATE POLICY "Athletes can view own profile"
  ON athletes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Athletes can update own profile"
  ON athletes FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for coaches (can view their club's data)
CREATE POLICY "Coaches can view own profile"
  ON coaches FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policies for attendance_logs
CREATE POLICY "Athletes can view own attendance"
  ON attendance_logs FOR SELECT
  USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

-- Create RLS policies for performance_records
CREATE POLICY "Athletes can view own performance"
  ON performance_records FOR SELECT
  USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

-- Admin policies (can do everything)
CREATE POLICY "Admins can do everything on clubs"
  ON clubs FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on coaches"
  ON coaches FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on athletes"
  ON athletes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on attendance_logs"
  ON attendance_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do everything on performance_records"
  ON performance_records FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Verify tables created
SELECT 
  'Tables created successfully' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('clubs', 'coaches', 'athletes', 'user_roles', 'attendance_logs', 'performance_records');
