# 🔧 แก้ไขปัญหา Demo Login ไม่ทำงาน

**ปัญหา**: อีเมลหรือรหัสผ่านไม่ถูกต้อง
**สาเหตุ**: User IDs ไม่ตรงกับ Supabase Auth

---

## ✅ วิธีแก้ไข - 3 ขั้นตอน

### ขั้นตอนที่ 1: ตรวจสอบ User IDs ใน Supabase

1. ไปที่ https://app.supabase.com
2. เลือก Project: `ettpbpznktyttpnyqhkr`
3. ไปที่ **Authentication** → **Users**
4. บันทึก User ID ของแต่ละ user:

```
Admin User ID: [copy from Supabase]
Coach User ID: [copy from Supabase]
Athlete User ID: [copy from Supabase]
Parent User ID: [copy from Supabase]
```

### ขั้นตอนที่ 2: ลบ Demo Users เก่า

รัน SQL เพื่อลบข้อมูลเก่า:

```bash
./scripts/run-sql-via-api.sh << 'EOF'
DELETE FROM public.profiles WHERE email LIKE 'demo.%@example.com';
DELETE FROM public.user_roles WHERE user_id LIKE 'demo-%';
DELETE FROM public.clubs WHERE id = 'demo-club-id-123456';
EOF
```

### ขั้นตอนที่ 3: สร้าง Demo Users ใหม่ด้วย User IDs จริง

สร้างไฟล์ `scripts/116-fix-demo-users.sql`:

```sql
-- แทนที่ค่าเหล่านี้ด้วย User IDs จริงจาก Supabase:
-- ADMIN_ID: [copy from Supabase]
-- COACH_ID: [copy from Supabase]
-- ATHLETE_ID: [copy from Supabase]
-- PARENT_ID: [copy from Supabase]

BEGIN;

-- สร้าง Profiles
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  phone_number,
  date_of_birth,
  gender,
  membership_status,
  created_at,
  updated_at
) VALUES
(
  'ADMIN_ID',
  'demo.admin@example.com',
  'Demo Admin',
  '+66812345678',
  '1990-01-15',
  'M',
  'active',
  NOW(),
  NOW()
),
(
  'COACH_ID',
  'demo.coach@example.com',
  'Demo Coach',
  '+66812345679',
  '1985-03-20',
  'M',
  'active',
  NOW(),
  NOW()
),
(
  'ATHLETE_ID',
  'demo.athlete@example.com',
  'Demo Athlete',
  '+66812345680',
  '2000-05-10',
  'M',
  'active',
  NOW(),
  NOW()
),
(
  'PARENT_ID',
  'demo.parent@example.com',
  'Demo Parent',
  '+66812345681',
  '1970-07-25',
  'F',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- สร้าง User Roles
INSERT INTO public.user_roles (user_id, role, created_at) VALUES
('ADMIN_ID', 'admin', NOW()),
('COACH_ID', 'coach', NOW()),
('ATHLETE_ID', 'athlete', NOW()),
('PARENT_ID', 'parent', NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- สร้าง Demo Club
INSERT INTO public.clubs (
  id,
  name,
  description,
  location,
  sport_type,
  created_at,
  updated_at
) VALUES
(
  'demo-club-001',
  'Demo Sports Club',
  'Demo club for testing',
  'Bangkok, Thailand',
  'Badminton',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Assign Coach to Club
INSERT INTO public.club_coaches (club_id, coach_id, created_at) VALUES
('demo-club-001', 'COACH_ID', NOW())
ON CONFLICT (club_id, coach_id) DO NOTHING;

COMMIT;

SELECT 'Demo users fixed successfully!' as status;
```

---

## 🔑 รหัส Demo ที่ใช้ได้

```
Email: demo.admin@example.com
Password: Demo123456!

Email: demo.coach@example.com
Password: Demo123456!

Email: demo.athlete@example.com
Password: Demo123456!

Email: demo.parent@example.com
Password: Demo123456!
```

---

## 🧪 ทดสอบ

1. ไปที่ http://localhost:3000/login
2. ใส่ Email: demo.admin@example.com
3. ใส่ Password: Demo123456!
4. คลิก "เข้าสู่ระบบ"

---

## 📋 Checklist

- [ ] บันทึก User IDs จาก Supabase
- [ ] ลบ Demo Users เก่า
- [ ] สร้างไฟล์ 116-fix-demo-users.sql
- [ ] แทนที่ User IDs ด้วยค่าจริง
- [ ] รัน SQL Script
- [ ] ทดสอบ Login

---

**สถานะ**: ✅ พร้อมแก้ไข
