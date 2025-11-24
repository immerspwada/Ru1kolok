-- ===================================================================
-- สร้าง Test User สำหรับทดสอบ Login และ Storage
-- ===================================================================

-- 1. สร้าง storage bucket สำหรับเอกสาร (ถ้ายังไม่มี)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'membership-documents',
  'membership-documents',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- 2. ลบ RLS policies เก่าของ storage.objects (ถ้ามี)
DROP POLICY IF EXISTS "Users can upload membership documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own membership documents" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can view club membership documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all membership documents" ON storage.objects;

-- 3. สร้าง RLS policies ใหม่สำหรับ storage.objects
CREATE POLICY "Users can upload membership documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'membership-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own membership documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Coaches can view club membership documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents'
  AND EXISTS (
    SELECT 1 FROM coaches c
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all membership documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- 4. สร้าง test user สำหรับทดสอบ (ถ้ายังไม่มี)
DO $$
DECLARE
  v_user_id UUID;
  v_club_id UUID;
BEGIN
  -- ลบ user เก่าถ้ามี
  DELETE FROM auth.users WHERE email = 'test-login@example.com';
  
  -- สร้าง user ใหม่
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'test-login@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  RETURNING id INTO v_user_id;
  
  -- หา club ที่มีอยู่
  SELECT id INTO v_club_id FROM clubs LIMIT 1;
  
  -- สร้าง profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    club_id,
    membership_status
  ) VALUES (
    v_user_id,
    'test-login@example.com',
    'Test Login User',
    'athlete',
    v_club_id,
    'active'
  );
  
  -- สร้าง athlete record
  INSERT INTO athletes (
    user_id,
    club_id,
    email,
    first_name,
    last_name,
    date_of_birth,
    phone_number
  ) VALUES (
    v_user_id,
    v_club_id,
    'test-login@example.com',
    'Test',
    'Login User',
    '2000-01-01',
    '0812345678'
  );
  
  RAISE NOTICE 'Test user created successfully!';
  RAISE NOTICE 'Email: test-login@example.com';
  RAISE NOTICE 'Password: TestPassword123!';
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- 5. แสดงสรุป
SELECT 
    'Setup Complete' as status,
    (SELECT COUNT(*) FROM storage.buckets WHERE name = 'membership-documents') as bucket_exists,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') as storage_policies,
    (SELECT id FROM auth.users WHERE email = 'test-login@example.com') as test_user_id;
