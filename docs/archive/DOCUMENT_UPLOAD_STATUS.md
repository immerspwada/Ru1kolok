# สถานะการอัพโหลดเอกสาร

## ✅ ผลการตรวจสอบ

### 1. Code พร้อมใช้งาน ✅
- `lib/membership/storage.ts` - มี functions สำหรับ upload/download/delete
- `lib/membership/validation.ts` - มี validation สำหรับไฟล์
- Components มีการใช้งาน storage functions

### 2. Database Schema ✅
- `membership_applications.documents` - เก็บเป็น JSONB array
- รองรับหลายเอกสารต่อ application

### 3. Storage Bucket ❌ ยังไม่ได้สร้าง
- Bucket `membership-documents` ยังไม่มีในระบบ
- ต้องสร้างผ่าน Supabase Dashboard

---

## 🔧 วิธีแก้ไข: สร้าง Storage Bucket

### ขั้นตอนที่ 1: สร้าง Bucket
1. ไปที่ Supabase Dashboard → Storage
2. คลิก "New bucket"
3. ตั้งค่า:
   - Name: `membership-documents`
   - Public: ✅ เปิด
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg,image/png,application/pdf`

### ขั้นตอนที่ 2: ตั้งค่า RLS Policies
รัน script: `./scripts/run-sql-via-api.sh scripts/42-storage-rls-policies.sql`

---

## 📋 การทดสอบหลังสร้าง Bucket

```bash
# 1. ตรวจสอบว่า bucket ถูกสร้างแล้ว
./scripts/run-sql-via-api.sh scripts/verify-storage-setup.sql

# 2. ทดสอบอัพโหลดผ่าน UI
# ไปที่ production URL → Register → อัพโหลดเอกสาร

# 3. ตรวจสอบไฟล์ที่อัพโหลด
./scripts/run-sql-via-api.sh scripts/test-document-upload.sql
```

---

## 📖 เอกสารเพิ่มเติม

อ่านรายละเอียดได้ที่: `docs/STORAGE_BUCKET_SETUP.md`
