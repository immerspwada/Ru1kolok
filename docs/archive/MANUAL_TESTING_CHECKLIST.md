# Manual Testing Checklist - Membership Approval System

## Test Summary

**Test Run Date:** 2025-11-23
**Automated Test Results:** 
- Total Tests: 28 membership-related tests
- Passed: 10 tests
- Failed: 5 tests  
- Skipped: 13 tests (membership-workflow.test.ts - setup issues)

## Issues Found in Automated Tests

### 1. Schema Mismatches
- `membership_applications` table uses `applicant_id` not `user_id`
- `clubs` table requires `sport_type` field
- `profiles` table has CHECK constraint requiring `club_id` when `membership_status='active'`

### 2. Test Status
✅ **Passing Tests:**
- Rejection handling (AC5)
- Pending state restrictions (AC6)
- Suspended status handling
- Null status handling
- Coach access (non-athlete)
- Admin access (non-athlete)

❌ **Failing Tests:**
- Active membership access (AC4) - profile creation issue with CHECK constraint
- Duplicate pending application detection - column name mismatch
- Single source of truth verification - profile not created properly

⏭️ **Skipped Tests:**
- Complete workflow tests - club creation fails due to missing sport_type

## Manual Testing Scenarios

### Scenario 1: Complete Registration Flow (AC1)
**Objective:** Verify athlete can submit membership application

**Steps:**
1. Navigate to `/register` or `/register-membership`
2. Fill in personal information
3. Select a club (NOT a coach)
4. Upload required documents
5. Submit application

**Expected Results:**
- ✅ Application created with status='pending'
- ✅ No coach_id assigned yet
- ✅ club_id is set to selected club
- ✅ User redirected to pending approval page

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 2: Pending State Access Control (AC6)
**Objective:** Verify pending athletes cannot access dashboard

**Steps:**
1. Login as athlete with pending application
2. Attempt to navigate to `/dashboard/athlete`
3. Attempt to access `/dashboard/athlete/schedule`
4. Attempt to access `/dashboard/athlete/attendance`

**Expected Results:**
- ✅ Redirected to `/pending-approval` page
- ✅ See message "รอการอนุมัติ"
- ✅ See application status and club name
- ✅ Cannot access any athlete dashboard features

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 3: Coach Views Applications (AC2)
**Objective:** Verify coach sees only their club's applications

**Steps:**
1. Login as coach
2. Navigate to `/dashboard/coach/applications`
3. View list of pending applications

**Expected Results:**
- ✅ See only applications for coach's club
- ✅ Do NOT see applications from other clubs
- ✅ Can view applicant details
- ✅ Can see documents uploaded

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 4: Coach Approves Application (AC3)
**Objective:** Verify approval process works correctly

**Steps:**
1. Login as coach
2. Navigate to `/dashboard/coach/applications`
3. Select a pending application
4. Click "อนุมัติ" (Approve)
5. Confirm approval

**Expected Results:**
- ✅ Application status changes to 'approved'
- ✅ Athlete profile created with:
  - coach_id = approving coach
  - club_id = application's club
  - membership_status = 'active'
- ✅ Application.profile_id links to created profile
- ✅ Athlete receives notification (if implemented)

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 5: Post-Approval Access (AC4)
**Objective:** Verify approved athlete can access dashboard

**Steps:**
1. Login as athlete who was just approved
2. Navigate to `/dashboard/athlete`
3. Check dashboard features

**Expected Results:**
- ✅ Can access athlete dashboard
- ✅ See assigned coach information
- ✅ See club information
- ✅ Can view training schedule
- ✅ Can check-in to sessions
- ✅ membership_status = 'active' in database

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 6: Coach Rejects Application (AC3, AC5)
**Objective:** Verify rejection process works correctly

**Steps:**
1. Login as coach
2. Navigate to `/dashboard/coach/applications`
3. Select a pending application
4. Click "ปฏิเสธ" (Reject)
5. Enter rejection reason: "เอกสารไม่ชัดเจน"
6. Confirm rejection

**Expected Results:**
- ✅ Application status changes to 'rejected'
- ✅ Rejection reason saved
- ✅ NO athlete profile created
- ✅ Athlete receives notification with reason

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 7: Rejection Handling (AC5)
**Objective:** Verify rejected athlete cannot access dashboard

**Steps:**
1. Login as rejected athlete
2. Attempt to navigate to `/dashboard/athlete`

**Expected Results:**
- ✅ Redirected to pending/rejection page
- ✅ See status "ถูกปฏิเสธ" (Rejected)
- ✅ See rejection reason
- ✅ Option to submit new application
- ✅ Cannot access athlete features

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 8: Duplicate Application Prevention (AC7, BR1)
**Objective:** Verify cannot submit duplicate pending applications

**Steps:**
1. Login as athlete with pending application
2. Navigate to `/register-membership`
3. Attempt to submit another application

**Expected Results:**
- ✅ Error message: "มีคำขอรออนุมัติอยู่แล้ว"
- ✅ Cannot submit second application
- ✅ Shown existing application status

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 9: Admin Override (AC8)
**Objective:** Verify admin can manage all applications

**Steps:**
1. Login as admin
2. Navigate to admin applications page
3. View applications from multiple clubs

**Expected Results:**
- ✅ See applications from ALL clubs
- ✅ Can approve/reject any application
- ✅ Can reassign to different coach (if implemented)

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

### Scenario 10: Access Control Consistency
**Objective:** Verify membership_status is single source of truth

**Steps:**
1. Check database for athlete profile
2. Verify membership_status field
3. Test access based on status

**Test Cases:**
- membership_status = 'active' → ✅ Can access dashboard
- membership_status = 'pending' → ❌ Cannot access dashboard
- membership_status = 'rejected' → ❌ Cannot access dashboard
- membership_status = 'suspended' → ❌ Cannot access dashboard
- membership_status = null → ❌ Cannot access dashboard

**Actual Results:**
- [ ] Pass
- [ ] Fail - Reason: _______________

---

## Edge Cases to Test

### Edge Case 1: Missing Data
**Test:** Submit application with incomplete information
**Expected:** Validation errors, cannot submit

### Edge Case 2: Multiple Clubs
**Test:** Athlete applies to Club A, gets rejected, applies to Club B
**Expected:** Should be allowed (BR1 allows reapplication after rejection)

### Edge Case 3: Coach Changes Club
**Test:** Coach moves to different club, check application visibility
**Expected:** See only new club's applications

### Edge Case 4: Application Expiry (BR3)
**Test:** Application pending for >30 days
**Expected:** Auto-rejected with reason "คำขอหมดอายุ"

---

## Database Verification Queries

### Check Application Status
```sql
SELECT id, applicant_id, club_id, status, created_at, reviewed_at
FROM membership_applications
WHERE applicant_id = '<user_id>';
```

### Check Profile Status
```sql
SELECT id, email, membership_status, club_id, coach_id
FROM profiles
WHERE id = '<user_id>';
```

### Check Access Control
```sql
SELECT 
  p.email,
  p.membership_status,
  p.club_id,
  p.coach_id,
  ma.status as application_status
FROM profiles p
LEFT JOIN membership_applications ma ON ma.applicant_id = p.id
WHERE p.id = '<user_id>';
```

---

## Test Environment Setup

### Required Test Users
1. **Admin User:** test-admin@example.com
2. **Coach User:** test-coach@example.com (assigned to Test Club)
3. **Athlete User 1:** test-athlete-pending@example.com (pending status)
4. **Athlete User 2:** test-athlete-active@example.com (active status)
5. **Athlete User 3:** test-athlete-rejected@example.com (rejected status)

### Required Test Data
1. **Test Club:** "Test Club" with sport_type set
2. **Coach Profile:** Linked to Test Club
3. **Applications:** Various statuses for testing

---

## Notes

- All manual tests should be performed in a test/staging environment
- Document any deviations from expected behavior
- Take screenshots of critical flows
- Note any error messages or console errors
- Verify database state after each test

---

## Test Completion

**Tester:** _______________
**Date:** _______________
**Overall Result:** [ ] Pass [ ] Fail
**Issues Found:** _______________
**Recommendations:** _______________
