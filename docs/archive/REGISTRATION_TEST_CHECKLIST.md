# Registration Flow - Manual Testing Checklist

## 🎯 Objective
ทดสอบหน้า register-membership บน production ให้แน่ใจว่าการสมัครเป็นไปอย่างราบรื่นและถูกต้อง

## 🔗 Test URL
**Production:** https://sports-club-management-nine.vercel.app/register-membership

---

## ✅ Pre-Test Verification

### System Health Check
```bash
cd sports-club-management
./scripts/run-sql-via-api.sh scripts/verify-registration-components.sql
```

Expected result: `✅ ALL SYSTEMS OPERATIONAL`

### Checklist
- [ ] Database tables exist
- [ ] Helper functions working
- [ ] RLS policies enabled
- [ ] Clubs available (23 clubs)
- [ ] Coaches assigned (1+ coaches)
- [ ] Storage bucket configured

---

## 📝 Test Case 1: Complete Registration Flow (Happy Path)

### Step 1: Account Creation
1. [ ] Open https://sports-club-management-nine.vercel.app/register-membership
2. [ ] Page loads without errors
3. [ ] Progress indicator shows "ขั้นตอนที่ 1 จาก 4"
4. [ ] Step indicator shows step 1 highlighted

**Fill in form:**
- [ ] Email: `test-user-[timestamp]@example.com` (use unique email)
- [ ] Password: `TestPassword123!` (min 8 chars, uppercase, lowercase, number)
- [ ] Confirm Password: `TestPassword123!` (must match)

**Validation checks:**
- [ ] Email format validated (shows error for invalid email)
- [ ] Password strength validated (shows error for weak password)
- [ ] Confirm password matches (shows error if mismatch)

**Submit:**
- [ ] Click "ถัดไป" button
- [ ] Loading spinner appears
- [ ] Account created successfully
- [ ] Automatically moves to Step 2

**Expected:** ✅ Account created, moved to Step 2

---

### Step 2: Personal Information
1. [ ] Progress indicator shows "ขั้นตอนที่ 2 จาก 4"
2. [ ] Step 1 shows checkmark (completed)
3. [ ] Step 2 highlighted

**Fill in form:**
- [ ] ชื่อ-นามสกุล: `ทดสอบ ระบบสมัคร`
- [ ] ชื่อเล่น: `ทดสอบ`
- [ ] เพศ: Select `ชาย` or `หญิง`
- [ ] วันเกิด: Select date (age 5-100 years)
- [ ] เบอร์โทร: `081-234-5678` (format: 0XX-XXX-XXXX)
- [ ] ที่อยู่: `123 ถนนทดสอบ แขวงทดสอบ เขทดสอบ กรุงเทพฯ 10000`
- [ ] เบอร์ติดต่อฉุกเฉิน: `081-234-5679`
- [ ] กลุ่มเลือด: `O` (optional)
- [ ] โรคประจำตัว: `ไม่มี` (optional)

**Validation checks:**
- [ ] Full name min 2 characters
- [ ] Phone number format validated
- [ ] Date of birth age range validated (5-100 years)
- [ ] Address min 10 characters

**Submit:**
- [ ] Click "ถัดไป" button
- [ ] Validation passes
- [ ] Automatically moves to Step 3

**Expected:** ✅ Personal info saved, moved to Step 3

---

### Step 3: Document Upload
1. [ ] Progress indicator shows "ขั้นตอนที่ 3 จาก 4"
2. [ ] Steps 1-2 show checkmarks
3. [ ] Step 3 highlighted
4. [ ] Info message shows: "📸 กรุณาอัปโหลดเอกสารทั้ง 5 ประเภท"

**Upload documents:**

**นักกีฬา:**
- [ ] บัตรประชาชนนักกีฬา: Upload JPG/PNG/PDF (< 5MB)
  - [ ] File picker opens
  - [ ] File uploads successfully
  - [ ] Preview/filename shows
  - [ ] Can delete and re-upload

- [ ] ทะเบียนบ้านนักกีฬา: Upload JPG/PNG/PDF (< 5MB)
  - [ ] File picker opens
  - [ ] File uploads successfully
  - [ ] Preview/filename shows

- [ ] สูติบัตร: Upload JPG/PNG/PDF (< 5MB)
  - [ ] File picker opens
  - [ ] File uploads successfully
  - [ ] Preview/filename shows

**ผู้ปกครอง:**
- [ ] บัตรประชาชนผู้ปกครอง: Upload JPG/PNG/PDF (< 5MB)
  - [ ] File picker opens
  - [ ] File uploads successfully
  - [ ] Preview/filename shows

- [ ] ทะเบียนบ้านผู้ปกครอง: Upload JPG/PNG/PDF (< 5MB)
  - [ ] File picker opens
  - [ ] File uploads successfully
  - [ ] Preview/filename shows

**Validation checks:**
- [ ] Cannot proceed without all 5 documents
- [ ] File size limit enforced (5MB)
- [ ] File type validated (JPG, PNG, PDF only)
- [ ] Error message shows for invalid files

**Submit:**
- [ ] Click "ถัดไป" button
- [ ] All documents validated
- [ ] Automatically moves to Step 4

**Expected:** ✅ All documents uploaded, moved to Step 4

---

### Step 4: Sport Selection
1. [ ] Progress indicator shows "ขั้นตอนที่ 4 จาก 4"
2. [ ] Steps 1-3 show checkmarks
3. [ ] Step 4 highlighted
4. [ ] Info message shows: "🏆 เลือกกีฬาที่คุณต้องการสมัคร"

**Select sport:**
- [ ] List of clubs/sports displays (23 clubs)
- [ ] Each club shows:
  - [ ] Sport name
  - [ ] Sport type
  - [ ] Description (if available)
- [ ] Click to select one club
- [ ] Selected club highlights
- [ ] Success message shows: "✓ คุณได้เลือกกีฬาแล้ว"

**Validation checks:**
- [ ] Must select exactly one club
- [ ] Cannot submit without selection
- [ ] Error message shows if no selection

**Submit:**
- [ ] Click "ส่งใบสมัคร" button
- [ ] Loading spinner appears with "กำลังส่ง..."
- [ ] Application submitted successfully
- [ ] Toast notification shows: "ส่งใบสมัครสำเร็จ! 🎉"
- [ ] Redirects to `/dashboard/athlete/applications`

**Expected:** ✅ Application submitted, redirected to applications page

---

### Step 5: Verify Application
1. [ ] On `/dashboard/athlete/applications` page
2. [ ] Application appears in list
3. [ ] Application shows:
   - [ ] Status: "รอการอนุมัติ" (pending)
   - [ ] Club name matches selection
   - [ ] Submission date/time
   - [ ] Personal info matches input
   - [ ] Documents count: 5 documents

**Expected:** ✅ Application visible with correct data

---

## 🔴 Test Case 2: Validation Errors

### Email Validation
- [ ] Invalid email format: Shows error "รูปแบบอีเมลไม่ถูกต้อง"
- [ ] Empty email: Shows error "กรุณากรอกอีเมล"

### Password Validation
- [ ] Too short (< 8 chars): Shows error
- [ ] No uppercase: Shows error
- [ ] No lowercase: Shows error
- [ ] No number: Shows error
- [ ] Passwords don't match: Shows error "รหัสผ่านไม่ตรงกัน"

### Personal Info Validation
- [ ] Name too short (< 2 chars): Shows error
- [ ] Invalid phone format: Shows error "รูปแบบเบอร์โทรไม่ถูกต้อง"
- [ ] Age < 5 or > 100: Shows error "อายุต้องอยู่ระหว่าง 5-100 ปี"
- [ ] Address too short (< 10 chars): Shows error

### Document Validation
- [ ] File too large (> 5MB): Shows error "ขนาดไฟล์ต้องไม่เกิน 5MB"
- [ ] Wrong file type (.txt, .doc): Shows error "ประเภทไฟล์ต้องเป็น JPG, PNG หรือ PDF"
- [ ] Missing documents: Cannot proceed to next step

---

## ⚠️ Test Case 3: Error Scenarios

### Rate Limit Error
**Scenario:** Try to create multiple accounts quickly

**Steps:**
1. [ ] Submit registration 3-5 times in quick succession
2. [ ] Should see rate limit error
3. [ ] Error message shows helpful instructions:
   - [ ] Explains rate limit (3-5 signups/hour)
   - [ ] Suggests solutions (wait, change IP, use VPN)
   - [ ] Shows expected wait time (2-24 hours)

**Expected:** ✅ Clear error message with solutions

### Duplicate Application
**Scenario:** Try to submit second application while first is pending

**Steps:**
1. [ ] Complete first application (status: pending)
2. [ ] Try to submit another application
3. [ ] Should see error: "คุณมีใบสมัครที่รอการอนุมัติอยู่แล้ว"
4. [ ] Error shows which club has pending application

**Expected:** ✅ Prevented duplicate application

### Already Logged In
**Scenario:** Access registration page while logged in

**Steps:**
1. [ ] Log in to system
2. [ ] Navigate to `/register-membership`
3. [ ] Should redirect to `/dashboard`
4. [ ] Shows loading spinner briefly

**Expected:** ✅ Redirected to dashboard

---

## 🔄 Test Case 4: Navigation & UX

### Back Button
- [ ] Step 2 → Click "ย้อนกลับ" → Returns to Step 1
- [ ] Step 3 → Click "ย้อนกลับ" → Returns to Step 2
- [ ] Step 4 → Click "ย้อนกลับ" → Returns to Step 3
- [ ] Data preserved when going back
- [ ] Can edit and proceed forward again

### Progress Indicator
- [ ] Shows current step number (1/4, 2/4, 3/4, 4/4)
- [ ] Progress bar fills correctly (25%, 50%, 75%, 100%)
- [ ] Completed steps show checkmarks
- [ ] Current step highlighted in blue
- [ ] Future steps grayed out

### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] All elements visible and usable
- [ ] No horizontal scrolling
- [ ] Buttons accessible

---

## 📊 Test Results Summary

### Test Date: _______________
### Tester: _______________

| Test Case | Status | Notes |
|-----------|--------|-------|
| Complete Flow (Happy Path) | ⬜ Pass ⬜ Fail | |
| Validation Errors | ⬜ Pass ⬜ Fail | |
| Error Scenarios | ⬜ Pass ⬜ Fail | |
| Navigation & UX | ⬜ Pass ⬜ Fail | |

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Overall Assessment
⬜ ✅ Ready for production use
⬜ ⚠️ Minor issues, can proceed with caution
⬜ ❌ Critical issues, needs fixes before use

---

## 🛠️ Troubleshooting

### If test fails, check:
1. Run verification script: `./scripts/verify-registration-components.sql`
2. Check Vercel deployment logs
3. Check Supabase logs
4. Check browser console for errors
5. Verify environment variables set correctly

### Common Issues:
- **Rate limit:** Wait or change IP address
- **Upload fails:** Check storage bucket RLS policies
- **Validation errors:** Check validation schemas in code
- **Database errors:** Check RLS policies and helper functions

---

## 📞 Support

If you encounter issues during testing:
1. Document the issue with screenshots
2. Check browser console for errors
3. Check network tab for failed requests
4. Contact development team with details
