import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'not_authenticated', redirect: '/login?error=not_authenticated' },
        { status: 401 }
      );
    }

    // Fetch user info from our backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/google/auth/user`, {
      headers: {
        'x-session-id': sessionId
      }
    });

    if (response.status === 401) {
      // Clear session cookie
      const response = NextResponse.json(
        { error: 'session_expired', redirect: '/login?error=session_expired' },
        { status: 401 }
      );
      response.cookies.delete('session_id');
      response.cookies.delete('user_info');
      return response;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'fetch_failed', redirect: '/login?error=fetch_failed' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in user info route:', error);
    return NextResponse.json(
      { error: 'fetch_failed', redirect: '/login?error=fetch_failed' },
      { status: 500 }
    );
  }
} 