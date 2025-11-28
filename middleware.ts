import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import {
  generateCorrelationId,
  generateCausationId,
  extractCorrelationId,
} from '@/lib/utils/correlation';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit';

export async function middleware(request: NextRequest) {
  // Apply rate limiting for authentication endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const clientId = getClientIdentifier(request);
    const { allowed, retryAfter } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.AUTH);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60',
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              Date.now() + (retryAfter || 60) * 1000
            ).toISOString(),
          },
        }
      );
    }
  }

  // Apply rate limiting for general API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientId = getClientIdentifier(request);
    const { allowed, retryAfter } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60',
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.API.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              Date.now() + (retryAfter || 60) * 1000
            ).toISOString(),
          },
        }
      );
    }
  }

  // Generate or extract correlation ID
  const existingCorrelationId = extractCorrelationId(request.headers);
  const correlationId = existingCorrelationId || generateCorrelationId();
  
  // Generate causation ID for this operation
  const causationId = generateCausationId();
  
  // Call the session update middleware
  const response = await updateSession(request);
  
  // Add correlation and causation IDs to response headers
  response.headers.set('X-Correlation-ID', correlationId);
  response.headers.set('X-Causation-ID', causationId);
  
  // Enforce HTTPS-only cookies in production
  if (process.env.NODE_ENV === 'production') {
    // Ensure all cookies are secure and httpOnly
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const secureCookie = setCookieHeader
        .split(',')
        .map(cookie => {
          // Add Secure flag for HTTPS
          if (!cookie.includes('Secure')) {
            cookie = cookie.trim() + '; Secure';
          }
          // Add HttpOnly flag to prevent JavaScript access
          if (!cookie.includes('HttpOnly')) {
            cookie = cookie + '; HttpOnly';
          }
          // Add SameSite attribute for CSRF protection
          if (!cookie.includes('SameSite')) {
            cookie = cookie + '; SameSite=Strict';
          }
          return cookie;
        })
        .join(',');
      response.headers.set('set-cookie', secureCookie);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
