# Storage Setup Complete ✅

## สรุป

ระบบ Storage สำหรับการอัปโหลดเอกสารสมัครสมาชิกได้รับการตั้งค่าเรียบร้อยแล้ว

## สิ่งที่ทำเสร็จแล้ว

### 1. Storage Bucket
- **ชื่อ**: `membership-documents`
- **สถานะ**: Public bucket
- **ขนาดไฟล์สูงสุด**: 5MB
- **ไฟล์ที่รองรับ**: JPG, PNG, PDF

### 2. RLS Policies (9 policies)
- ✅ Users can upload their own documents
- ✅ Users can view their own documents  
- ✅ Users can update their own documents
- ✅ Users can delete their own documents
- ✅ Coaches can view documents in their club
- ✅ Admins can view all documents

### 3. File Structure
ไฟล์จะถูกจัดเก็บในรูปแบบ:
```
{userId}/{documentType}_{timestamp}.{ext}
```

ตัวอย่าง:
```
abc123-def456/id_card_1732345678901.jpg
abc123-def456/house_registration_1732345678902.png
abc123-def456/birth_certificate_1732345678903.pdf
```

## การทดสอบ

ทดสอบการอัปโหลดไฟล์ได้ที่:
```
http://localhost:3000/register-membership
```

1. กรอกข้อมูลในขั้นตอนที่ 1-2
2. ในขั้นตอนที่ 3 ลองอัปโหลดไฟล์ทั้ง 3 ประเภท
3. ควรอัปโหลดสำเร็จและแสดง preview

## Scripts ที่เกี่ยวข้อง

- `scripts/41-create-storage-bucket-simple.sql` - สร้าง bucket
- `scripts/42-storage-rls-policies-safe.sql` - สร้าง RLS policies
- `scripts/verify-storage-setup.sql` - ตรวจสอบการตั้งค่า

## การตรวจสอบ

รัน verification script:
```bash
./scripts/run-sql-via-api.sh scripts/verify-storage-setup.sql
```

ผลลัพธ์ที่คาดหวัง:
- `bucket_exists`: 1
- `policy_count`: 9

## หมายเหตุ

- ไฟล์จะถูกเก็บใน public bucket แต่ RLS policies จะควบคุมการเข้าถึง
- Users สามารถอัปโหลดและดูไฟล์ของตัวเองเท่านั้น
- Coaches สามารถดูไฟล์ของผู้สมัครในสโมสรของตนได้
- Admins สามารถดูไฟล์ทั้งหมดได้
