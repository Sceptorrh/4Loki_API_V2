import axios from 'axios';
import Cookies from 'js-cookie';
import { googleConfig } from '../config/google';

// Get session ID from various possible sources
export function getSessionId(): string | null {
  // Check URL parameter first (for initial load after login)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    if (sessionParam) {
      // Save to cookie for future use
      Cookies.set('session_id', sessionParam, { expires: 1 }); // 1 day
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return sessionParam;
    }
  }

  // Check cookies
  const sessionId = Cookies.get('session_id');
  if (sessionId) {
    return sessionId;
  }

  // No session found
  return null;
}

// Create an axios instance with authentication headers
export const authAxios = axios.create({
  baseURL: googleConfig.api.baseUrl,
});

// Add interceptor to include session in all requests
authAxios.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

// Get current user info
export async function getCurrentUser() {
  try {
    const sessionId = getSessionId();
    if (!sessionId) {
      return null;
    }

    const response = await authAxios.get('/google/auth/user');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Logout user
export function logout() {
  Cookies.remove('session_id');
  Cookies.remove('user_info');
  window.location.href = '/login';
} 