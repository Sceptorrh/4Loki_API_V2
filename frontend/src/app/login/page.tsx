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
    // Check if user is already logged in
    const userInfoCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_info='))
      ?.split('=')[1];

    if (userInfoCookie) {
      try {
        const decoded = decodeURIComponent(userInfoCookie);
        setUserInfo(JSON.parse(decoded));
        // Redirect to home page if already logged in
        router.push('/');
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, [router]);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error signing in
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error === 'invalid_state' 
                    ? 'Invalid login attempt. Please try again.' 
                    : error === 'callback_failed'
                    ? 'Failed to complete sign in. Please try again.'
                    : 'An error occurred during sign in. Please try again.'}
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