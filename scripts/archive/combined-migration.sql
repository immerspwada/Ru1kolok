-- Combined Migration Script for Supabase Dashboard
-- Copy and paste this entire script into Supabase Dashboard > SQL Editor

-- ============================================================================
-- PART 1: Initial Schema
-- ============================================================================

-- Create custom enum types
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'athlete');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE check_in_method AS ENUM ('manual', 'qr', 'auto');
CREATE TYPE announcement_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- ============================================================================
-- USER ROLES TABLE
-- ============================================================================
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'athlete',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLUBS TABLE
-- ============================================================================
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  avatar_url TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SPORTS TABLE
-- ============================================================================
CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, club_id)
);

-- ============================================================================
-- TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, athlete_id)
);

-- ============================================================================
-- TRAINING SESSIONS TABLE
-- ============================================================================
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location VARCHAR(255),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'absent',
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_in_method check_in_method,
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, athlete_id)
);

-- ============================================================================
-- PERFORMANCE METRICS TABLE
-- ============================================================================
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority announcement_priority NOT NULL DEFAULT 'normal',
  target_role user_role,
  target_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User Roles indexes
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Profiles indexes
CREATE INDEX idx_profiles_club_id ON profiles(club_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Teams indexes
CREATE INDEX idx_teams_sport_id ON teams(sport_id);
CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_teams_coach_id ON teams(coach_id);

-- Team Members indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_athlete_id ON team_members(athlete_id);

-- Training Sessions indexes
CREATE INDEX idx_training_sessions_team_id ON training_sessions(team_id);
CREATE INDEX idx_training_sessions_scheduled_at ON training_sessions(scheduled_at);
CREATE INDEX idx_training_sessions_created_by ON training_sessions(created_by);

-- Attendance indexes
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_athlete_id ON attendance(athlete_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Performance Metrics indexes
CREATE INDEX idx_performance_metrics_athlete_id ON performance_metrics(athlete_id);
CREATE INDEX idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

-- Announcements indexes
CREATE INDEX idx_announcements_target_role ON announcements(target_role);
CREATE INDEX idx_announcements_target_team_id ON announcements(target_team_id);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: RLS Helper Functions
-- ============================================================================

-- Function to get user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user is coach
CREATE OR REPLACE FUNCTION auth.is_coach()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'coach'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user is athlete
CREATE OR REPLACE FUNCTION auth.is_athlete()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'athlete'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user is coach of a specific team
CREATE OR REPLACE FUNCTION auth.is_coach_of_team(team_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_uuid AND coach_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user is member of a specific team
CREATE OR REPLACE FUNCTION auth.is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_uuid AND athlete_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get user's club_id
CREATE OR REPLACE FUNCTION auth.user_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 3: RLS Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_ROLES POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (auth.is_admin());

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (auth.is_admin());

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  USING (auth.is_admin());

-- ============================================================================
-- CLUBS POLICIES
-- ============================================================================

CREATE POLICY "Everyone can view clubs"
  ON clubs FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  USING (auth.is_admin());

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  USING (auth.is_admin());

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins and coaches can view all profiles in their club"
  ON profiles FOR SELECT
  USING (
    auth.is_admin() OR 
    (auth.is_coach() AND club_id = auth.user_club_id())
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (auth.is_admin());

-- ============================================================================
-- SPORTS POLICIES
-- ============================================================================

CREATE POLICY "Everyone can view sports"
  ON sports FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sports"
  ON sports FOR ALL
  USING (auth.is_admin());

-- ============================================================================
-- TEAMS POLICIES
-- ============================================================================

CREATE POLICY "Users can view teams in their club"
  ON teams FOR SELECT
  USING (club_id = auth.user_club_id());

CREATE POLICY "Admins can manage all teams"
  ON teams FOR ALL
  USING (auth.is_admin());

CREATE POLICY "Coaches can manage their teams"
  ON teams FOR UPDATE
  USING (coach_id = auth.uid());

-- ============================================================================
-- TEAM_MEMBERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view team members of their teams"
  ON team_members FOR SELECT
  USING (
    auth.is_team_member(team_id) OR
    auth.is_coach_of_team(team_id) OR
    auth.is_admin()
  );

CREATE POLICY "Coaches can manage their team members"
  ON team_members FOR ALL
  USING (auth.is_coach_of_team(team_id) OR auth.is_admin());

-- ============================================================================
-- TRAINING_SESSIONS POLICIES
-- ============================================================================

CREATE POLICY "Team members can view their sessions"
  ON training_sessions FOR SELECT
  USING (
    auth.is_team_member(team_id) OR
    auth.is_coach_of_team(team_id) OR
    auth.is_admin()
  );

CREATE POLICY "Coaches can manage their team sessions"
  ON training_sessions FOR ALL
  USING (auth.is_coach_of_team(team_id) OR auth.is_admin());

-- ============================================================================
-- ATTENDANCE POLICIES
-- ============================================================================

CREATE POLICY "Athletes can view their own attendance"
  ON attendance FOR SELECT
  USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can view attendance for their sessions"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = attendance.session_id
      AND auth.is_coach_of_team(ts.team_id)
    ) OR auth.is_admin()
  );

CREATE POLICY "Coaches can manage attendance for their sessions"
  ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = attendance.session_id
      AND auth.is_coach_of_team(ts.team_id)
    ) OR auth.is_admin()
  );

-- ============================================================================
-- PERFORMANCE_METRICS POLICIES
-- ============================================================================

CREATE POLICY "Athletes can view their own metrics"
  ON performance_metrics FOR SELECT
  USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can view metrics for their team members"
  ON performance_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.athlete_id = performance_metrics.athlete_id
      AND auth.is_coach_of_team(tm.team_id)
    ) OR auth.is_admin()
  );

CREATE POLICY "Coaches and admins can insert metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (auth.is_coach() OR auth.is_admin());

CREATE POLICY "Coaches and admins can update metrics"
  ON performance_metrics FOR UPDATE
  USING (auth.is_coach() OR auth.is_admin());

-- ============================================================================
-- ANNOUNCEMENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view announcements targeted to them"
  ON announcements FOR SELECT
  USING (
    (target_role IS NULL OR target_role = auth.user_role()) AND
    (target_team_id IS NULL OR auth.is_team_member(target_team_id)) AND
    (published_at IS NOT NULL AND published_at <= NOW()) AND
    (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Admins and coaches can manage announcements"
  ON announcements FOR ALL
  USING (auth.is_admin() OR auth.is_coach());

-- ============================================================================
-- AUDIT_LOGS POLICIES
-- ============================================================================

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (auth.is_admin());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
