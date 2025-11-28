-- สคริปต์ตรวจสอบสถานะฐานข้อมูลทั้งหมด

-- 1. ตรวจสอบ Tables ที่มีอยู่
SELECT '=== TABLES ===' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. ตรวจสอบ Columns ใน profiles table
SELECT '' as section;
SELECT '=== PROFILES TABLE COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ตรวจสอบ RLS status
SELECT '' as section;
SELECT '=== RLS STATUS ===' as section;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'clubs', 'user_roles')
  AND schemaname = 'public';

-- 4. ตรวจสอบ RLS Policies
SELECT '' as section;
SELECT '=== RLS POLICIES ===' as section;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. ตรวจสอบ Users ใน auth.users
SELECT '' as section;
SELECT '=== AUTH USERS ===' as section;
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 6. ตรวจสอบ Profiles records
SELECT '' as section;
SELECT '=== PROFILES RECORDS ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 7. ตรวจสอบ Custom Types
SELECT '' as section;
SELECT '=== CUSTOM TYPES ===' as section;
SELECT 
  t.typname as type_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
