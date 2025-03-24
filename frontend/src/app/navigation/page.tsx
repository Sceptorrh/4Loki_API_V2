'use client';

import { useEffect, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import LocationMap from '@/components/LocationMap';

interface TravelTime {
  id: number;
  isHomeToWork: boolean;
  duration: number; // now in minutes
  distance: number; // now in kilometers
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
  const [isEditing, setIsEditing] = useState(false);
  const [settingsExist, setSettingsExist] = useState(false);

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
          setIsEditing(true); // Show edit form if no settings exist
          setSettingsExist(false);
          return;
        }
        throw new Error(`Failed to load settings: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if we have valid settings
      const hasValidSettings = 
        data && 
        data.HomeLatitude && 
        data.HomeLongitude && 
        data.WorkLatitude && 
        data.WorkLongitude && 
        data.HomeLatitude !== '0' && 
        data.HomeLongitude !== '0' && 
        data.WorkLatitude !== '0' && 
        data.WorkLongitude !== '0';
      
      setSettingsExist(hasValidSettings);
      
      // If we have empty settings record but no actual locations, show edit form
      if (!hasValidSettings) {
        setIsEditing(true);
        return;
      }
      
      // If we have stored locations, set them
      if (data.HomeLatitude && data.HomeLongitude) {
        const homeLat = parseFloat(data.HomeLatitude);
        const homeLng = parseFloat(data.HomeLongitude);
        
        setHomeLocation({
          lat: homeLat,
          lng: homeLng
        });
        
        // Try to get address from coordinates using Nominatim
        try {
          const address = await reverseGeocode(homeLat, homeLng);
          setHomeAddress(address);
        } catch (error) {
          console.error('Error reverse geocoding home address:', error);
          setHomeAddress(formatCoordinates(homeLat, homeLng));
        }
      }
      
      if (data.WorkLatitude && data.WorkLongitude) {
        const workLat = parseFloat(data.WorkLatitude);
        const workLng = parseFloat(data.WorkLongitude);
        
        setWorkLocation({
          lat: workLat,
          lng: workLng
        });
        
        // Try to get address from coordinates for work address
        try {
          const address = await reverseGeocode(workLat, workLng);
          setWorkAddress(address);
        } catch (error) {
          console.error('Error reverse geocoding work address:', error);
          setWorkAddress(formatCoordinates(workLat, workLng));
        }
      }

      // If both locations are set and valid, hide the edit form
      if (hasValidSettings) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSaveError('Failed to load settings');
      setIsEditing(true); // Show edit form on error
      setSettingsExist(false);
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
      console.log('Travel times data:', data);
      
      // Ensure all travel times have valid distance and duration
      const validatedData = data.map((item: any) => ({
        ...item,
        distance: item.distance !== undefined && item.distance !== null ? Number(item.distance) : 0,
        duration: item.duration !== undefined && item.duration !== null ? Number(item.duration) : 0
      }));
      
      setTravelTimes(validatedData);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          HomeLatitude: homeLocation?.lat.toString() || '',
          HomeLongitude: homeLocation?.lng.toString() || '',
          WorkLatitude: workLocation?.lat.toString() || '',
          WorkLongitude: workLocation?.lng.toString() || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      setSuccessMessage('Settings saved successfully!');
      setSettingsExist(true);
      setIsEditing(false); // Hide edit form after successful save
      
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

  // Format duration in minutes
  const formatDuration = (minutes: number): string => {
    if (minutes === undefined || minutes === null || isNaN(minutes)) {
      return '0 min';
    }
    return `${minutes} min`;
  };

  // Format distance in kilometers
  const formatDistance = (kilometers: number): string => {
    if (kilometers === undefined || kilometers === null || isNaN(kilometers)) {
      return '0.0 km';
    }
    return `${kilometers.toFixed(1)} km`;
  };

  // Format date in human-readable format
  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return 'Unknown date';
    }
    return new Date(dateString).toLocaleString();
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Format coordinates
  const formatCoordinates = (lat?: number, lng?: number): string => {
    if (!lat || !lng) return 'Not set';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Try to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': '4Loki_API'
        }
      });
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      return formatCoordinates(lat, lng);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return formatCoordinates(lat, lng);
    }
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

      {(isEditing || settingsExist) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Address Settings</h2>
            {settingsExist && (
              <button
                onClick={toggleEditMode}
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
          
          {isEditing ? (
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
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Home Address</p>
                  <p className="mt-1">
                    {homeAddress || (homeLocation ? formatCoordinates(homeLocation.lat, homeLocation.lng) : 'Not set')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Work Address</p>
                  <p className="mt-1">
                    {workAddress || (workLocation ? formatCoordinates(workLocation.lat, workLocation.lng) : 'Not set')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <LocationMap
        homeLocation={homeLocation}
        workLocation={workLocation}
        homeAddress={homeAddress}
        workAddress={workAddress}
        onEdit={toggleEditMode}
      />

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Travel Times</h2>
          <button
            onClick={updateTravelTimes}
            disabled={isUpdatingTravelTimes || !settingsExist || !homeLocation || !workLocation}
            className={`py-2 px-4 rounded ${
              isUpdatingTravelTimes || !settingsExist || !homeLocation || !workLocation
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