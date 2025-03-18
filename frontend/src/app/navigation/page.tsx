'use client';

import { useEffect, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import LocationMap from '@/components/LocationMap';

export default function NavigationSettings() {
  const [homeLocation, setHomeLocation] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [homeCoords, setHomeCoords] = useState<google.maps.LatLngLiteral>();
  const [workCoords, setWorkCoords] = useState<google.maps.LatLngLiteral>();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    checkApiKeyStatus();
    loadExistingSettings();
  }, []);

  useEffect(() => {
    if (hasApiKey && !googleMapsLoaded) {
      let mounted = true;
      
      const loadMaps = async () => {
        try {
          console.log('Fetching API key...');
          const response = await fetch('/api/navigation-settings/api-key');
          const data = await response.json();
          
          if (!mounted) return;
          
          if (!data.apiKey) {
            throw new Error('No API key available');
          }

          console.log('Loading Google Maps...');
          await loadGoogleMaps(data.apiKey);
          console.log('Google Maps loaded successfully');
          
          if (!mounted) return;
          
          if (!window.google?.maps) {
            throw new Error('Google Maps failed to load - maps object not available');
          }
          
          setGoogleMapsLoaded(true);
        } catch (error) {
          console.error('Error loading Google Maps:', error);
          if (mounted) {
            setApiKeyError('Failed to load Google Maps');
          }
        }
      };

      loadMaps();
      return () => {
        mounted = false;
      };
    }
  }, [hasApiKey, googleMapsLoaded]);

  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/navigation-settings/api-key-status');
      const data = await response.json();
      
      console.log('API key status:', data);
      setHasApiKey(data.hasServerApiKey);
      
      if (!data.hasServerApiKey) {
        setApiKeyError('No API key configured. Please set up your Google API key.');
      }
    } catch (error) {
      console.error('Error checking API key status:', error);
      setApiKeyError('Failed to check API key status');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleHomeAddressChange = (address: string, placeData?: google.maps.places.PlaceResult) => {
    setHomeLocation(address);
    if (placeData?.geometry?.location) {
      setHomeCoords({
        lat: placeData.geometry.location.lat(),
        lng: placeData.geometry.location.lng()
      });
    }
  };

  const handleWorkAddressChange = (address: string, placeData?: google.maps.places.PlaceResult) => {
    setWorkLocation(address);
    if (placeData?.geometry?.location) {
      setWorkCoords({
        lat: placeData.geometry.location.lat(),
        lng: placeData.geometry.location.lng()
      });
    }
  };

  const loadExistingSettings = async () => {
    try {
      const response = await fetch('/api/navigation-settings');
      
      if (!response.ok) {
        if (response.status === 404) {
          // No settings exist yet, this is fine
          return;
        }
        throw new Error(`Failed to load settings: ${response.status}`);
      }

      const data = await response.json();
      setHomeLocation(data.HomeAddress || '');
      setWorkLocation(data.WorkAddress || '');
    } catch (error) {
      console.error('Error loading settings:', error);
      // Don't show error for missing settings
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/navigation-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          HomeAddress: homeLocation,
          WorkAddress: workLocation,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      // Settings saved successfully
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (apiKeyLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Navigation Settings</h1>
      
      {apiKeyError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {apiKeyError}
        </div>
      )}

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {googleMapsLoaded ? (
              <AddressAutocomplete
                id="home-address"
                label="Home Address"
                value={homeLocation}
                onChange={handleHomeAddressChange}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Address
                </label>
                <input
                  type="text"
                  value={homeLocation}
                  onChange={(e) => setHomeLocation(e.target.value)}
                  placeholder="Enter your home address"
                  className="w-full p-2 border rounded"
                  disabled={!hasApiKey}
                />
              </div>
            )}
          </div>

          <div>
            {googleMapsLoaded ? (
              <AddressAutocomplete
                id="work-address"
                label="Work Address"
                value={workLocation}
                onChange={handleWorkAddressChange}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Address
                </label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="Enter your work address"
                  className="w-full p-2 border rounded"
                  disabled={!hasApiKey}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {googleMapsLoaded && window.google?.maps ? (
            <LocationMap
              key={`map-${homeLocation || 'none'}-${workLocation || 'none'}`}
              homeLocation={homeCoords}
              workLocation={workCoords}
              homeAddress={homeLocation}
              workAddress={workLocation}
            />
          ) : (
            <div className="w-full h-64 md:h-96 rounded-md border border-gray-300 relative">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving || !homeLocation || !workLocation}
          className={`w-full py-2 px-4 rounded ${
            isSaving || !homeLocation || !workLocation
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {!hasApiKey && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Google API Key Setup Required
          </h2>
          <p className="text-yellow-700">
            To use the navigation features, you need to set up a Google API key. Please follow these steps:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-2 text-yellow-700">
            <li>Create a Google Cloud Project</li>
            <li>Enable the required APIs (Maps JavaScript, Places, Directions)</li>
            <li>Create an API key with appropriate restrictions</li>
            <li>Add the API key to your server configuration</li>
          </ol>
          <p className="mt-2 text-yellow-700">
            For detailed instructions, please refer to the API_KEY_SETUP.md file in the project root.
          </p>
        </div>
      )}
    </div>
  );
} 