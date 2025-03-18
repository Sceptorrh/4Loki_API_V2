import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
  // Return the original response without any redirects
  return NextResponse.next();
}

// Specify paths this middleware will run on (all paths)
export const config = {
  matcher: '/:path*',
}; 