# Security Headers Configuration

**Task**: 16.2 Configure security headers in Next.js  
**Status**: ✅ Complete  
**Requirements**: 9.5

## Overview

Comprehensive security headers have been configured in the Next.js application to protect against common web vulnerabilities including XSS, clickjacking, MIME type sniffing, and other attacks.

## Implementation Details

### 1. Next.js Configuration (`next.config.ts`)

Added an async `headers()` function that returns security headers for all routes:

#### General Routes (`/:path*`)

**Content Security Policy (CSP)**
- Prevents XSS attacks by restricting script sources
- Allows scripts only from `'self'`, inline scripts, and trusted CDNs (Google Fonts, Supabase)
- Restricts frame embedding with `frame-ancestors 'none'`
- Restricts form submissions to same origin

**X-Frame-Options: DENY**
- Prevents clickjacking attacks
- Blocks the page from being embedded in iframes

**X-Content-Type-Options: nosniff**
- Prevents MIME type sniffing
- Forces browser to respect declared content types

**X-XSS-Protection: 1; mode=block**
- Enables XSS protection in older browsers
- Blocks page if XSS attack is detected

**Referrer-Policy: strict-origin-when-cross-origin**
- Controls how much referrer information is shared
- Sends full referrer only for same-origin requests

**Permissions-Policy**
- Restricts browser features:
  - Camera: disabled
  - Microphone: disabled
  - Geolocation: disabled
  - Payment: disabled

**Strict-Transport-Security (HSTS)**
- Forces HTTPS for all communications
- Max age: 1 year (31536000 seconds)
- Includes subdomains
- Preload enabled for HSTS preload list

**CORS Headers**
- Allow-Origin: Configured from environment variable or production URL
- Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Allow-Headers: Content-Type, Authorization, X-Correlation-ID, X-Causation-ID
- Allow-Credentials: true
- Max-Age: 86400 seconds (24 hours)

**Additional Security Headers**
- X-Permitted-Cross-Domain-Policies: none
- Cross-Origin-Embedder-Policy: require-corp
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin

#### API Routes (`/api/:path*`)

Stricter CSP for API endpoints:
- `default-src 'none'` - Blocks all content by default
- No scripts, styles, images, or fonts allowed
- Prevents API responses from being embedded or executed

### 2. Middleware Configuration (`middleware.ts`)

Enhanced middleware to enforce HTTPS-only cookies:

**Cookie Security Flags**
- **Secure**: Ensures cookies are only sent over HTTPS
- **HttpOnly**: Prevents JavaScript access to cookies (protects against XSS)
- **SameSite=Strict**: Prevents CSRF attacks by restricting cross-site cookie sending

**Implementation**
- Automatically adds security flags to all cookies in production
- Preserves existing flags if already present
- Adds correlation and causation IDs for request tracing

## Security Benefits

### XSS Prevention
- CSP restricts script execution to trusted sources
- HttpOnly cookies prevent JavaScript access
- Input validation and sanitization (implemented separately)

### Clickjacking Prevention
- X-Frame-Options: DENY blocks iframe embedding
- Cross-Origin-Opener-Policy: same-origin prevents window.opener access

### MIME Type Sniffing Prevention
- X-Content-Type-Options: nosniff forces browser to respect content types

### CSRF Prevention
- SameSite=Strict cookies prevent cross-site requests
- CORS headers restrict cross-origin requests

### Data Leakage Prevention
- Referrer-Policy controls referrer information sharing
- Permissions-Policy restricts sensitive browser features

### HTTPS Enforcement
- HSTS forces all communications over HTTPS
- Secure flag ensures cookies only sent over HTTPS

## Configuration Files

### Modified Files
1. **sports-club-management/next.config.ts**
   - Added `headers()` async function
   - Configured security headers for all routes
   - Separate stricter CSP for API routes

2. **sports-club-management/middleware.ts**
   - Enhanced cookie security in production
   - Added Secure, HttpOnly, and SameSite flags
   - Preserved existing correlation ID functionality

### New Files
1. **sports-club-management/tests/security-headers.test.ts**
   - 18 tests validating security header configuration
   - Tests for CSP, CORS, HSTS, and other headers
   - All tests passing ✅

## Environment Variables

The following environment variable is used for dynamic CORS configuration:

```env
NEXT_PUBLIC_APP_URL=https://sports-club-management.vercel.app
```

If not set, defaults to production URL.

## Testing

Run security headers tests:
```bash
npm run test -- tests/security-headers.test.ts --run
```

**Test Results**: ✅ 18/18 tests passing

## Deployment Considerations

1. **Production Only**: HTTPS-only cookie enforcement is active only in production
2. **HSTS Preload**: The domain can be added to HSTS preload list for additional security
3. **CSP Violations**: Monitor browser console for CSP violations and adjust policy if needed
4. **CORS Configuration**: Update `NEXT_PUBLIC_APP_URL` for different deployment environments

## Security Checklist

- ✅ Content Security Policy configured
- ✅ X-Frame-Options set to DENY
- ✅ X-Content-Type-Options set to nosniff
- ✅ X-XSS-Protection enabled
- ✅ Referrer-Policy configured
- ✅ Permissions-Policy configured
- ✅ Strict-Transport-Security enabled
- ✅ CORS headers configured
- ✅ HTTPS-only cookies enforced
- ✅ Additional security headers added
- ✅ API routes have stricter CSP
- ✅ Tests implemented and passing

## References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

## Related Requirements

- **Requirement 9.5**: Data Security and Privacy - Security headers implementation
- **Requirement 9.1**: RLS policies (separate implementation)
- **Requirement 9.2**: Input validation and sanitization (separate implementation)
- **Requirement 9.3**: Session token invalidation (separate implementation)
- **Requirement 9.4**: Rate limiting and account lockout (separate implementation)
