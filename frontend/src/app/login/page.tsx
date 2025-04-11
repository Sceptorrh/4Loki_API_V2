'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiUser } from 'react-icons/fi';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for session ID
        const sessionId = document.cookie
          .split('; ')
          .find(row => row.startsWith('session_id='))
          ?.split('=')[1];

        // Only proceed if we have a session ID
        if (!sessionId) {
          return;
        }

        try {
          // Fetch user data directly from the database using the session ID
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/google/auth/user`, {
            headers: {
              'x-session-id': sessionId
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUserInfo(userData);
            router.push('/');
          } else {
            // Session is invalid, clear cookies
            document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'user_info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            setUserInfo(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserInfo(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUserInfo(null);
      }
    };

    checkAuthStatus();
  }, [router]);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/login';
  };

  const getErrorMessage = () => {
    switch (error) {
      case 'not_authenticated':
        return null; // Don't show error for not authenticated state
      case 'session_expired':
        return 'Your session has expired. Please sign in again';
      case 'fetch_failed':
        return 'Failed to fetch user information. Please try again';
      case 'callback_failed':
        return 'Failed to complete sign in. Please try again';
      case 'state_storage_failed':
        return 'Failed to initialize login. Please try again';
      case 'init_failed':
        return 'Failed to start login process. Please try again';
      default:
        return error ? 'An error occurred during sign in. Please try again' : null;
    }
  };

  const getWelcomeMessage = () => {
    // Show welcome message if not authenticated or if explicitly redirected from middleware
    if (!userInfo || error === 'not_authenticated') {
      return (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Welcome to Loki
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                Please sign in to access your account
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {getWelcomeMessage()}
        
        {error && error !== 'not_authenticated' && getErrorMessage() && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error signing in
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {getErrorMessage()}
                </div>
              </div>
            </div>
          </div>
        )}

        {userInfo ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiUser className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Welcome back, {userInfo.name}!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  You are already signed in. Redirecting to home page...
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
} 