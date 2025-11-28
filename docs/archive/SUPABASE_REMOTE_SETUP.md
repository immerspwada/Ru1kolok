# Supabase Remote Setup Guide

คู่มือการเชื่อมต่อกับ Supabase Remote Database

## ⚠️ สำคัญ: ใช้ Remote เท่านั้น

โปรเจคนี้ใช้ **Remote Supabase เท่านั้น** ไม่ใช้ Local Supabase

---

## ขั้นตอนที่ 1: สร้าง Supabase Project (ถ้ายังไม่มี)

1. ไปที่ https://supabase.com/dashboard
2. คลิก "New Project"
3. กรอกข้อมูล:
   - **Name**: sports-club-management
   - **Database Password**: เลือก password ที่แข็งแรง (เก็บไว้ใช้ภายหลัง)
   - **Region**: เลือกที่ใกล้ที่สุด (แนะนำ Southeast Asia)
4. คลิก "Create new project"
5. รอ 2-3 นาทีให้ project สร้างเสร็จ

---

## ขั้นตอนที่ 2: เก็บข้อมูล Project

### 2.1 หา Project Reference ID

1. ไปที่ **Settings** > **General**
2. คัดลอก **Reference ID** (จะเป็นรูปแบบ: `abcdefghijklmnop`)

### 2.2 หา API Keys

1. ไปที่ **Settings** > **API**
2. คัดลอกข้อมูลเหล่านี้:
   - **Project URL**: `https://[your-ref].supabase.co`
   - **anon public key**: `eyJhbGc...` (key ยาวๆ)
   - **service_role key**: `eyJhbGc...` (key ยาวๆ อีกอัน)

---

## ขั้นตอนที่ 3: ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ อย่าลืม:** ใส่ค่าจริงแทน `[your-project-ref]` และ keys

---

## ขั้นตอนที่ 4: Link Project กับ Supabase CLI

```bash
cd sports-club-management
supabase link --project-ref YOUR_PROJECT_REF
```

เมื่อถูกถาม database password ให้ใส่ password ที่ตั้งไว้ตอนสร้าง project

**ตัวอย่าง:**
```bash
supabase link --project-ref abcdefghijklmnop
Enter your database password: ********
```

---

## ขั้นตอนที่ 5: Push Migrations ไปยัง Remote Database

```bash
npm run db:push
```

คำสั่งนี้จะ:
- อ่าน migrations ทั้งหมดใน `supabase/migrations/`
- Push ไปยัง remote database
- สร้าง tables, functions, และ policies ทั้งหมด

---

## คำสั่งที่ใช้บ่อย

### Push migrations ทั้งหมด
```bash
npm run db:push
```

### รัน SQL file เดี่ยว
```bash
npm run db:exec supabase/migrations/20240101000000_initial_schema.sql
```

### ตรวจสอบสถานะการเชื่อมต่อ
```bash
npm run db:status
```

### Link project ใหม่
```bash
npm run db:link
```

---

## การตรวจสอบว่าเชื่อมต่อสำเร็จ

### 1. ตรวจสอบผ่าน CLI
```bash
cd sports-club-management
supabase projects list
```

ควรเห็น project ของคุณในรายการ

### 2. ตรวจสอบผ่าน Dashboard

1. ไปที่ https://supabase.com/dashboard
2. เลือก project ของคุณ
3. ไปที่ **Database** > **Tables**
4. ควรเห็น tables ที่สร้างจาก migrations:
   - `profiles`
   - `sports`
   - `teams`
   - `training_sessions`
   - `attendance`
   - `performance_metrics`
   - `audit_logs`

### 3. ตรวจสอบ Migrations

ไปที่ **Database** > **Migrations** ใน Supabase Dashboard
ควรเห็น migrations ที่ push ไปแล้ว

---

## Troubleshooting

### ❌ Error: "No project linked"

**วิธีแก้:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### ❌ Error: "Invalid project ref"

**วิธีแก้:**
1. ตรวจสอบ project ref ใน Supabase Dashboard > Settings > General
2. ตรวจสอบว่าคัดลอกถูกต้อง (ไม่มีช่องว่าง)

### ❌ Error: "Authentication failed"

**วิธีแก้:**
1. ตรวจสอบ database password
2. Reset password ใน Supabase Dashboard > Settings > Database
3. Link project ใหม่

### ❌ Error: "Missing environment variables"

**วิธีแก้:**
1. ตรวจสอบไฟล์ `.env.local`
2. ตรวจสอบว่ามีค่าทั้ง 3 ตัว:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## ข้อควรระวัง

⚠️ **ห้ามใช้ Local Supabase**
- โปรเจคนี้ใช้ Remote เท่านั้น
- ไม่ต้องรัน `supabase start`
- ไม่ต้องติดตั้ง Docker

⚠️ **Service Role Key เป็นความลับ**
- อย่า commit `.env.local` เข้า git
- อย่าแชร์ service_role key กับใคร
- ใช้เฉพาะฝั่ง server เท่านั้น

⚠️ **Database Password**
- เก็บไว้ในที่ปลอดภัย
- ใช้สำหรับ link project กับ CLI
- ถ้าลืมสามารถ reset ได้ใน Dashboard

---

## ขั้นตอนถัดไป

หลังจาก setup เสร็จแล้ว:

1. ✅ ตรวจสอบว่า migrations push สำเร็จ
2. ✅ ทดสอบการเชื่อมต่อจาก Next.js app
3. ✅ ตรวจสอบ RLS policies ทำงานถูกต้อง
4. ✅ เริ่มพัฒนา features ต่อไป

---

## ต้องการความช่วยเหลือ?

- Supabase Docs: https://supabase.com/docs
- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Community: https://github.com/supabase/supabase/discussions
