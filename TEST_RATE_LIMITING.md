# Rate Limiting Test Guide

## What's Being Tested
Supabase's built-in rate limiting for signup attempts.

## Expected Behavior
- **Normal usage**: Registration works fine
- **Rapid attempts**: After 3-5 attempts within an hour, you'll see:
  ```
  ลองสมัครบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (1-2 นาที)
  ```

## Test Scenarios

### ✅ Scenario 1: Normal Registration (Should Work)
1. Go to `/register`
2. Enter a new email (e.g., `test1@example.com`)
3. Enter password (min 8 characters)
4. Click "สร้างบัญชี"
5. **Expected**: Success, redirect to `/register-membership`

### ✅ Scenario 2: Duplicate Email (Should Show Error)
1. Try to register with the same email again
2. **Expected**: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น"

### ✅ Scenario 3: Rate Limiting (Should Trigger After Multiple Attempts)
1. Try to register 4-5 times rapidly with different emails
2. **Expected**: After 3-5 attempts, you'll see the rate limit message
3. **Wait**: 1-2 minutes
4. **Try again**: Should work after waiting

## How to Test Without Hitting Rate Limits

### Option 1: Use Different IPs
- Use VPN or mobile hotspot
- Each IP has its own rate limit counter

### Option 2: Wait Between Tests
- Wait 1-2 minutes between registration attempts
- Rate limit resets gradually

### Option 3: Test in Production
- Production Supabase may have different rate limits
- Check your Supabase dashboard for rate limit settings

## Checking Supabase Rate Limit Settings

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Rate Limits**
3. Check the settings for:
   - `auth.signup` endpoint
   - Default is usually 3-5 requests per hour per IP

## If Rate Limiting is Too Aggressive

### For Development:
You can temporarily disable or increase rate limits in Supabase Dashboard:
1. Go to **Authentication** → **Rate Limits**
2. Adjust the `auth.signup` limit
3. Or disable rate limiting for development

### For Production:
Keep rate limiting enabled for security. The current settings are reasonable:
- Prevents spam accounts
- Allows legitimate users to register
- 1-2 minute cooldown is acceptable

## Current Implementation Status

✅ **Working correctly**:
- Rate limit detection in `lib/auth/actions.ts` (line 29)
- Thai error message translation
- User-friendly error display in registration form

✅ **No custom rate limiting needed**:
- Supabase handles this automatically
- Your code just needs to detect and translate the error

## Recommendations

1. **Keep the current implementation** - It's working as designed
2. **Monitor in production** - Check if users complain about rate limits
3. **Adjust if needed** - Only if legitimate users are being blocked
4. **Document for users** - Add a note in the registration form if needed

## Optional: Add User-Friendly Notice

If rate limiting becomes an issue, you could add a notice to the registration form:

```tsx
<div className="text-xs text-gray-500 mt-2">
  หมายเหตุ: เพื่อความปลอดภัย ระบบจำกัดการสมัครสมาชิก 3 ครั้งต่อชั่วโมง
</div>
```
