# Deployment Guide

Complete guide for deploying the Sports Club Management System to production.

## Quick Deploy

### Prerequisites
- Vercel account
- Supabase project (production)
- Environment variables configured

### Deploy Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Run Database Migrations**
   ```bash
   ./scripts/auto-migrate.sh
   ```

4. **Verify Deployment**
   - Test login functionality
   - Check database connections
   - Verify RLS policies

## Production Deployment

### 1. Environment Setup

Configure production environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ACCESS_TOKEN=your-access-token
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Migration

Run all migrations on production database:

```bash
# Set production credentials
export SUPABASE_ACCESS_TOKEN=your-production-token

# Run migrations
./scripts/auto-migrate.sh
```

### 3. Verify Setup

Check critical components:

- [ ] Authentication working
- [ ] RLS policies active
- [ ] Storage buckets configured
- [ ] Test users can login
- [ ] Role-based access working

### 4. Post-Deployment

1. Create admin account
2. Create test clubs
3. Assign coaches to clubs
4. Test complete user flow

## Troubleshooting

### Common Issues

**Database connection fails**
- Verify Supabase URL and keys
- Check network connectivity
- Ensure RLS policies allow access

**Authentication not working**
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY
- Verify redirect URLs in Supabase dashboard
- Check middleware configuration

**Storage upload fails**
- Verify storage bucket exists
- Check RLS policies on storage
- Ensure file size limits configured

## Monitoring

Monitor application health:

- Check error logs in Vercel
- Monitor database performance in Supabase
- Review user activity logs
- Track API response times

## Rollback

If deployment fails:

1. Revert to previous Vercel deployment
2. Restore database backup if needed
3. Check error logs for root cause
4. Fix issues and redeploy

## Support

For deployment issues:
- Check documentation in `/docs`
- Review troubleshooting guides
- Contact system administrator
