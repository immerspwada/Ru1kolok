# Sports Club Management System

**Status:** ✅ **PRODUCTION READY** | [Production Readiness Checklist](docs/PRODUCTION_READINESS_CHECKLIST.md)

A comprehensive web application for managing sports clubs, athletes, coaches, and training activities with a robust membership approval workflow.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React Server Components, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime, Storage, Edge Functions)
- **Database**: PostgreSQL 15 with Row Level Security (RLS)
- **Testing**: Vitest (unit tests), fast-check (property-based tests), Pact (contract tests)
- **Deployment**: Vercel (Frontend), Supabase (Backend)
- **Monitoring**: Supabase Analytics, Custom Error Logging
- **API Documentation**: OpenAPI 3.1 specifications
- **Event System**: JSON Schema-based event definitions

## Features

### Core Features
- 🔐 **Role-based authentication** (Admin, Coach, Athlete, Parent)
- 📝 **Membership approval workflow** - Athletes apply to clubs, coaches review and approve
- 👥 **User management** with Row Level Security (RLS)
- 🏋️ **Training session scheduling** with QR code generation
- ✅ **Attendance tracking** with QR code, manual, and automatic check-in
- 📊 **Performance tracking** and analytics with trend analysis
- 📢 **Announcement system** with priority levels and expiration
- 📱 **Progressive Web App (PWA)** support
- 📈 **Reporting and data export** capabilities

### Advanced Features
- 🏆 **Tournament management** - Create and track competitive events
- 📝 **Progress reports** - Formal athlete assessments by coaches
- 🏠 **Home training logs** - Self-directed training with coach feedback
- 👨‍👩‍👧 **Parent portal** - Monitor child athlete progress and attendance
- 🎯 **Goal tracking** - Set and monitor athlete development goals
- 🔔 **Real-time notifications** - Push notifications for important events
- 📸 **Profile pictures** - Upload and manage user photos
- 🎫 **Activity check-in** - QR code system for general club activities
- 📤 **Leave requests** - Formal absence notification system

### System Infrastructure
- 🔄 **Idempotency support** - Prevent duplicate operations on retry
- 🚩 **Feature flags** - Gradual rollout and kill-switch capability
- 🔍 **Correlation IDs** - Request tracing for debugging
- 📊 **Audit logging** - Track all significant system actions
- ⚡ **Rate limiting** - Protect against abuse
- 🗄️ **Migration rollback** - Safe database schema changes
- 📋 **OpenAPI specifications** - Well-defined API contracts
- 📡 **Event schemas** - Asynchronous event coordination
- 🧪 **Contract testing** - Verify API consumer/provider agreements

## Quick Start Guide

### For New Users

#### Athletes: Getting Started

1. **Register Your Account**
   - Navigate to `/register` or click "Register" on the homepage
   - Enter your email and create a password
   - Verify your email (if email confirmation is enabled)

2. **Apply for Membership**
   - After login, you'll be redirected to `/register-membership`
   - **Select a club** based on the sport you want to join (e.g., Basketball, Football)
   - Note: You cannot select a specific coach - coaches are assigned upon approval

3. **Complete Your Application**
   - Fill in personal information (name, date of birth, contact details)
   - Upload required documents:
     - ID card or passport
     - Medical certificate (if required by club)
   - Review and submit your application

4. **Wait for Approval**
   - Your application status will be `pending`
   - You'll see a "Pending Approval" page when you login
   - You cannot access the athlete dashboard until approved
   - Check back regularly or wait for email notification

5. **After Approval**
   - Login to access your athlete dashboard
   - View your assigned coach and club
   - Check training schedules
   - Start checking in to training sessions

**Important Notes for Athletes:**
- You can only have ONE pending application at a time
- If rejected, you can reapply with improvements
- Contact your coach if you have questions about your application

#### Coaches: Managing Applications

1. **Get Your Coach Account**
   - Contact system admin to create your coach account
   - You'll be assigned to a specific club
   - Receive login credentials via email

2. **Login and Navigate**
   - Login at `/login`
   - Go to Dashboard → Applications
   - You'll see pending applications for YOUR club only

3. **Review Applications**
   - Click on an application to view details
   - Review athlete information:
     - Personal details
     - Uploaded documents
     - Application date
   - Check document validity and completeness

4. **Make a Decision**
   - **To Approve:**
     - Click "Approve" button
     - Athlete is automatically assigned to you
     - Athlete gains access to dashboard
     - Notification sent to athlete
   
   - **To Reject:**
     - Click "Reject" button
     - **Must provide a reason** (required)
     - Athlete can see the reason and reapply
     - Notification sent to athlete

5. **Manage Your Athletes**
   - View all assigned athletes in Athletes page
   - Create training sessions
   - Track attendance
   - Monitor performance

**Important Notes for Coaches:**
- You only see applications for your assigned club (security enforced)
- Rejection reasons are visible to athletes - be constructive
- Once approved, you become the athlete's assigned coach
- You can manage training sessions for all your athletes

#### Admins: System Management

1. **Login with Admin Credentials**
   - Use admin account provided during setup
   - Access full admin dashboard

2. **Manage Applications**
   - View applications from ALL clubs
   - Override coach decisions if needed
   - Reassign athletes to different coaches
   - Handle edge cases and exceptions

3. **Manage System**
   - Create and manage clubs
   - Create coach accounts and assign to clubs
   - Manage user roles
   - Configure system settings
   - View audit logs

4. **Monitor System Health**
   - Check for data inconsistencies
   - Run diagnostic scripts
   - Review system reports
   - Handle user support requests

**Important Notes for Admins:**
- You have full access to all data across all clubs
- Use admin override carefully - it bypasses normal workflow
- Regularly check audit logs for security
- Keep backup of database before major changes

### For Developers

#### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Supabase CLI (for migrations)

#### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

   ```bash
   cp .env.local.example .env.local
   ```

4. Run database migrations:

   ```bash
   ./scripts/auto-migrate.sh
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
sports-club-management/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   ├── admin/             # Admin dashboard components
│   ├── coach/             # Coach dashboard components
│   └── athlete/           # Athlete components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client configuration
│   └── utils/             # Helper functions
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── tests/                 # Test files
└── public/                # Static assets
```

## Membership Approval Flow

The system implements a comprehensive membership approval workflow that ensures proper vetting of athletes before they can access the system.

### Overview

The membership approval system is **club-based**, meaning athletes apply to join a specific club (sport type), and coaches assigned to that club review and approve applications. This ensures proper organization and prevents athletes from accessing features before being properly vetted.

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATHLETE REGISTRATION                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Create auth.users account
                              ↓
                    Create profiles record
                    (membership_status = 'pending')
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  MEMBERSHIP APPLICATION                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Select Club (not coach!)
                              ↓
                    Fill personal information
                              ↓
                    Upload documents
                              ↓
                    Create membership_applications
                    (status = 'pending', club_id set)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      COACH REVIEW                                │
│  (Filtered by club - RLS enforced)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              ┌──────────┐        ┌──────────┐
              │ APPROVE  │        │ REJECT   │
              └──────────┘        └──────────┘
                    ↓                   ↓
        Update application:     Update application:
        - status = 'approved'   - status = 'rejected'
        - assigned_coach_id     - rejection_reason
        - reviewed_at           - reviewed_at
        - reviewed_by           - reviewed_by
                    ↓                   ↓
        Update profile:         Update profile:
        - membership_status     - membership_status
          = 'active'              = 'rejected'
        - coach_id (assigned)
        - club_id
                    ↓                   ↓
        Send notification       Send notification
        "Approved!"            "Rejected: [reason]"
                    ↓                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ACCESS CONTROL                              │
└─────────────────────────────────────────────────────────────────┘
                    ↓                   ↓
        ✅ CAN ACCESS           ❌ CANNOT ACCESS
        Athlete Dashboard       Athlete Dashboard
        Training Sessions       (Can reapply)
        Check-in
        Performance
```

### Detailed Step-by-Step Process

#### 1. Application Submission (Athlete)

**What happens:**
- Athlete registers account (creates `auth.users` and `profiles` record)
- `profiles.membership_status` automatically set to `'pending'`
- Athlete navigates to `/register-membership`
- Selects a **club** (e.g., "Basketball Club", "Football Club")
- **Cannot select a specific coach** - assignment happens on approval
- Fills in personal information (name, DOB, contact, emergency contact)
- Uploads required documents (ID card, medical certificate)
- Submits application

**Database changes:**
```sql
INSERT INTO membership_applications (
  user_id,
  club_id,           -- Selected club
  status,            -- 'pending'
  applied_at,
  -- NO assigned_coach_id yet
  -- NO reviewed_by yet
);
```

**Business rules enforced:**
- ✅ Cannot submit if already have pending application
- ✅ Cannot submit if already have approved application
- ✅ Must select a valid club
- ✅ Must provide all required information

#### 2. Coach Review (Coach)

**What happens:**
- Coach logs in and navigates to Applications page
- Sees **only applications for their assigned club** (RLS enforced)
- Cannot see applications from other clubs
- Reviews athlete information and documents
- Makes decision: Approve or Reject

**Database query (RLS enforced):**
```sql
SELECT * FROM membership_applications
WHERE club_id = (
  SELECT club_id FROM profiles 
  WHERE user_id = auth.uid() AND role = 'coach'
)
AND status = 'pending';
```

**Security:**
- Row Level Security (RLS) policies prevent coaches from seeing other clubs' applications
- Even if coach tries to manipulate API, database blocks unauthorized access

#### 3a. Approval Process

**What happens:**
- Coach clicks "Approve"
- System performs atomic transaction:

```sql
BEGIN;

-- Update application
UPDATE membership_applications SET
  status = 'approved',
  assigned_coach_id = [coach_id],
  reviewed_by = [coach_id],
  reviewed_at = NOW()
WHERE id = [application_id];

-- Update athlete profile
UPDATE profiles SET
  membership_status = 'active',
  coach_id = [coach_id],
  club_id = [club_id]
WHERE user_id = [athlete_user_id];

COMMIT;
```

**Result:**
- ✅ Athlete can now access dashboard
- ✅ Athlete assigned to approving coach
- ✅ Athlete assigned to selected club
- ✅ Notification sent to athlete
- ✅ Athlete appears in coach's athlete list

#### 3b. Rejection Process

**What happens:**
- Coach clicks "Reject"
- **Must provide rejection reason** (required field)
- System performs atomic transaction:

```sql
BEGIN;

-- Update application
UPDATE membership_applications SET
  status = 'rejected',
  rejection_reason = [reason],
  reviewed_by = [coach_id],
  reviewed_at = NOW()
WHERE id = [application_id];

-- Update athlete profile
UPDATE profiles SET
  membership_status = 'rejected'
WHERE user_id = [athlete_user_id];

COMMIT;
```

**Result:**
- ❌ Athlete cannot access dashboard
- ✅ Athlete can see rejection reason
- ✅ Athlete can submit new application (reapply)
- ✅ Notification sent to athlete with reason

#### 4. Access Control (Middleware)

**Single Source of Truth:** `profiles.membership_status`

The middleware checks this field on every request:

```typescript
// Middleware logic
if (path.startsWith('/dashboard/athlete')) {
  const profile = await getProfile(user.id);
  
  if (profile.membership_status !== 'active') {
    // Redirect to pending approval page
    return redirect('/pending-approval');
  }
}
```

**Status meanings:**
- `'pending'` → Cannot access dashboard, see "Pending Approval" page
- `'active'` → Full access to athlete features
- `'rejected'` → Cannot access dashboard, can reapply
- `null` → New user, needs to apply

### Key Design Principles

#### 1. Single Source of Truth
- **`profiles.membership_status`** is the authoritative field for access control
- All access decisions based on this field
- Updated atomically with application status
- Prevents inconsistencies

#### 2. Club-Based Organization
- Athletes apply to **clubs**, not individual coaches
- Coaches are assigned to clubs
- Coaches only see applications for their club
- Ensures proper organization and security

#### 3. Atomic Transactions
- All status changes happen in database transactions
- Application status and profile status updated together
- Prevents partial updates and inconsistencies
- Rollback on any error

#### 4. Security by Default
- Row Level Security (RLS) enforces access control at database level
- Coaches cannot bypass security to see other clubs
- Athletes can only see their own applications
- Admins have override capability

#### 5. Clear Status Flow
```
null → pending → active (approved)
              ↘ rejected (can reapply)
```

**No other transitions allowed:**
- Cannot go from `active` back to `pending`
- Cannot go from `rejected` to `active` without new application
- Status changes are one-way and audited

### User Roles and Permissions

The system has three distinct roles with different permission levels:

#### 🏃 Athlete Role

**Access Requirements:**
- Must have `membership_status = 'active'` to access dashboard
- Pending or rejected athletes redirected to `/pending-approval`

**Permissions:**

| Feature | Permission | Notes |
|---------|-----------|-------|
| **Membership** | | |
| Submit application | ✅ Yes | Only if no pending application exists |
| View own applications | ✅ Yes | Can see status and rejection reasons |
| View other applications | ❌ No | RLS enforced |
| **Dashboard Access** | | |
| Access athlete dashboard | ✅ Yes | Only if `membership_status = 'active'` |
| View training schedule | ✅ Yes | Only for own club |
| Check-in to sessions | ✅ Yes | Within allowed time window |
| **Data Access** | | |
| View own profile | ✅ Yes | Can edit personal information |
| View own attendance | ✅ Yes | Historical records |
| View own performance | ✅ Yes | Stats and metrics |
| View assigned coach | ✅ Yes | Contact information |
| View other athletes | ❌ No | Privacy protected |
| **Actions** | | |
| Submit leave requests | ✅ Yes | For upcoming sessions |
| Upload documents | ✅ Yes | During application |
| Update profile | ✅ Yes | Personal information only |

**Restrictions:**
- Cannot access dashboard until approved
- Cannot see other athletes' data
- Cannot create training sessions
- Cannot approve applications
- Cannot access admin features

#### 👨‍🏫 Coach Role

**Access Requirements:**
- Must be assigned to at least one club
- No membership status check (always active)

**Permissions:**

| Feature | Permission | Notes |
|---------|-----------|-------|
| **Applications** | | |
| View applications | ✅ Yes | Only for assigned club (RLS enforced) |
| Approve applications | ✅ Yes | Athletes assigned to coach on approval |
| Reject applications | ✅ Yes | Must provide rejection reason |
| View all applications | ❌ No | Only own club |
| **Athlete Management** | | |
| View assigned athletes | ✅ Yes | All athletes in coach's club |
| View athlete profiles | ✅ Yes | Full profile information |
| View athlete attendance | ✅ Yes | Historical and current |
| View athlete performance | ✅ Yes | Stats and metrics |
| Reassign athletes | ❌ No | Admin only |
| **Training Sessions** | | |
| Create sessions | ✅ Yes | For own club |
| Edit sessions | ✅ Yes | Own sessions only |
| Delete sessions | ✅ Yes | Own sessions only |
| View sessions | ✅ Yes | Own club sessions |
| **Attendance** | | |
| Mark attendance | ✅ Yes | For own sessions |
| View attendance reports | ✅ Yes | Own club only |
| Export attendance data | ✅ Yes | Own club only |
| **Leave Requests** | | |
| View leave requests | ✅ Yes | From assigned athletes |
| Approve/reject requests | ✅ Yes | For own athletes |

**Restrictions:**
- Cannot see applications from other clubs (RLS enforced)
- Cannot manage athletes from other clubs
- Cannot access admin features
- Cannot modify system settings
- Cannot view audit logs

#### 👑 Admin Role

**Access Requirements:**
- No restrictions - full system access

**Permissions:**

| Feature | Permission | Notes |
|---------|-----------|-------|
| **Applications** | | |
| View all applications | ✅ Yes | Across all clubs |
| Approve applications | ✅ Yes | Can override coach decisions |
| Reject applications | ✅ Yes | Can override coach decisions |
| Reassign applications | ✅ Yes | Change assigned coach |
| **User Management** | | |
| Create users | ✅ Yes | All roles |
| Edit users | ✅ Yes | Change roles, status |
| Delete users | ✅ Yes | With confirmation |
| View all users | ✅ Yes | Across all clubs |
| Assign roles | ✅ Yes | Admin, Coach, Athlete |
| **Club Management** | | |
| Create clubs | ✅ Yes | New sports/clubs |
| Edit clubs | ✅ Yes | Name, sport type, settings |
| Delete clubs | ✅ Yes | With confirmation |
| Assign coaches to clubs | ✅ Yes | Coach-club relationship |
| **System Management** | | |
| Access system settings | ✅ Yes | Global configuration |
| View audit logs | ✅ Yes | All user actions |
| Run diagnostics | ✅ Yes | Database health checks |
| Execute migrations | ✅ Yes | Database updates |
| **Data Access** | | |
| View all data | ✅ Yes | No RLS restrictions |
| Export data | ✅ Yes | All tables |
| Modify data | ✅ Yes | Direct database access |

**Special Capabilities:**
- Bypass RLS policies (service role)
- Override coach decisions
- Access all clubs and athletes
- Modify system configuration
- View complete audit trail

### Permission Enforcement

**Database Level (RLS Policies):**
```sql
-- Example: Coaches can only see their club's applications
CREATE POLICY "coach_view_own_club_applications"
ON membership_applications FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT club_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'coach'
  )
);
```

**Application Level (Middleware):**
```typescript
// Middleware checks membership_status for athletes
if (profile.role === 'athlete' && 
    profile.membership_status !== 'active') {
  return redirect('/pending-approval');
}
```

**API Level (Server Actions):**
```typescript
// Server actions verify permissions before operations
export async function approveApplication(id: string) {
  const coach = await getCoachProfile();
  const application = await getApplication(id);
  
  // Verify coach owns this club
  if (application.club_id !== coach.club_id) {
    throw new Error('Unauthorized');
  }
  
  // Proceed with approval...
}
```

### Key Features

- **Club-Based Applications**: Athletes apply to clubs, not individual coaches
- **Coach Isolation**: Coaches only see applications for their club (enforced by RLS)
- **Duplicate Prevention**: Athletes cannot have multiple pending applications
- **Atomic Updates**: All status changes are transactional to prevent inconsistencies
- **Rejection Feedback**: Coaches must provide reasons for rejection
- **Reapplication**: Rejected athletes can submit new applications

## Database Setup

### Quick Setup

```bash
# Run all migrations
./scripts/auto-migrate.sh

# Or run specific migrations
./scripts/run-sql-via-api.sh scripts/31-update-membership-applications.sql
./scripts/run-sql-via-api.sh scripts/32-update-profiles-membership-status.sql
./scripts/run-sql-via-api.sh scripts/33-membership-approval-rls.sql
```

### Verify Setup

```bash
# Check data integrity
./scripts/run-sql-via-api.sh scripts/36-diagnose-membership-consistency.sql

# Verify migrations
./scripts/run-sql-via-api.sh scripts/verify-membership-migration-final.sql
```

See [Database Schema Documentation](./docs/MEMBERSHIP_APPROVAL_SYSTEM.md#database-schema) for complete schema details.

## Documentation

### 📚 Quick Links

| Document | Description |
|----------|-------------|
| **[Documentation Index](./docs/README.md)** | Complete documentation index |
| **[Feature Registry](./FEATURE_REGISTRY.md)** | Comprehensive feature catalog with dependencies, endpoints, and events |
| **[Database Setup](./docs/DATABASE.md)** | Database configuration and migrations |
| **[Testing Guide](./docs/TESTING.md)** | Testing procedures and test accounts |
| **[Deployment Guide](./docs/DEPLOYMENT.md)** | Production deployment instructions |
| **[Membership System](./docs/MEMBERSHIP_APPROVAL_SYSTEM.md)** | Membership workflow guide |
| **[Troubleshooting](./docs/MEMBERSHIP_TROUBLESHOOTING.md)** | Common issues and solutions |

### 📖 Additional Documentation

For complete documentation, see [Documentation Index](./docs/README.md) which includes:
- Technical documentation for developers
- System administration guides
- Feature-specific documentation
- Troubleshooting guides
- Historical reports and summaries

## Troubleshooting

### Common Issues

**"Can't access dashboard after approval"**
- Check `profiles.membership_status` is set to `active`
- Logout and login again to refresh session
- See [Troubleshooting Guide](./docs/MEMBERSHIP_TROUBLESHOOTING.md#issue-4-athlete-cant-access-dashboard-after-approval)

**"Duplicate application error"**
- Check for existing pending applications
- Reject or approve old application
- See [Troubleshooting Guide](./docs/MEMBERSHIP_TROUBLESHOOTING.md#issue-6-duplicate-application-error-when-no-pending-application-visible)

**"Coach can't see applications"**
- Verify coach is assigned to a club
- Check RLS policies are enabled
- See [Troubleshooting Guide](./docs/MEMBERSHIP_TROUBLESHOOTING.md#issue-5-coach-cant-see-applications-for-their-club)

For more issues and solutions, see the [complete troubleshooting guide](./docs/MEMBERSHIP_TROUBLESHOOTING.md).

## Production Readiness

**Status:** ✅ **PRODUCTION READY**

The system has completed comprehensive production readiness verification:

### Quick Verification

```bash
# Verify all required files and infrastructure
./scripts/verify-production-files.sh
```

### Production Checklist

- ✅ **All migrations applied** - 42 production migrations verified
- ✅ **All RLS policies active** - 18 tables protected with row-level security
- ✅ **All feature flags configured** - 8 features with gradual rollout
- ✅ **Monitoring configured** - Error logging, audit trails, correlation IDs
- ✅ **Backup procedures verified** - Rollback scripts and recovery procedures tested
- ✅ **Security audit passed** - Comprehensive security testing completed
- ✅ **Performance testing passed** - Load tested to 100+ concurrent users
- ✅ **Integration testing passed** - All workflows verified end-to-end
- ✅ **Contract testing implemented** - API consumer/provider agreements verified
- ✅ **Documentation complete** - All features and procedures documented

### Key Infrastructure

**Idempotency Support:**
- Prevents duplicate operations on retry
- Implemented for all mutation endpoints
- Uses `Idempotency-Key` header

**Feature Flags:**
- Gradual rollout capability (0-100%)
- Kill-switch for emergency disabling
- Admin management UI at `/dashboard/admin/feature-flags`

**Correlation IDs:**
- Request tracing for debugging
- `X-Correlation-ID` and `X-Causation-ID` headers
- Structured JSON logging

**Rollback Capability:**
- All migrations have DOWN sections
- Rollback testing script: `./scripts/test-rollback.sh`
- Documented procedures: `scripts/ROLLBACK_PROCEDURES.md`

### Documentation

- **Production Readiness:** [docs/PRODUCTION_READINESS_CHECKLIST.md](docs/PRODUCTION_READINESS_CHECKLIST.md)
- **Database Schema:** [docs/DATABASE.md](docs/DATABASE.md)
- **API Documentation:** [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Testing Guide:** [docs/TESTING.md](docs/TESTING.md)
- **Feature Registry:** [FEATURE_REGISTRY.md](FEATURE_REGISTRY.md)
- **Security Audit:** [docs/SECURITY_AUDIT_REPORT.md](docs/SECURITY_AUDIT_REPORT.md)
- **Performance Testing:** [docs/PERFORMANCE_TESTING.md](docs/PERFORMANCE_TESTING.md)

### Verification Commands

```bash
# Database verification
./scripts/auto-migrate.sh
npm run test -- tests/database-connection.test.ts

# Security verification
npm run test -- tests/security-audit.test.ts
npm run test -- tests/rls-enforcement.property.test.ts

# Performance verification
npm run test -- tests/performance/

# Integration verification
npm run test -- tests/membership-workflow.test.ts
npm run test -- tests/coach-athlete-workflows.test.ts
npm run test -- tests/parent-portal-workflow.test.ts
```

### Emergency Procedures

**Feature Kill-Switch:**
```bash
# Via admin UI: /dashboard/admin/feature-flags
# Set feature flag to disabled
```

**Database Rollback:**
```bash
# See: scripts/ROLLBACK_PROCEDURES.md
./scripts/test-rollback.sh <migration-number>
```

**Code Rollback:**
```bash
# Via Vercel dashboard
# Rollback to previous deployment
```

For complete production readiness details, see [docs/PRODUCTION_READINESS_CHECKLIST.md](docs/PRODUCTION_READINESS_CHECKLIST.md).

## License

Private project - All rights reserved
