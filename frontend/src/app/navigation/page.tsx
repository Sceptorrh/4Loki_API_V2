'use client';

import { useEffect, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import LocationMap from '@/components/LocationMap';

interface TravelTime {
  id: number;
  isHomeToWork: boolean;
  duration: number; // in seconds
  distance: number; // in meters
  createdOn: string;
}

export default function NavigationSettings() {
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [workLocation, setWorkLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingTravelTimes, setIsUpdatingTravelTimes] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [travelTimesError, setTravelTimesError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [travelTimes, setTravelTimes] = useState<TravelTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingSettings();
    loadTravelTimes();
  }, []);

  const loadExistingSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/navigation-settings');
      
      if (!response.ok) {
        if (response.status === 404) {
          // No settings exist yet, this is fine
          return;
        }
        throw new Error(`Failed to load settings: ${response.status}`);
      }

      const data = await response.json();
      setHomeAddress(data.homeAddress || '');
      setWorkAddress(data.workAddress || '');
      
      // If we have stored locations, set them
      if (data.homeLatitude && data.homeLongitude) {
        setHomeLocation({
          lat: parseFloat(data.homeLatitude),
          lng: parseFloat(data.homeLongitude)
        });
      }
      
      if (data.workLatitude && data.workLongitude) {
        setWorkLocation({
          lat: parseFloat(data.workLatitude),
          lng: parseFloat(data.workLongitude)
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSaveError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadTravelTimes = async () => {
    try {
      const response = await fetch('/api/travel-times');
      
      if (!response.ok) {
        throw new Error(`Failed to load travel times: ${response.status}`);
      }

      const data = await response.json();
      setTravelTimes(data);
    } catch (error) {
      console.error('Error loading travel times:', error);
      setTravelTimesError('Failed to load travel times');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/navigation-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeAddress,
          workAddress,
          homeLatitude: homeLocation?.lat.toString() || null,
          homeLongitude: homeLocation?.lng.toString() || null,
          workLatitude: workLocation?.lat.toString() || null,
          workLongitude: workLocation?.lng.toString() || null
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      setSuccessMessage('Settings saved successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTravelTimes = async () => {
    if (!homeLocation || !workLocation) {
      setTravelTimesError('Both home and work locations must be set');
      return;
    }

    setIsUpdatingTravelTimes(true);
    setTravelTimesError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/travel-times/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeLocation,
          workLocation
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update travel times: ${response.status}`);
      }

      // Reload travel times
      await loadTravelTimes();
      setSuccessMessage('Travel times updated successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating travel times:', error);
      setTravelTimesError('Failed to update travel times. Please try again.');
    } finally {
      setIsUpdatingTravelTimes(false);
    }
  };

  // Handle address selection
  const handleHomeAddressChange = (value: string, placeData?: { lat: number; lng: number; display_name: string }) => {
    setHomeAddress(value);
    if (placeData) {
      setHomeLocation({ lat: placeData.lat, lng: placeData.lng });
    }
  };

  const handleWorkAddressChange = (value: string, placeData?: { lat: number; lng: number; display_name: string }) => {
    setWorkAddress(value);
    if (placeData) {
      setWorkLocation({ lat: placeData.lat, lng: placeData.lng });
    }
  };

  // Format duration in minutes:seconds
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format distance in kilometers
  const formatDistance = (meters: number): string => {
    const kilometers = (meters / 1000).toFixed(1);
    return `${kilometers} km`;
  };

  // Format date in human-readable format
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Navigation Settings</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {saveError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Address Settings</h2>
        
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AddressAutocomplete
              id="homeAddress"
              label="Home Address"
              value={homeAddress}
              onChange={handleHomeAddressChange}
              required
            />
            
            <AddressAutocomplete
              id="workAddress"
              label="Work Address"
              value={workAddress}
              onChange={handleWorkAddressChange}
              required
            />
          </div>
        
          <button
            type="submit"
            disabled={isSaving || !homeAddress || !workAddress}
            className={`w-full py-2 px-4 rounded ${
              isSaving || !homeAddress || !workAddress
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <LocationMap
        homeLocation={homeLocation}
        workLocation={workLocation}
        homeAddress={homeAddress}
        workAddress={workAddress}
      />

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Travel Times</h2>
          <button
            onClick={updateTravelTimes}
            disabled={isUpdatingTravelTimes || !homeLocation || !workLocation}
            className={`py-2 px-4 rounded ${
              isUpdatingTravelTimes || !homeLocation || !workLocation
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isUpdatingTravelTimes ? 'Updating...' : 'Update Travel Times'}
          </button>
        </div>
        
        {travelTimesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {travelTimesError}
          </div>
        )}

        {travelTimes.length === 0 ? (
          <p className="text-gray-500 italic">No travel times available. Click "Update Travel Times" to calculate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculated At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {travelTimes.map((travelTime) => (
                  <tr key={travelTime.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {travelTime.isHomeToWork ? 'Home → Work' : 'Work → Home'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDuration(travelTime.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDistance(travelTime.distance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(travelTime.createdOn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 