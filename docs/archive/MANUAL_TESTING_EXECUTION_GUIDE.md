# Manual Testing Execution Guide - Membership Approval System

**Test Date:** 2025-11-23  
**Tester:** [Your Name]  
**Environment:** Development (localhost:3000)  
**Server Status:** ✅ Running

---

## Pre-Test Setup

### 1. Verify Development Server
```bash
# Server should be running at http://localhost:3000
# Check process: npm run dev
```
✅ **Status:** Server is running

### 2. Verify Database Connection
- Supabase URL: Check `.env.local` for `NEXT_PUBLIC_SUPABASE_URL`
- Database should have all migrations applied (scripts 01-40)

### 3. Test User Accounts Available
- ✅ admin@test.com (Admin)
- ✅ coach@test.com (Coach)  
- ✅ athlete@test.com (Athlete - may need to check status)

---

## Testing Execution Plan

### Phase 1: Registration Flow Testing (30 minutes)

#### Test 1.1: New Athlete Registration
**Objective:** Verify complete registration flow (AC1)

**Steps:**
1. Open browser: `http://localhost:3000`
2. Click "Register" or navigate to `/register`
3. Fill in registration form:
   - Email: `newathlete1@test.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
4. Submit registration
5. If OTP verification required, check email or Supabase auth logs
6. After email verification, navigate to `/register-membership`
7. Fill in personal information:
   - First Name: "Test"
   - Last Name: "Athlete 1"
   - Date of Birth: "2000-01-01"
   - Phone: "0812345678"
8. **IMPORTANT:** Select a CLUB (not a coach)
9. Upload test documents (if required)
10. Submit application

**Expected Results:**
- [ ] Registration successful
- [ ] Email verification completed
- [ ] Membership application form accessible
- [ ] Club selection available (NOT coach selection)
- [ ] Application submitted with status='pending'
- [ ] Redirected to `/pending-approval` page
- [ ] See message "รอการอนุมัติ" or "Pending Approval"

**Database Verification:**
```sql
-- Check application was created
SELECT id, applicant_id, club_id, status, created_at
FROM membership_applications
WHERE applicant_id IN (
  SELECT id FROM profiles WHERE email = 'newathlete1@test.com'
);

-- Check profile status
SELECT id, email, membership_status, club_id, coach_id
FROM profiles
WHERE email = 'newathlete1@test.com';
```

**Expected Database State:**
- membership_applications.status = 'pending'
- membership_applications.club_id = [selected club id]
- membership_applications.assigned_coach_id = NULL
- profiles.membership_status = 'pending'
- profiles.club_id = NULL (or same as application)
- profiles.coach_id = NULL

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 1.2: Pending State Access Restrictions
**Objective:** Verify pending athletes cannot access dashboard (AC6)

**Steps:**
1. Login as `newathlete1@test.com` (from Test 1.1)
2. Attempt to navigate to `/dashboard/athlete`
3. Attempt to navigate to `/dashboard/athlete/schedule`
4. Attempt to navigate to `/dashboard/athlete/attendance`
5. Check current page URL

**Expected Results:**
- [ ] All dashboard attempts redirect to `/pending-approval`
- [ ] Pending approval page shows:
  - Status: "รอการอนุมัติ" or "Pending"
  - Club name applied to
  - Application date
  - Message explaining waiting for coach approval
- [ ] No access to athlete features
- [ ] No navigation menu for athlete dashboard

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 1.3: Duplicate Application Prevention
**Objective:** Verify cannot submit duplicate pending applications (AC7, BR1)

**Steps:**
1. Still logged in as `newathlete1@test.com`
2. Navigate to `/register-membership`
3. Attempt to fill and submit another application

**Expected Results:**
- [ ] Error message displayed: "มีคำขอรออนุมัติอยู่แล้ว" or similar
- [ ] Cannot submit second application
- [ ] Shown existing application status
- [ ] Redirected back to pending approval page

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

### Phase 2: Coach Review Testing (30 minutes)

#### Test 2.1: Coach Login and Application Visibility
**Objective:** Verify coach sees only their club's applications (AC2)

**Steps:**
1. Logout from athlete account
2. Login as `coach@test.com` / `Coach123!`
3. Navigate to `/dashboard/coach/applications`
4. View list of pending applications

**Expected Results:**
- [ ] Can access coach dashboard
- [ ] Applications page loads successfully
- [ ] See pending application from `newathlete1@test.com`
- [ ] Application shows:
  - Applicant name
  - Application date
  - Club name (should match coach's club)
  - Status: "pending"
- [ ] Do NOT see applications from other clubs (if any exist)

**Database Verification:**
```sql
-- Check coach's club
SELECT id, email, club_id, role
FROM profiles
WHERE email = 'coach@test.com';

-- Check applications for coach's club
SELECT ma.id, ma.applicant_id, ma.club_id, ma.status, p.email
FROM membership_applications ma
JOIN profiles p ON p.id = ma.applicant_id
WHERE ma.club_id = (
  SELECT club_id FROM profiles WHERE email = 'coach@test.com'
);
```

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 2.2: Coach Approves Application
**Objective:** Verify approval process works correctly (AC3, AC4)

**Steps:**
1. Still logged in as coach
2. On applications page, find `newathlete1@test.com` application
3. Click to view application details
4. Review applicant information
5. Click "อนุมัติ" or "Approve" button
6. Confirm approval if prompted

**Expected Results:**
- [ ] Approval action completes successfully
- [ ] Success message displayed
- [ ] Application disappears from pending list (or status changes)
- [ ] No errors in console

**Database Verification:**
```sql
-- Check application status changed
SELECT id, applicant_id, status, reviewed_at, reviewed_by, assigned_coach_id
FROM membership_applications
WHERE applicant_id IN (
  SELECT id FROM profiles WHERE email = 'newathlete1@test.com'
);

-- Check profile was updated
SELECT id, email, membership_status, club_id, coach_id
FROM profiles
WHERE email = 'newathlete1@test.com';
```

**Expected Database State:**
- membership_applications.status = 'approved'
- membership_applications.reviewed_at = [timestamp]
- membership_applications.reviewed_by = [coach user_id]
- membership_applications.assigned_coach_id = [coach user_id]
- profiles.membership_status = 'active'
- profiles.club_id = [coach's club_id]
- profiles.coach_id = [coach user_id]

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 2.3: Approved Athlete Access
**Objective:** Verify approved athlete can now access dashboard (AC4)

**Steps:**
1. Logout from coach account
2. Login as `newathlete1@test.com`
3. Navigate to `/dashboard/athlete`
4. Check dashboard features

**Expected Results:**
- [ ] Successfully access athlete dashboard
- [ ] Dashboard displays:
  - Welcome message with athlete name
  - Assigned coach information
  - Club information
  - Training schedule (if any sessions exist)
  - Quick actions (check-in, view schedule, etc.)
- [ ] Can navigate to:
  - `/dashboard/athlete/schedule` ✅
  - `/dashboard/athlete/attendance` ✅
  - `/dashboard/athlete/profile` ✅
- [ ] No longer redirected to pending approval page

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

### Phase 3: Rejection Flow Testing (20 minutes)

#### Test 3.1: Create Second Test Athlete
**Steps:**
1. Logout
2. Register new athlete: `newathlete2@test.com` / `Test123!`
3. Complete membership application
4. Select same club as before
5. Submit application

**Expected Results:**
- [ ] Application created successfully
- [ ] Status = 'pending'
- [ ] Redirected to pending approval page

---

#### Test 3.2: Coach Rejects Application
**Objective:** Verify rejection process (AC3, AC5)

**Steps:**
1. Logout
2. Login as `coach@test.com`
3. Navigate to `/dashboard/coach/applications`
4. Find `newathlete2@test.com` application
5. Click "ปฏิเสธ" or "Reject" button
6. Enter rejection reason: "เอกสารไม่ครบถ้วน" or "Incomplete documents"
7. Confirm rejection

**Expected Results:**
- [ ] Rejection dialog/form appears
- [ ] Rejection reason field is required
- [ ] Cannot reject without reason
- [ ] After entering reason and confirming:
  - Success message displayed
  - Application removed from pending list
  - No errors

**Database Verification:**
```sql
-- Check application was rejected
SELECT id, applicant_id, status, rejection_reason, reviewed_at, reviewed_by
FROM membership_applications
WHERE applicant_id IN (
  SELECT id FROM profiles WHERE email = 'newathlete2@test.com'
);

-- Check profile status
SELECT id, email, membership_status, club_id, coach_id
FROM profiles
WHERE email = 'newathlete2@test.com';
```

**Expected Database State:**
- membership_applications.status = 'rejected'
- membership_applications.rejection_reason = [entered reason]
- membership_applications.reviewed_at = [timestamp]
- membership_applications.reviewed_by = [coach user_id]
- profiles.membership_status = 'rejected'
- profiles.club_id = NULL
- profiles.coach_id = NULL

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 3.3: Rejected Athlete Access
**Objective:** Verify rejected athlete cannot access dashboard (AC5)

**Steps:**
1. Logout from coach
2. Login as `newathlete2@test.com`
3. Attempt to access `/dashboard/athlete`

**Expected Results:**
- [ ] Redirected to rejection/pending page
- [ ] Page shows:
  - Status: "ถูกปฏิเสธ" or "Rejected"
  - Rejection reason: "เอกสารไม่ครบถ้วน"
  - Option to submit new application
- [ ] Cannot access athlete dashboard features

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 3.4: Reapplication After Rejection
**Objective:** Verify can reapply after rejection (BR1)

**Steps:**
1. Still logged in as `newathlete2@test.com`
2. Click "สมัครใหม่" or navigate to `/register-membership`
3. Fill in application form again
4. Submit new application

**Expected Results:**
- [ ] Can access application form
- [ ] Can submit new application
- [ ] New application created with status='pending'
- [ ] Old rejected application still exists in database
- [ ] Redirected to pending approval page

**Database Verification:**
```sql
-- Should see 2 applications: 1 rejected, 1 pending
SELECT id, applicant_id, status, created_at
FROM membership_applications
WHERE applicant_id IN (
  SELECT id FROM profiles WHERE email = 'newathlete2@test.com'
)
ORDER BY created_at DESC;
```

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

### Phase 4: Admin Override Testing (15 minutes)

#### Test 4.1: Admin Views All Applications
**Objective:** Verify admin can see all applications (AC8)

**Steps:**
1. Logout
2. Login as `admin@test.com` / `Admin123!`
3. Navigate to admin applications page (check if exists)
   - Try `/dashboard/admin/applications`
   - Or check admin dashboard for applications link

**Expected Results:**
- [ ] Can access admin dashboard
- [ ] Can view applications from all clubs
- [ ] See both pending and processed applications
- [ ] Can filter by status, club, date

**Note:** If admin applications page doesn't exist, this is a feature gap to document.

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________
- [ ] ⚠️ Feature not implemented

---

### Phase 5: Edge Cases Testing (20 minutes)

#### Test 5.1: Missing Required Fields
**Steps:**
1. Logout, register new athlete: `newathlete3@test.com`
2. Navigate to membership application
3. Try to submit without selecting club
4. Try to submit without required personal info

**Expected Results:**
- [ ] Validation errors displayed
- [ ] Cannot submit incomplete form
- [ ] Clear error messages for each missing field

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________

---

#### Test 5.2: Access Control Consistency
**Objective:** Verify membership_status is single source of truth

**Test Cases:**

**A. Active Status:**
```sql
-- Manually set athlete to active
UPDATE profiles 
SET membership_status = 'active', 
    club_id = (SELECT id FROM clubs LIMIT 1),
    coach_id = (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1)
WHERE email = 'newathlete3@test.com';
```
- Login as newathlete3@test.com
- Expected: ✅ Can access dashboard

**B. Suspended Status:**
```sql
-- Manually set athlete to suspended
UPDATE profiles 
SET membership_status = 'suspended'
WHERE email = 'newathlete3@test.com';
```
- Refresh page or re-login
- Expected: ❌ Cannot access dashboard, redirected

**C. Null Status:**
```sql
-- Manually set status to null
UPDATE profiles 
SET membership_status = NULL
WHERE email = 'newathlete3@test.com';
```
- Refresh page or re-login
- Expected: ❌ Cannot access dashboard, redirected

**Actual Results:**
- [ ] ✅ All pass
- [ ] ❌ Some fail - Details: _______________

---

#### Test 5.3: Coach Club Isolation
**Objective:** Verify coach only sees their club's applications

**Setup:**
1. Create second club in database (if not exists)
2. Create second coach assigned to second club
3. Create athlete application for second club

**Steps:**
1. Login as first coach (coach@test.com)
2. Check applications list
3. Should NOT see applications for second club

**Expected Results:**
- [ ] Coach sees only their club's applications
- [ ] RLS policies working correctly

**Actual Results:**
- [ ] ✅ Pass
- [ ] ❌ Fail - Reason: _______________
- [ ] ⚠️ Cannot test - need second club/coach setup

---

## Test Summary

### Overall Results

**Total Tests Executed:** _____ / 15  
**Passed:** _____  
**Failed:** _____  
**Skipped:** _____  

### Critical Issues Found

1. _______________
2. _______________
3. _______________

### Non-Critical Issues Found

1. _______________
2. _______________

### Features Not Implemented

1. _______________
2. _______________

### Recommendations

1. _______________
2. _______________
3. _______________

---

## Next Steps

- [ ] Fix critical issues
- [ ] Document all findings
- [ ] Update automated tests to cover gaps
- [ ] Retest failed scenarios
- [ ] Get stakeholder approval

---

**Test Completed By:** _______________  
**Date:** _______________  
**Sign-off:** _______________

