# Device Tracking Implementation Complete ✅

## Overview
เพิ่มระบบติดตามอุปกรณ์ (Device Tracking) เข้าในระบบเพื่อบันทึกว่าผู้ใช้ login และเช็คอินจากอุปกรณ์ไหน

## Features Implemented

### 1. Database Schema
- **login_sessions table**: เก็บประวัติการ login พร้อม device information
  - `device_id`: Unique identifier ของอุปกรณ์
  - `device_info`: ข้อมูลเพิ่มเติม (platform, screen resolution, timezone, etc.)
  - `user_agent`: Browser/app user agent
  - `ip_address`: IP address (optional)
  - `login_at`: เวลา login
  - `logout_at`: เวลา logout

- **attendance_logs & attendance tables**: เพิ่ม device tracking columns
  - `device_id`: อุปกรณ์ที่ใช้เช็คอิน
  - `device_info`: ข้อมูลอุปกรณ์

### 2. Device Fingerprinting
**File**: `lib/utils/device-fingerprint.ts`

สร้าง unique device ID จาก browser characteristics:
- User agent
- Screen resolution
- Language
- Timezone
- Platform

```typescript
import { getDeviceInfo } from '@/lib/utils/device-fingerprint';

const deviceInfo = getDeviceInfo();
// Returns: { deviceId, userAgent, platform, language, screenResolution, timezone }
```

### 3. Auth Integration
**File**: `lib/auth/actions.ts`

- `signIn()`: รับ deviceInfo parameter และบันทึกลง login_sessions
- `signOut()`: บันทึก logout_at เมื่อผู้ใช้ออกจากระบบ

### 4. Device Tracking Actions
**File**: `lib/auth/device-tracking.ts`

```typescript
// Record login session
await recordLoginSession(userId, deviceInfo, ipAddress);

// Record logout
await recordLogoutSession(userId, deviceId);

// Get device statistics
await getDeviceStatistics(userId);

// Get recent login sessions
await getRecentLoginSessions(userId, limit);
```

### 5. Admin Dashboard
**Page**: `/dashboard/admin/devices`

แสดงข้อมูล:
- สถิติการใช้งานแต่ละอุปกรณ์
- จำนวนครั้งที่ login
- จำนวนครั้งที่เช็คอิน
- Login sessions ล่าสุด
- สถานะ active/logged out

### 6. RLS Policies
- Users สามารถดู login sessions ของตัวเองได้
- Admins สามารถดู login sessions ทั้งหมดได้
- Service role สามารถ insert login sessions ได้

### 7. Database Function
**Function**: `get_device_statistics(p_user_id)`

คำนวณสถิติการใช้งานอุปกรณ์:
- จำนวนครั้งที่ login
- Login ล่าสุด
- จำนวนครั้งที่เช็คอิน

## Migration Applied

```bash
./scripts/run-sql-via-api.sh scripts/18-add-device-tracking.sql
```

✅ Migration executed successfully

## Usage Examples

### 1. Login with Device Tracking
```typescript
import { signIn } from '@/lib/auth/actions';
import { getDeviceInfo } from '@/lib/utils/device-fingerprint';

const deviceInfo = getDeviceInfo();
const result = await signIn(email, password, deviceInfo);
```

### 2. Check Device Statistics
```typescript
import { getDeviceStatistics } from '@/lib/auth/device-tracking';

const { data } = await getDeviceStatistics(userId);
// Returns array of device stats
```

### 3. View Recent Sessions
```typescript
import { getRecentLoginSessions } from '@/lib/auth/device-tracking';

const { data } = await getRecentLoginSessions(userId, 10);
// Returns last 10 login sessions
```

## Future Use Cases

### Attendance Check-in Tracking
เมื่อมีการเช็คอิน สามารถบันทึก device_id ได้:

```typescript
await supabase.from('attendance_logs').insert({
  training_session_id,
  athlete_id,
  status: 'present',
  check_in_method: 'qr',
  device_id: deviceInfo.deviceId,
  device_info: deviceInfo,
});
```

### Security Monitoring
- ตรวจจับการ login จากอุปกรณ์ใหม่
- แจ้งเตือนเมื่อมีการ login จากอุปกรณ์ที่ไม่รู้จัก
- ติดตามการใช้งานที่ผิดปกติ

### Analytics
- วิเคราะห์ว่าผู้ใช้ใช้อุปกรณ์ประเภทไหนมากที่สุด
- ดูเวลาที่ผู้ใช้ active
- วิเคราะห์พฤติกรรมการเช็คอิน

## Files Modified/Created

### Created
- `scripts/18-add-device-tracking.sql`
- `lib/auth/device-tracking.ts`
- `lib/utils/device-fingerprint.ts`
- `app/dashboard/admin/devices/page.tsx`

### Modified
- `lib/auth/actions.ts` - เพิ่ม device tracking ใน signIn/signOut
- `components/auth/SimpleLoginForm.tsx` - ส่ง device info ตอน login

## Database Tables

### login_sessions
```sql
CREATE TABLE login_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    device_id TEXT NOT NULL,
    device_info JSONB,
    ip_address TEXT,
    user_agent TEXT,
    login_at TIMESTAMPTZ,
    logout_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);
```

### Indexes
- `idx_login_sessions_user_id`
- `idx_login_sessions_device_id`
- `idx_login_sessions_login_at`
- `idx_attendance_logs_device_id`
- `idx_attendance_device_id`

## Testing

ทดสอบโดย:
1. Login เข้าระบบ → ระบบจะบันทึก device ID อัตโนมัติ
2. เข้า `/dashboard/admin/devices` → ดูข้อมูล device tracking
3. Logout → ระบบจะบันทึก logout_at

## Notes

- Device ID ไม่ใช่ข้อมูลส่วนตัว แต่เป็น fingerprint ที่สร้างจาก browser characteristics
- ไม่มีการเก็บข้อมูลที่ระบุตัวตนของอุปกรณ์ (MAC address, IMEI, etc.)
- Device ID อาจเปลี่ยนได้ถ้าผู้ใช้เปลี่ยน browser หรือ clear cookies
- เหมาะสำหรับ tracking และ analytics ไม่ใช่ security authentication

---

**Completed**: November 22, 2025
**Migration**: scripts/18-add-device-tracking.sql
**Status**: ✅ Ready for use
