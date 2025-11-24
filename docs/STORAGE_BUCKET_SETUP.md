# Storage Bucket Setup Guide

## ปัญหา: ไม่สามารถอัปโหลดไฟล์ได้

หากคุณพบข้อผิดพลาดในการอัปโหลดไฟล์ในหน้า `/register-membership` แสดงว่า Storage bucket ยังไม่ได้ถูกสร้าง

## วิธีแก้ไข: สร้าง Storage Bucket ใน Supabase Dashboard

### ขั้นตอนที่ 1: เข้าสู่ Supabase Dashboard

1. ไปที่ [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่เมนู **Storage** ทางด้านซ้าย

### ขั้นตอนที่ 2: สร้าง Bucket ใหม่

1. คลิกปุ่ม **New bucket**
2. กรอกข้อมูลดังนี้:
   - **Name**: `membership-documents`
   - **Public bucket**: ✅ เปิด (checked)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, application/pdf`
3. คลิก **Create bucket**

### ขั้นตอนที่ 3: ตั้งค่า RLS Policies

1. คลิกที่ bucket `membership-documents` ที่เพิ่งสร้าง
2. ไปที่แท็บ **Policies**
3. คลิก **New policy**

#### Policy 1: Users can upload their own documents

```sql
-- Policy Name: Users can upload their own documents
-- Operation: INSERT
-- Target roles: authenticated

WITH CHECK (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
```

#### Policy 2: Users can view their own documents

```sql
-- Policy Name: Users can view their own documents
-- Operation: SELECT
-- Target roles: authenticated

USING (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
```

#### Policy 3: Users can update their own documents

```sql
-- Policy Name: Users can update their own documents
-- Operation: UPDATE
-- Target roles: authenticated

USING (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
```

#### Policy 4: Users can delete their own documents

```sql
-- Policy Name: Users can delete their own documents
-- Operation: DELETE
-- Target roles: authenticated

USING (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
```

#### Policy 5: Coaches can view documents in their club

```sql
-- Policy Name: Coaches can view documents in their club
-- Operation: SELECT
-- Target roles: authenticated

USING (
  bucket_id = 'membership-documents' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'coach'
    AND EXISTS (
      SELECT 1 FROM membership_applications ma
      WHERE ma.athlete_id::text = (storage.foldername(name))[1]
      AND ma.club_id = p.club_id
    )
  )
)
```

#### Policy 6: Admins can view all documents

```sql
-- Policy Name: Admins can view all documents
-- Operation: SELECT
-- Target roles: authenticated

USING (
  bucket_id = 'membership-documents' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
)
```

### ขั้นตอนที่ 4: ทดสอบการอัปโหลด

1. ไปที่ `http://localhost:3000/register-membership`
2. กรอกข้อมูลในขั้นตอนที่ 1-2
3. ในขั้นตอนที่ 3 ลองอัปโหลดไฟล์
4. ควรอัปโหลดสำเร็จโดยไม่มีข้อผิดพลาด

## การตรวจสอบ

ตรวจสอบว่า bucket ถูกสร้างแล้วโดยรัน SQL query นี้:

```sql
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'membership-documents';
```

ตรวจสอบ RLS policies:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%documents%'
ORDER BY policyname;
```

## หมายเหตุ

- Bucket ต้องเป็น **Public** เพื่อให้สามารถเข้าถึง URL ได้โดยตรง
- RLS policies จะควบคุมการเข้าถึงไฟล์ตาม user role
- ไฟล์จะถูกจัดเก็บในรูปแบบ: `{userId}/{documentType}_{timestamp}.{ext}`
- ขนาดไฟล์สูงสุด: 5MB
- รองรับไฟล์: JPG, PNG, PDF เท่านั้น

## Alternative: ใช้ Supabase CLI (สำหรับ Advanced Users)

หากคุณใช้ Supabase CLI คุณสามารถสร้าง bucket ด้วยคำสั่ง:

```bash
supabase storage create membership-documents --public
```

แล้วรัน migration script:

```bash
supabase db push
```
