-- ตรวจสอบ schema ที่มีอยู่

-- ตรวจสอบ tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ตรวจสอบ columns ใน profiles table (ถ้ามี)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
