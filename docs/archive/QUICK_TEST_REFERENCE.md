# Quick Test Reference - Membership Approval System

## 🚀 Quick Start

1. **Server Running:** http://localhost:3000
2. **Test Guide:** See `MANUAL_TESTING_EXECUTION_GUIDE.md`
3. **Test Checklist:** See `MANUAL_TESTING_CHECKLIST.md`

---

## 📋 Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | Admin123! | View all applications |
| Coach | coach@test.com | Coach123! | Review applications |
| Athlete | athlete@test.com | Athlete123! | Existing athlete |
| New Athlete 1 | newathlete1@test.com | Test123! | Test approval flow |
| New Athlete 2 | newathlete2@test.com | Test123! | Test rejection flow |
| New Athlete 3 | newathlete3@test.com | Test123! | Test edge cases |

---

## 🔍 Key URLs to Test

### Registration & Login
- `/register` - New user registration
- `/login` - User login
- `/register-membership` - Membership application form

### Athlete Pages
- `/dashboard/athlete` - Main dashboard (requires active status)
- `/dashboard/athlete/schedule` - Training schedule
- `/dashboard/athlete/attendance` - Attendance history
- `/dashboard/athlete/applications` - View own applications
- `/pending-approval` - Pending/rejected status page

### Coach Pages
- `/dashboard/coach` - Coach dashboard
- `/dashboard/coach/applications` - Review applications
- `/dashboard/coach/athletes` - View assigned athletes
- `/dashboard/coach/sessions` - Manage training sessions

### Admin Pages
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/applications` - All applications (if implemented)

---

## ✅ Critical Test Scenarios

### 1. Registration → Pending → Approval → Access
```
1. Register newathlete1@test.com
2. Submit membership application (select CLUB, not coach)
3. Verify redirected to /pending-approval
4. Verify CANNOT access /dashboard/athlete
5. Login as coach@test.com
6. Approve application
7. Login as newathlete1@test.com
8. Verify CAN access /dashboard/athlete
```

### 2. Registration → Pending → Rejection → Reapply
```
1. Register newathlete2@test.com
2. Submit membership application
3. Login as coach@test.com
4. Reject with reason
5. Login as newathlete2@test.com
6. Verify CANNOT access dashboard
7. Verify CAN see rejection reason
8. Verify CAN submit new application
```

### 3. Duplicate Application Prevention
```
1. Login as athlete with pending application
2. Try to submit another application
3. Verify ERROR: "มีคำขอรออนุมัติอยู่แล้ว"
```

---

## 🗄️ Database Verification Queries

### Check Application Status
```sql
SELECT 
  ma.id,
  p.email,
  ma.status,
  ma.club_id,
  ma.assigned_coach_id,
  ma.rejection_reason,
  ma.created_at,
  ma.reviewed_at
FROM membership_applications ma
JOIN profiles p ON p.id = ma.applicant_id
WHERE p.email = 'newathlete1@test.com';
```

### Check Profile Status
```sql
SELECT 
  id,
  email,
  membership_status,
  club_id,
  coach_id,
  role
FROM profiles
WHERE email = 'newathlete1@test.com';
```

### Check All Pending Applications
```sql
SELECT 
  ma.id,
  p.email,
  c.name as club_name,
  ma.status,
  ma.created_at
FROM membership_applications ma
JOIN profiles p ON p.id = ma.applicant_id
JOIN clubs c ON c.id = ma.club_id
WHERE ma.status = 'pending'
ORDER BY ma.created_at DESC;
```

### Check Coach's Club
```sql
SELECT 
  p.email,
  p.role,
  p.club_id,
  c.name as club_name
FROM profiles p
LEFT JOIN clubs c ON c.id = p.club_id
WHERE p.email = 'coach@test.com';
```

---

## 🐛 Common Issues & Solutions

### Issue: Cannot submit application
**Possible Causes:**
- Club not selected
- Required fields missing
- Duplicate pending application exists

**Solution:**
- Check form validation errors
- Verify no pending application in database
- Check browser console for errors

### Issue: Approved athlete still cannot access dashboard
**Possible Causes:**
- membership_status not updated to 'active'
- club_id or coach_id not set
- Middleware not checking correctly

**Solution:**
```sql
-- Verify profile status
SELECT membership_status, club_id, coach_id 
FROM profiles 
WHERE email = 'athlete@test.com';

-- Manually fix if needed
UPDATE profiles 
SET membership_status = 'active',
    club_id = (SELECT id FROM clubs LIMIT 1),
    coach_id = (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1)
WHERE email = 'athlete@test.com';
```

### Issue: Coach sees applications from other clubs
**Possible Causes:**
- RLS policies not working
- Coach club_id not set correctly

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'membership_applications';

-- Verify coach club assignment
SELECT email, club_id FROM profiles WHERE role = 'coach';
```

### Issue: Duplicate application not prevented
**Possible Causes:**
- check_duplicate_pending_application() function not working
- Function not called in submitApplication

**Solution:**
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'check_duplicate_pending_application'`
- Verify function is called in lib/membership/actions.ts

---

## 📊 Expected Database States

### After Registration (Before Application)
```
profiles:
  - email: newathlete1@test.com
  - membership_status: NULL or 'pending'
  - club_id: NULL
  - coach_id: NULL
  - role: 'athlete'

membership_applications: (none yet)
```

### After Application Submission
```
profiles:
  - membership_status: 'pending'
  - club_id: NULL
  - coach_id: NULL

membership_applications:
  - status: 'pending'
  - club_id: [selected club]
  - assigned_coach_id: NULL
  - reviewed_at: NULL
```

### After Approval
```
profiles:
  - membership_status: 'active'
  - club_id: [coach's club]
  - coach_id: [approving coach]

membership_applications:
  - status: 'approved'
  - assigned_coach_id: [approving coach]
  - reviewed_at: [timestamp]
  - reviewed_by: [coach user_id]
```

### After Rejection
```
profiles:
  - membership_status: 'rejected'
  - club_id: NULL
  - coach_id: NULL

membership_applications:
  - status: 'rejected'
  - rejection_reason: [reason text]
  - reviewed_at: [timestamp]
  - reviewed_by: [coach user_id]
```

---

## 🎯 Success Criteria

### Must Pass
- ✅ Athlete can register and submit application
- ✅ Pending athlete CANNOT access dashboard
- ✅ Coach sees only their club's applications
- ✅ Approval grants dashboard access
- ✅ Rejection prevents dashboard access
- ✅ Cannot submit duplicate pending applications
- ✅ membership_status is single source of truth

### Should Pass
- ✅ Rejection reason is displayed to athlete
- ✅ Can reapply after rejection
- ✅ Admin can view all applications
- ✅ Form validation works correctly

### Nice to Have
- ✅ Notifications sent on approval/rejection
- ✅ Application expiry after 30 days
- ✅ Email notifications

---

## 📝 Testing Notes

- Test in order: Registration → Approval → Rejection → Edge Cases
- Document all failures with screenshots
- Check database state after each major action
- Verify browser console has no errors
- Test on different browsers if possible
- Clear browser cache if experiencing issues

---

## 🔗 Related Documentation

- Full Test Guide: `MANUAL_TESTING_EXECUTION_GUIDE.md`
- Test Checklist: `MANUAL_TESTING_CHECKLIST.md`
- Test Users: `scripts/TEST_USERS.md`
- Requirements: `.kiro/specs/membership-approval-fix/requirements.md`
- Design: `.kiro/specs/membership-approval-fix/design.md`

