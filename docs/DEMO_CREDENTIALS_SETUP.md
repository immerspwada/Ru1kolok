# 🔐 สร้างรหัส Demo ที่ใช้ได้จริง

**สถานะ**: ✅ ขั้นตอนการสร้างรหัส Demo
**วันที่อัปเดต**: 29 พฤศจิกายน 2568

---

## 📋 ขั้นตอนการสร้างรหัส Demo

### ขั้นตอนที่ 1: สร้าง Auth Users ใน Supabase

ไปที่ Supabase Dashboard:

1. ไปที่ https://app.supabase.com
2. เลือก Project: `ettpbpznktyttpnyqhkr`
3. ไปที่ **Authentication** → **Users**
4. คลิก **Add user** และสร้างผู้ใช้ 4 คน:

#### Admin User
```
Email: demo.admin@example.com
Password: Demo123456!
```

#### Coach User
```
Email: demo.coach@example.com
Password: Demo123456!
```

#### Athlete User
```
Email: demo.athlete@example.com
Password: Demo123456!
```

#### Parent User
```
Email: demo.parent@example.com
Password: Demo123456!
```

### ขั้นตอนที่ 2: ได้รับ User IDs

หลังจากสร้าง users ใน Supabase:

1. ไปที่ **Authentication** → **Users**
2. คลิกแต่ละ user เพื่อดู User ID
3. บันทึก User IDs:

```
Admin ID: [copy from Supabase]
Coach ID: [copy from Supabase]
Athlete ID: [copy from Supabase]
Parent ID: [copy from Supabase]
```

### ขั้นตอนที่ 3: อัปเดต SQL Script

แก้ไขไฟล์ `scripts/115-create-working-demo-users.sql`:

แทนที่ User IDs ด้วยค่าจริง:

```sql
-- แทนที่ค่าเหล่านี้:
'demo-admin-id-12345'    → [Admin ID จาก Supabase]
'demo-coach-id-12345'    → [Coach ID จาก Supabase]
'demo-athlete-id-1234'   → [Athlete ID จาก Supabase]
'demo-parent-id-12345'   → [Parent ID จาก Supabase]
```

### ขั้นตอนที่ 4: รัน SQL Script

```bash
cd sports-club-management

# รัน migration script
./scripts/run-sql-via-api.sh scripts/115-create-working-demo-users.sql
```

### ขั้นตอนที่ 5: ทดสอบ Login

ไปที่ Login Page:
```
http://localhost:3000/login
```

ลองใช้รหัส:
- **Email**: demo.admin@example.com
- **Password**: Demo123456!

---

## 🔑 รหัส Demo ที่ใช้ได้

| บทบาท | Email | Password | User ID |
|-------|-------|----------|---------|
| Admin | demo.admin@example.com | Demo123456! | [จาก Supabase] |
| Coach | demo.coach@example.com | Demo123456! | [จาก Supabase] |
| Athlete | demo.athlete@example.com | Demo123456! | [จาก Supabase] |
| Parent | demo.parent@example.com | Demo123456! | [จาก Supabase] |

---

## 🧪 ทดสอบ Demo Accounts

### ทดสอบ Admin
```
1. ไปที่ http://localhost:3000/login
2. ใส่ Email: demo.admin@example.com
3. ใส่ Password: Demo123456!
4. คลิก "เข้าสู่ระบบ"
5. ควรเห็น Admin Dashboard
```

### ทดสอบ Coach
```
1. ไปที่ http://localhost:3000/login
2. ใส่ Email: demo.coach@example.com
3. ใส่ Password: Demo123456!
4. คลิก "เข้าสู่ระบบ"
5. ควรเห็น Coach Dashboard
```

### ทดสอบ Athlete
```
1. ไปที่ http://localhost:3000/login
2. ใส่ Email: demo.athlete@example.com
3. ใส่ Password: Demo123456!
4. คลิก "เข้าสู่ระบบ"
5. ควรเห็น Athlete Dashboard
```

### ทดสอบ Parent
```
1. ไปที่ http://localhost:3000/login
2. ใส่ Email: demo.parent@example.com
3. ใส่ Password: Demo123456!
4. คลิก "เข้าสู่ระบบ"
5. ควรเห็น Parent Dashboard
```

---

## 🐛 แก้ไขปัญหา

### Login ล้มเหลว
```
ตรวจสอบ:
1. User มีอยู่ใน Supabase Authentication
2. Email ถูกต้อง
3. Password ถูกต้อง
4. User ยังไม่ถูก disable
```

### Dashboard ไม่โหลด
```
ตรวจสอบ:
1. Profile มีอยู่ในตาราง profiles
2. User role มีอยู่ในตาราง user_roles
3. ไม่มี RLS policy ที่บล็อก
```

### ไม่เห็น Demo Data
```
ตรวจสอบ:
1. Script 115 รันสำเร็จ
2. Club มีอยู่ในตาราง clubs
3. Training sessions มีอยู่
4. Announcements มีอยู่
```

---

## 📝 SQL Script Details

Script `115-create-working-demo-users.sql` ทำสิ่งต่อไปนี้:

1. **สร้าง Profiles** - สำหรับผู้ใช้ 4 คน
2. **สร้าง User Roles** - กำหนด admin, coach, athlete, parent
3. **สร้าง Demo Club** - สโมสรสำหรับทดสอบ
4. **สร้าง Training Session** - เซสชั่นฝึกซ้อมตัวอย่าง
5. **สร้าง Announcements** - ประกาศตัวอย่าง

---

## ✅ Checklist

- [ ] สร้าง 4 Auth Users ใน Supabase
- [ ] บันทึก User IDs
- [ ] อัปเดต SQL Script ด้วย User IDs
- [ ] รัน SQL Script
- [ ] ทดสอบ Login ด้วยรหัส Demo
- [ ] ตรวจสอบ Dashboard โหลดได้
- [ ] ตรวจสอบ Demo Data มีอยู่

---

## 🚀 ขั้นตอนถัดไป

1. ✅ สร้าง Auth Users
2. ✅ รัน SQL Script
3. ✅ ทดสอบ Login
4. ✅ ทดสอบ Features
5. ✅ Deploy ไปยัง Netlify

---

## 📞 ติดต่อ

หากมีปัญหา:
1. ตรวจสอบ Browser Console
2. ตรวจสอบ Supabase Logs
3. ตรวจสอบ Database
4. ดูเอกสาร NETLIFY_ERROR_FIX.md

---

**สถานะ**: ✅ พร้อมสำหรับการสร้างรหัส Demo
**เวลาที่ใช้**: ~10 นาที
**ความยากง่าย**: ⭐⭐ ง่าย
