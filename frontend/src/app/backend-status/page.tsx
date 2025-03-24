'use client';

import { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function BackendStatusPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isBackendUp, setIsBackendUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await endpoints.appointments.getByDate(new Date().toISOString().split('T')[0]);
        setIsBackendUp(true);
        // If backend is up, redirect to home page after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (error) {
        setIsBackendUp(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkBackend();
    // Set up interval to check backend status every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Backend Status
          </h2>
          <div className="mt-4">
            {isChecking ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Checking backend status...</span>
              </div>
            ) : isBackendUp ? (
              <div className="text-green-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="mt-2">Backend is running!</p>
                <p className="text-sm text-gray-500">Redirecting to home page...</p>
              </div>
            ) : (
              <div className="text-red-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="mt-2">Backend is not available</p>
                <p className="text-sm text-gray-500">Please check if the backend server is running</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 