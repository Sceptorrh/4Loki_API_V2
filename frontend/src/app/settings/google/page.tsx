'use client';

import React, { useState, useEffect } from 'react';
import { FiKey, FiSave } from 'react-icons/fi';

export default function GoogleSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch current API key when component mounts
    fetchCurrentApiKey();
  }, []);

  const fetchCurrentApiKey = async () => {
    try {
      console.log('Fetching current API key...');
      const response = await fetch('/api/settings/google');
      console.log('API response:', response);
      if (response.ok) {
        const data = await response.json();
        console.log('API data:', data);
        setApiKey(data.apiKey || '');
      } else {
        console.error('Failed to fetch API key:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      console.log('Submitting API key:', apiKey);
      const response = await fetch('/api/settings/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      console.log('Submit response:', response);
      if (response.ok) {
        setStatus('success');
        setMessage('API key updated successfully');
      } else {
        throw new Error('Failed to update API key');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setStatus('error');
      setMessage('Failed to update API key. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-dog-gray mb-6">Google Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-dog-gray mb-2">
              Google API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiKey className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your Google API key"
              />
            </div>
            <p className="mt-1 text-sm text-secondary-600">
              This API key is used for Google Maps and other Google services.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-md ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={status === 'loading'}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${status === 'loading' 
                  ? 'bg-primary-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
            >
              <FiSave className="h-4 w-4 mr-2" />
              {status === 'loading' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 