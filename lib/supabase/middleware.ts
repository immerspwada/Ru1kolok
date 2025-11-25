import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkAthleteAccess } from '@/lib/auth/access-control';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Create admin client for role checking (bypasses RLS)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No need to set cookies for admin client
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes based on authentication
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Allow /register-membership for non-authenticated users
  // (They will create account in Step 1 of the form)

  // Role-based routing for authenticated users
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Get user role from database using admin client (bypasses RLS)
    const { data: userRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('[Middleware] Query result:', { userRoleData, roleError, userId: user.id });
    const userRole = userRoleData?.role || 'athlete';
    console.log('[Middleware] User:', user.email, 'Role:', userRole, 'Path:', request.nextUrl.pathname);

    // ATHLETE ACCESS CONTROL
    // Single Source of Truth: profiles.membership_status
    // Validates: Requirements AC4, AC5, AC6
    // - AC4: Post-Approval Access - Athletes with 'active' status can access dashboard
    // - AC5: Rejection Handling - Athletes with 'rejected' status cannot access dashboard
    // - AC6: Pending State Restrictions - Athletes with 'pending' status cannot access dashboard
    // NOTE: Admin and Coach roles bypass membership_status checks
    if (userRole === 'athlete') {
      // Get athlete's membership status (single source of truth)
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('membership_status')
        .eq('id', user.id)
        .maybeSingle();

      console.log('[Middleware] Profile query result:', { profile, profileError, userId: user.id });
      const membershipStatus = profile?.membership_status;
      console.log('[Middleware] Athlete membership_status:', membershipStatus);

      // If athlete hasn't applied yet (membership_status = null), redirect to register-membership
      if (membershipStatus === null && !request.nextUrl.pathname.startsWith('/register-membership')) {
        const url = request.nextUrl.clone();
        url.pathname = '/register-membership';
        return NextResponse.redirect(url);
      }

      // Allow access to specific pages even when not active:
      // - applications page: to view application status (AC6)
      // - register-membership: to reapply after rejection (BR1)
      // - pending-approval: to see pending/rejected status
      const isApplicationsPage = request.nextUrl.pathname.startsWith('/dashboard/athlete/applications');
      const isRegisterPage = request.nextUrl.pathname.startsWith('/register-membership');
      const isPendingApprovalPage = request.nextUrl.pathname.startsWith('/pending-approval');

      // For all other dashboard pages, check membership status
      // Only 'active' status grants access to dashboard features
      if (!isApplicationsPage && !isRegisterPage && !isPendingApprovalPage) {
        // Athletes must have 'active' membership_status to access dashboard
        // This is the ONLY check - membership_status is the single source of truth
        if (membershipStatus !== 'active') {
          console.log('[Middleware] Redirecting to pending-approval, status:', membershipStatus);
          const url = request.nextUrl.clone();
          url.pathname = '/pending-approval';
          return NextResponse.redirect(url);
        }
      }
    }

    // If accessing /dashboard root, redirect to role-specific dashboard
    if (request.nextUrl.pathname === '/dashboard') {
      console.log('[Middleware] Redirecting from /dashboard to role-specific dashboard');
      const url = request.nextUrl.clone();
      if (userRole === 'admin') {
        url.pathname = '/dashboard/admin';
      } else if (userRole === 'coach') {
        url.pathname = '/dashboard/coach';
      } else if (userRole === 'athlete') {
        url.pathname = '/dashboard/athlete';
      } else {
        // Default to athlete if no role specified
        url.pathname = '/dashboard/athlete';
      }
      return NextResponse.redirect(url);
    }

    // Prevent users from accessing dashboards they don't have permission for
    // Check if user is trying to access a different role's dashboard
    const isAccessingAdminDashboard = request.nextUrl.pathname.startsWith('/dashboard/admin');
    const isAccessingCoachDashboard = request.nextUrl.pathname.startsWith('/dashboard/coach');
    const isAccessingAthleteDashboard = request.nextUrl.pathname.startsWith('/dashboard/athlete');

    if (userRole === 'athlete' && (isAccessingAdminDashboard || isAccessingCoachDashboard)) {
      console.log('[Middleware] Athlete trying to access non-athlete dashboard, redirecting');
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/athlete';
      return NextResponse.redirect(url);
    }

    if (userRole === 'coach' && (isAccessingAdminDashboard || isAccessingAthleteDashboard)) {
      console.log('[Middleware] Coach trying to access non-coach dashboard, redirecting');
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/coach';
      return NextResponse.redirect(url);
    }

    if (userRole === 'admin' && (isAccessingCoachDashboard || isAccessingAthleteDashboard)) {
      console.log('[Middleware] Admin trying to access non-admin dashboard, redirecting');
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/admin';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
