import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkAthleteAccess } from '@/lib/auth/access-control';
import { createRequestContext, extractCorrelationId } from '@/lib/utils/correlation';
import { createLogger } from '@/lib/utils/logger';

export async function updateSession(request: NextRequest) {
  // Create request context for logging
  const correlationId = extractCorrelationId(request.headers);
  const context = createRequestContext(
    correlationId,
    undefined,
    request.url,
    request.method
  );
  const logger = createLogger(context);
  try {
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

    // Update context with user ID
    context.userId = user.id;
    const userLogger = createLogger(context);

    userLogger.debug('User role query result', { userRoleData, roleError, userId: user.id });
    const userRole = userRoleData?.role || 'athlete';
    userLogger.info('User authentication', { 
      email: user.email, 
      role: userRole, 
      path: request.nextUrl.pathname 
    });

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

      userLogger.debug('Profile query result', { profile, profileError, userId: user.id });
      const membershipStatus = profile?.membership_status;
      userLogger.info('Athlete membership status check', { membershipStatus });

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
          userLogger.info('Redirecting to pending-approval', { 
            status: membershipStatus,
            path: request.nextUrl.pathname 
          });
          const url = request.nextUrl.clone();
          url.pathname = '/pending-approval';
          const redirectResponse = NextResponse.redirect(url);
          // Preserve correlation headers
          redirectResponse.headers.set('X-Correlation-ID', context.correlationId);
          redirectResponse.headers.set('X-Causation-ID', context.causationId);
          return redirectResponse;
        }
      }
    }

    // If accessing /dashboard root, redirect to role-specific dashboard
    if (request.nextUrl.pathname === '/dashboard') {
      userLogger.info('Redirecting from /dashboard to role-specific dashboard', { role: userRole });
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
      const redirectResponse = NextResponse.redirect(url);
      // Preserve correlation headers
      redirectResponse.headers.set('X-Correlation-ID', context.correlationId);
      redirectResponse.headers.set('X-Causation-ID', context.causationId);
      return redirectResponse;
    }

    // Prevent users from accessing dashboards they don't have permission for
    // Check if user is trying to access a different role's dashboard
    const isAccessingAdminDashboard = request.nextUrl.pathname.startsWith('/dashboard/admin');
    const isAccessingCoachDashboard = request.nextUrl.pathname.startsWith('/dashboard/coach');
    const isAccessingAthleteDashboard = request.nextUrl.pathname.startsWith('/dashboard/athlete');

    if (userRole === 'athlete' && (isAccessingAdminDashboard || isAccessingCoachDashboard)) {
      userLogger.warn('Athlete trying to access non-athlete dashboard', { 
        attemptedPath: request.nextUrl.pathname 
      });
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/athlete';
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('X-Correlation-ID', context.correlationId);
      redirectResponse.headers.set('X-Causation-ID', context.causationId);
      return redirectResponse;
    }

    if (userRole === 'coach' && (isAccessingAdminDashboard || isAccessingAthleteDashboard)) {
      userLogger.warn('Coach trying to access non-coach dashboard', { 
        attemptedPath: request.nextUrl.pathname 
      });
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/coach';
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('X-Correlation-ID', context.correlationId);
      redirectResponse.headers.set('X-Causation-ID', context.causationId);
      return redirectResponse;
    }

    if (userRole === 'admin' && (isAccessingCoachDashboard || isAccessingAthleteDashboard)) {
      userLogger.warn('Admin trying to access non-admin dashboard', { 
        attemptedPath: request.nextUrl.pathname 
      });
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/admin';
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('X-Correlation-ID', context.correlationId);
      redirectResponse.headers.set('X-Causation-ID', context.causationId);
      return redirectResponse;
    }
  }

  // Add correlation headers to final response
  supabaseResponse.headers.set('X-Correlation-ID', context.correlationId);
  supabaseResponse.headers.set('X-Causation-ID', context.causationId);
  
  return supabaseResponse;
  } catch (error) {
    logger.error('Middleware error', error as Error, {
      url: request.url,
      method: request.method,
    });
    // Return response even if there's an error to prevent 500
    const errorResponse = NextResponse.next({ request });
    errorResponse.headers.set('X-Correlation-ID', context.correlationId);
    errorResponse.headers.set('X-Causation-ID', context.causationId);
    return errorResponse;
  }
}
