# 🚀 Start Manual Testing - Quick Guide

**Ready to test?** Follow these steps to begin testing the membership approval system.

---

## ⚡ Quick Start (5 minutes)

### Step 1: Open the Application
```
URL: http://localhost:3000
Status: ✅ Server is running
```

### Step 2: Get Test Accounts
```
Coach:  coach@test.com / Coach123!
Admin:  admin@test.com / Admin123!
```

### Step 3: Create Test Athlete
1. Go to http://localhost:3000/register
2. Register: `testathlete1@test.com` / `Test123!`
3. Complete email verification (if required)
4. Go to `/register-membership`
5. Fill form and select a CLUB (not coach)
6. Submit application

### Step 4: Test Pending Access
1. Try to access `/dashboard/athlete`
2. **Expected:** Redirected to `/pending-approval`
3. **Expected:** See "รอการอนุมัติ" message

### Step 5: Approve as Coach
1. Logout, login as `coach@test.com`
2. Go to `/dashboard/coach/applications`
3. Find `testathlete1@test.com` application
4. Click "อนุมัติ" (Approve)

### Step 6: Verify Access Granted
1. Logout, login as `testathlete1@test.com`
2. Go to `/dashboard/athlete`
3. **Expected:** ✅ Can access dashboard
4. **Expected:** See coach and club info

---

## 📚 Full Documentation

| Document | Purpose | Time |
|----------|---------|------|
| **QUICK_TEST_REFERENCE.md** | Quick lookup guide | 5 min read |
| **MANUAL_TESTING_EXECUTION_GUIDE.md** | Detailed test steps | 2 hrs execution |
| **MANUAL_TESTING_CHECKLIST.md** | Track progress | Use during testing |
| **MANUAL_TESTING_SUMMARY.md** | Overview & status | 10 min read |

---

## 🎯 Critical Tests (30 minutes)

### Test 1: Registration → Approval (10 min)
```
✅ Register new athlete
✅ Submit application (select club)
✅ Verify cannot access dashboard (pending)
✅ Coach approves
✅ Verify can access dashboard (active)
```

### Test 2: Registration → Rejection (10 min)
```
✅ Register another athlete
✅ Submit application
✅ Coach rejects with reason
✅ Verify cannot access dashboard
✅ Verify can see rejection reason
✅ Verify can reapply
```

### Test 3: Duplicate Prevention (5 min)
```
✅ Login as athlete with pending application
✅ Try to submit another application
✅ Verify error: "มีคำขอรออนุมัติอยู่แล้ว"
```

### Test 4: Coach Isolation (5 min)
```
✅ Login as coach
✅ View applications
✅ Verify only see own club's applications
```

---

## 🗄️ Quick Database Checks

### Check Application Status
```sql
SELECT p.email, ma.status, ma.club_id, ma.assigned_coach_id
FROM membership_applications ma
JOIN profiles p ON p.id = ma.user_id
WHERE p.email = 'testathlete1@test.com';
```

### Check Profile Status
```sql
SELECT email, membership_status, club_id, coach_id
FROM profiles
WHERE email = 'testathlete1@test.com';
```

### Run in Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select project: ettpbpznktyttpnyqhkr
3. Go to SQL Editor
4. Paste query and run

---

## ✅ Success Checklist

After testing, verify:

- [ ] New athletes can register and apply
- [ ] Pending athletes cannot access dashboard
- [ ] Coach can see and approve applications
- [ ] Approved athletes can access dashboard
- [ ] Rejected athletes cannot access dashboard
- [ ] Cannot submit duplicate pending applications
- [ ] Coach only sees their club's applications
- [ ] Database state is consistent

---

## 🐛 If Something Goes Wrong

### Issue: Cannot submit application
**Check:**
- Is club selected?
- Are all required fields filled?
- Check browser console for errors

### Issue: Approved but still cannot access
**Fix:**
```sql
-- Check status
SELECT membership_status, club_id, coach_id 
FROM profiles 
WHERE email = 'testathlete1@test.com';

-- If needed, manually fix
UPDATE profiles 
SET membership_status = 'active',
    club_id = (SELECT id FROM clubs LIMIT 1),
    coach_id = (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1)
WHERE email = 'testathlete1@test.com';
```

### Issue: Coach sees no applications
**Check:**
```sql
-- Verify coach has club assigned
SELECT email, club_id FROM profiles WHERE email = 'coach@test.com';

-- Check if applications exist for that club
SELECT COUNT(*) FROM membership_applications 
WHERE club_id = (SELECT club_id FROM profiles WHERE email = 'coach@test.com');
```

---

## 📞 Need Help?

- **Full Guide:** See `MANUAL_TESTING_EXECUTION_GUIDE.md`
- **Quick Reference:** See `QUICK_TEST_REFERENCE.md`
- **Requirements:** See `.kiro/specs/membership-approval-fix/requirements.md`
- **Design:** See `.kiro/specs/membership-approval-fix/design.md`

---

## 🎉 Ready to Start!

1. Open http://localhost:3000
2. Follow Quick Start steps above
3. Document any issues found
4. Check off items in success checklist

**Good luck with testing! 🚀**

