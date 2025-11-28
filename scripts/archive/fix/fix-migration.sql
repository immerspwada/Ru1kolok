-- สร้าง types (ข้ามถ้ามีอยู่แล้ว)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'coach', 'athlete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE check_in_method AS ENUM ('manual', 'qr', 'auto');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- สร้าง clubs table (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง profiles table (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'athlete',
  phone_number VARCHAR(20),
  date_of_birth DATE,
  avatar_url TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  address TEXT,
  specialization VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม column role ถ้ายังไม่มี
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'athlete';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_club_id ON profiles(club_id);

-- แสดงผลลัพธ์
SELECT 'Migration completed successfully!' as message;

-- แสดง tables ที่มี
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
