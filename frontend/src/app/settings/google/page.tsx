'use client';

import React, { useState, useEffect } from 'react';
import { FiKey, FiSave, FiLock, FiUser, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { endpoints } from '@/lib/api';

interface GoogleSettings {
  apiKey: string;
  oauthClientId: string;
  oauthClientSecret: string;
}

interface ValidationResult {
  apiKey?: {
    valid: boolean;
    message: string;
    apis?: string[];
  };
  oauthClientId?: {
    valid: boolean;
    message: string;
    details?: string;
    scopes?: string[];
    consentScreen?: {
      status: string;
      scopes: string[];
      testUsers: string[];
    };
  };
}

interface ValidationStatus {
  apiKey: {
    loading: boolean;
    error: string | null;
  };
  oauthClientId: {
    loading: boolean;
    error: string | null;
    fullConfigLoading?: boolean;
    fullConfigError?: string | null;
  };
}

export default function GoogleSettingsPage() {
  const [settings, setSettings] = useState<GoogleSettings>({
    apiKey: '',
    oauthClientId: '',
    oauthClientSecret: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    apiKey: { loading: false, error: null },
    oauthClientId: { loading: false, error: null }
  });
  const [validationResult, setValidationResult] = useState<ValidationResult>({});
  const [showApis, setShowApis] = useState(false);

  useEffect(() => {
    // Fetch current settings when component mounts
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      console.log('Fetching current settings...');
      const response = await endpoints.google.settings.get();
      console.log('API response:', response);
      if (response.status === 200) {
        const data = response.data;
        console.log('API data:', data);
        setSettings({
          apiKey: data.apiKey || '',
          oauthClientId: data.oauthClientId || '',
          oauthClientSecret: data.oauthClientSecret || ''
        });
      } else {
        console.error('Failed to fetch settings:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      console.log('Submitting settings:', settings);
      const response = await fetch('/api/settings/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      console.log('Submit response:', response);
      if (response.ok) {
        setStatus('success');
        setMessage('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setStatus('error');
      setMessage('Failed to update settings. Please try again.');
    }
  };

  const handleChange = (field: keyof GoogleSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear validation results when settings change
    setValidationResult({});
    setValidationStatus({
      apiKey: { loading: false, error: null },
      oauthClientId: { loading: false, error: null }
    });
  };

  const validateCredentials = async (type: 'apiKey' | 'oauthClientId') => {
    try {
      setValidationStatus(prev => ({
        ...prev,
        [type]: { loading: true, error: null }
      }));

      const response = await fetch('/api/settings/google/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: type === 'apiKey' ? settings.apiKey : undefined,
          oauthClientId: type === 'oauthClientId' ? settings.oauthClientId : undefined,
          oauthClientSecret: type === 'oauthClientId' ? settings.oauthClientSecret : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult(prev => ({
          ...prev,
          [type]: data[type]
        }));
        setValidationStatus(prev => ({
          ...prev,
          [type]: 'success'
        }));
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({
        ...prev,
        [type]: 'error'
      }));
      setValidationResult(prev => ({
        ...prev,
        [type]: { valid: false, message: `Failed to validate ${type}` }
      }));
    }
  };

  const validateFullConfig = async () => {
    try {
      setValidationStatus(prev => ({
        ...prev,
        oauthClientId: {
          ...prev.oauthClientId,
          fullConfigLoading: true,
          fullConfigError: null
        }
      }));

      const response = await fetch('/api/settings/google/validate/full-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oauthClientId: settings.oauthClientId,
          oauthClientSecret: settings.oauthClientSecret
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult(prev => ({
          ...prev,
          oauthClientId: {
            ...prev.oauthClientId,
            ...data.oauthClientId
          }
        }));
      } else {
        setValidationStatus(prev => ({
          ...prev,
          oauthClientId: {
            ...prev.oauthClientId,
            fullConfigError: data.error || 'Failed to validate full configuration'
          }
        }));
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        oauthClientId: {
          ...prev.oauthClientId,
          fullConfigError: error instanceof Error ? error.message : 'Failed to validate full configuration'
        }
      }));
    } finally {
      setValidationStatus(prev => ({
        ...prev,
        oauthClientId: {
          ...prev.oauthClientId,
          fullConfigLoading: false
        }
      }));
    }
  };

  const getValidationIcon = (valid: boolean | undefined) => {
    if (valid === undefined) return null;
    return valid ? (
      <FiCheck className="h-5 w-5 text-green-500" />
    ) : (
      <FiX className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-dog-gray mb-6">Google Settings</h1>
      
      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Key Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="apiKey" className="block text-sm font-medium text-dog-gray">
              Google API Key
            </label>
            <button
              type="button"
              onClick={() => validateCredentials('apiKey')}
              disabled={validationStatus.apiKey.loading || !settings.apiKey}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
            >
              {validationStatus.apiKey.loading ? (
                <FiLoader className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Validate
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiKey className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="text"
              id="apiKey"
              value={settings.apiKey}
              onChange={handleChange('apiKey')}
              className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your Google API key"
            />
          </div>
          {validationResult.apiKey && (
            <div className="mt-2 flex items-center space-x-2">
              {getValidationIcon(validationResult.apiKey.valid)}
              <span className={`text-sm ${validationResult.apiKey.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationResult.apiKey.message}
              </span>
            </div>
          )}
          {validationResult.apiKey?.valid && validationResult.apiKey.apis && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowApis(!showApis)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showApis ? 'Hide' : 'Show'} Available APIs
              </button>
              {showApis && (
                <ul className="mt-2 text-sm text-secondary-600 list-disc list-inside">
                  {validationResult.apiKey.apis.map((api, index) => (
                    <li key={index}>{api}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="mt-1 text-sm text-secondary-600">
            This API key is used for Google Maps and other Google services.
          </p>
        </div>

        {/* OAuth Client ID Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="oauthClientId" className="block text-sm font-medium text-dog-gray">
              OAuth Client ID
            </label>
            <button
              type="button"
              onClick={() => validateCredentials('oauthClientId')}
              disabled={validationStatus.oauthClientId.loading || !settings.oauthClientId}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
            >
              {validationStatus.oauthClientId.loading ? (
                <FiLoader className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Validate
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="text"
              id="oauthClientId"
              value={settings.oauthClientId}
              onChange={handleChange('oauthClientId')}
              className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your OAuth Client ID"
            />
          </div>
          {validationResult.oauthClientId && (
            <div className="mt-2">
              <div className={`p-3 rounded-md ${
                validationResult.oauthClientId.valid 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                <p className="font-medium">{validationResult.oauthClientId.message}</p>
                <p className="text-sm mt-1">{validationResult.oauthClientId.details}</p>
                
                {validationResult.oauthClientId.valid && (
                  <div className="mt-4">
                    <button
                      onClick={validateFullConfig}
                      disabled={validationStatus.oauthClientId.fullConfigLoading}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        validationStatus.oauthClientId.fullConfigLoading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {validationStatus.oauthClientId.fullConfigLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Validating Full Configuration...
                        </span>
                      ) : (
                        'Validate Full Configuration'
                      )}
                    </button>

                    {validationStatus.oauthClientId.fullConfigError && (
                      <p className="mt-2 text-sm text-red-600">
                        {validationStatus.oauthClientId.fullConfigError}
                      </p>
                    )}

                    {validationResult.oauthClientId.consentScreen && (
                      <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-900">OAuth Consent Screen</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {validationResult.oauthClientId.consentScreen.status}
                        </p>
                        <div className="mt-2">
                          <h5 className="text-sm font-medium text-gray-700">Configured Scopes:</h5>
                          <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                            {validationResult.oauthClientId.consentScreen.scopes.map((scope, index) => (
                              <li key={index}>{scope}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2">
                          <h5 className="text-sm font-medium text-gray-700">Test Users:</h5>
                          <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                            {validationResult.oauthClientId.consentScreen.testUsers.map((user, index) => (
                              <li key={index}>{user}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="mt-1 text-sm text-secondary-600">
            Required for Google Sign-In and user authentication.
          </p>
        </div>

        {/* OAuth Client Secret Field */}
        <div>
          <label htmlFor="oauthClientSecret" className="block text-sm font-medium text-dog-gray mb-2">
            OAuth Client Secret
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="password"
              id="oauthClientSecret"
              value={settings.oauthClientSecret}
              onChange={handleChange('oauthClientSecret')}
              className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your OAuth Client Secret"
            />
          </div>
          <p className="mt-1 text-sm text-secondary-600">
            Keep this secret secure. It's used to authenticate your application with Google.
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
  );
} 