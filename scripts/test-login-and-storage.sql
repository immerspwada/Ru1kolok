-- ===================================================================
-- ทดสอบระบบ Login และ Storage ใน Supabase
-- ===================================================================

-- 1. ตรวจสอบว่า auth.users มีข้อมูลผู้ใช้
SELECT 
    'Auth Users Check' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_with_login
FROM auth.users;

-- 2. ตรวจสอบว่า profiles table มีข้อมูลที่ sync กับ auth.users
SELECT 
    'Profiles Sync Check' as test_name,
    COUNT(DISTINCT p.id) as profiles_count,
    COUNT(DISTINCT u.id) as auth_users_count,
    COUNT(DISTINCT p.id) - COUNT(DISTINCT u.id) as difference
FROM profiles p
FULL OUTER JOIN auth.users u ON p.id = u.id;

-- 3. ตรวจสอบ roles ของผู้ใช้
SELECT 
    'User Roles Distribution' as test_name,
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- 4. ตรวจสอบว่า storage bucket สำหรับเอกสารมีอยู่หรือไม่
SELECT 
    'Storage Buckets Check' as test_name,
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets
WHERE name IN ('membership-documents', 'profile-images', 'documents');

-- 5. ตรวจสอบ RLS policies สำหรับ storage
SELECT 
    'Storage RLS Policies' as test_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- 6. ตรวจสอบว่ามีเอกสารใน storage หรือไม่
SELECT 
    'Storage Objects Count' as test_name,
    bucket_id,
    COUNT(*) as total_files,
    pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects
GROUP BY bucket_id;

-- 7. ตรวจสอบ login_sessions table (ถ้ามี)
SELECT 
    'Login Sessions Check' as test_name,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_sessions,
    COUNT(DISTINCT user_id) as unique_users_logged_in
FROM login_sessions
WHERE created_at > NOW() - INTERVAL '30 days';

-- 8. ตรวจสอบ membership_applications และเอกสารที่แนบ
SELECT 
    'Membership Applications with Documents' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN jsonb_array_length(documents) > 0 THEN 1 END) as apps_with_documents,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_apps,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_apps
FROM membership_applications;

-- 9. ทดสอบ RLS policies สำหรับ profiles (ผู้ใช้ควรเห็นข้อมูลตัวเองได้)
SELECT 
    'Profiles RLS Policies' as test_name,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 10. ตรวจสอบ auth helper functions
SELECT 
    'Auth Helper Functions' as test_name,
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_admin',
    'is_coach', 
    'is_athlete',
    'get_user_role',
    'can_manage_club'
)
ORDER BY routine_name;

-- 11. สรุปสถานะระบบ
SELECT 
    'System Health Summary' as test_name,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM clubs) as total_clubs,
    (SELECT COUNT(*) FROM storage.buckets) as total_storage_buckets,
    (SELECT COUNT(*) FROM storage.objects) as total_stored_files,
    (SELECT COUNT(*) FROM membership_applications WHERE status = 'pending') as pending_applications;
