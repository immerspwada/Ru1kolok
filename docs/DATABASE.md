# Database Guide

Complete database setup and migration guide for the Sports Club Management System.

## Quick Setup

### Initial Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and keys

2. **Configure Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ACCESS_TOKEN=your-access-token
   ```

3. **Run Migrations**
   ```bash
   ./scripts/auto-migrate.sh
   ```

## Migration Scripts

### Core Migrations (Required)

These are the essential migrations that must run in order:

| Script | Description |
|--------|-------------|
| `01-schema-only.sql` | Core database schema (tables, indexes) |
| `02-auth-functions-and-rls.sql` | Authentication functions and RLS policies |
| `03-setup-test-data.sql` | Initial test data |

### Feature Migrations

| Range | Feature |
|-------|---------|
| 10-22 | Training sessions and attendance tracking |
| 27-34 | Membership application system |
| 40-42 | Storage buckets and file uploads |
| 50-52 | Activity check-in system with QR codes |
| 55 | Announcements system |
| 60-63 | Error logging, feedback, goals, and profile pictures |
| 70 | Notifications system |
| 80 | Tournaments management |
| 90-93 | Progress reports and parent dashboard |
| 100-105 | Home training system, idempotency, feature flags |

### Infrastructure Migrations

| Script | Description |
|--------|-------------|
| `104-create-idempotency-keys-table.sql` | Idempotency support for duplicate prevention |
| `105-create-feature-flags-table.sql` | Feature flag system for gradual rollout |
| `103-add-clubs-sport-type.sql` | Add sport_type field to clubs table |

### Running Migrations

**Run all migrations:**
```bash
./scripts/auto-migrate.sh
```

**Run specific migration:**
```bash
./scripts/run-sql-via-api.sh scripts/01-schema-only.sql
```

## Database Schema

### Core Tables

**users** (Supabase Auth)
- Managed by Supabase Auth
- Contains authentication data

**profiles**
- User profile information
- Links to auth.users
- Contains role and membership status

**clubs**
- Sports clubs/teams
- Has sport_type and logo_url fields
- Organizational unit for athletes and coaches

**training_sessions**
- Training schedule
- Created by coaches
- Linked to clubs and teams
- Fields: scheduled_at, duration_minutes, session_type, status, max_participants

**attendance** (formerly attendance_logs)
- Check-in records
- Tracks athlete attendance
- Includes check_in_method (manual, qr, auto)
- Status: present, absent, late, excused

**membership_applications**
- Application submissions
- Approval workflow
- Document uploads

### Supporting Tables

**Communication & Notifications**
- **notifications** - User notifications with read status
- **notification_preferences** - User notification settings
- **announcements** - Club and system-wide announcements

**Performance & Progress**
- **performance_records** - Athlete test results and metrics
- **progress_reports** - Formal coach assessments
- **athlete_goals** - Goal tracking and progress
- **athlete_feedback** - Coach feedback on performance

**Training & Activities**
- **leave_requests** - Absence requests with approval workflow
- **activities** - General club activities with QR codes
- **activity_checkins** - Activity attendance records
- **tournaments** - Tournament management
- **tournament_participants** - Tournament registration and results
- **home_training_logs** - Self-directed training logs

**Parent Features**
- **parent_connections** - Parent-athlete relationships
- **parent_notifications** - Parent-specific notifications

**System Infrastructure**
- **error_logs** - Application error tracking
- **audit_logs** - System action audit trail
- **login_sessions** - Session tracking with device info
- **idempotency_keys** - Duplicate request prevention
- **feature_flags** - Feature rollout control
- **system_settings** - Global configuration

## Row Level Security (RLS)

All tables have RLS policies enforcing:

- **Athletes** - Can only see their own data
- **Coaches** - Can see data for their club
- **Admins** - Can see all data

### Key RLS Policies

**profiles table:**
- Users can read their own profile
- Coaches can read profiles in their club
- Admins can read all profiles

**membership_applications table:**
- Athletes can read their own applications
- Coaches can read applications for their club
- Coaches can update applications (approve/reject)

**training_sessions table:**
- Coaches can create/edit sessions for their club
- Athletes can read sessions for their club

## Storage Buckets

### membership-documents
- Stores application documents
- ID cards, medical certificates
- RLS enforced

### profile-pictures
- User profile photos
- Public read access
- Authenticated write access

### home-training-media
- Home training videos/photos
- Private access only

## Helper Functions

### Authentication

- `get_user_role(user_id)` - Get user's role
- `is_admin(user_id)` - Check if user is admin
- `is_coach(user_id)` - Check if user is coach

### Membership

- `check_duplicate_pending_application(user_id)` - Prevent duplicate applications
- `validate_coach_club(coach_id, club_id)` - Verify coach-club relationship

### Permissions

- `can_view_application(user_id, application_id)` - Check application access
- `can_approve_application(user_id, application_id)` - Check approval permission

## Maintenance

### Backup Database

```bash
# Via Supabase Dashboard
# Settings → Database → Backups
```

### Monitor Performance

```bash
# Check slow queries
./scripts/run-sql-via-api.sh scripts/analyze-performance.sql
```

### Clean Up Old Data

```bash
# Archive old records
./scripts/run-sql-via-api.sh scripts/cleanup-old-data.sql
```

## Troubleshooting

### Migration Fails

1. Check SUPABASE_ACCESS_TOKEN is set
2. Verify network connectivity
3. Check for syntax errors in SQL
4. Review error message in output

### RLS Policy Issues

1. Verify user role is set correctly
2. Check policy conditions
3. Test with service role key
4. Review policy logs

### Connection Issues

1. Verify Supabase URL and keys
2. Check project is not paused
3. Verify network/firewall settings
4. Test connection with simple query

## Advanced

### Custom Migrations

Create new migration:

```bash
# Create file: scripts/XX-your-migration.sql
# Add SQL commands
# Run: ./scripts/run-sql-via-api.sh scripts/XX-your-migration.sql
```

### Database Functions

Create stored procedures for complex logic:

```sql
CREATE OR REPLACE FUNCTION your_function()
RETURNS void AS $$
BEGIN
  -- Your logic here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Indexes

Add indexes for performance:

```sql
CREATE INDEX idx_table_column 
ON table_name(column_name);
```

## Reference

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
