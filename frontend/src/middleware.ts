import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/backend-status', '/settings'];

// This middleware runs on every request
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public paths
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/settings/')) {
    return NextResponse.next();
  }

  // Check for session ID in cookies
  const sessionId = request.cookies.get('session_id')?.value;

  // If no session ID and not on a public path, redirect to login
  if (!sessionId) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'not_authenticated');
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Check backend health
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    if (!response.ok) {
      throw new Error('Backend is not available');
    }
    return NextResponse.next();
  } catch (error) {
    // If backend is not available, redirect to backend status page
    return NextResponse.redirect(new URL('/backend-status', request.url));
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 