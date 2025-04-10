'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface UserProfileProps {
  isCollapsed: boolean;
}

export default function UserProfile({ isCollapsed }: UserProfileProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Fetch user info from our backend API instead of directly from Google
        const response = await endpoints.google.auth.user();

        if (response.status === 401) {
          const data = response.data;
          if (data.redirect) {
            // Clear cookies
            document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'user_info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            // Redirect to login page
            router.push(data.redirect);
            return;
          }
          throw new Error('Failed to fetch user info');
        }

        const data = response.data;
        setUserInfo({
          id: data.id,
          email: data.email,
          name: data.name,
          picture: data.picture
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login?error=fetch_failed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear cookies
      document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center p-4">
        <a
          href="/api/auth/google/login"
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        >
          <FiUser className="h-5 w-5" />
          <span>Login with Google</span>
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'space-x-3 p-4'}`}>
      <div className={`${isCollapsed ? 'w-12 h-12' : 'w-8 h-8'}`}>
        <Image
          src={userInfo.picture}
          alt={userInfo.name}
          width={isCollapsed ? 48 : 32}
          height={isCollapsed ? 48 : 32}
          className="rounded-full"
          priority
        />
      </div>
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userInfo.name}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {userInfo.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiLogOut className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
} 