import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy (with Google AdSense and Firebase support)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://tpc.googlesyndication.com https://www.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://fcm.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com; " +
    "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;"
  );

  // HSTS (HTTP Strict Transport Security) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - firebase-messaging-sw.js (Firebase service worker)
    '/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw.js).*)',
  ],
};