'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUser, FiLogOut } from 'react-icons/fi';

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

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem('google_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const data = await response.json();
        setUserInfo({
          id: data.id,
          email: data.email,
          name: data.name,
          picture: data.picture
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('google_token');
    
    // Clear authentication cookie
    document.cookie = 'is_authenticated=false; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    
    // Redirect to login page
    window.location.href = '/login';
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
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        {userInfo.picture ? (
          <Image
            src={userInfo.picture}
            alt={userInfo.name}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <FiUser className="h-8 w-8 text-gray-500" />
        )}
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{userInfo.name}</span>
            <span className="text-xs text-gray-500">{userInfo.email}</span>
          </div>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <FiLogOut className="h-5 w-5" />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </div>
  );
} 