'use client';

import { useEffect, useState, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import LocationMap from '@/components/LocationMap';

interface TravelTime {
  id: number;
  userId: number;
  direction: 'home_to_work' | 'work_to_home';
  duration: number;
  distance: number;
  calculatedAt: string;
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
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TravelTime;
    direction: 'asc' | 'desc';
  }>({ key: 'calculatedAt', direction: 'desc' });
  const [directionFilter, setDirectionFilter] = useState<'all' | 'home_to_work' | 'work_to_home'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    progress: number;
    processedRecords: number;
    totalRecords: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        data.homeLatitude && 
        data.homeLongitude && 
        data.workLatitude && 
        data.workLongitude && 
        data.homeLatitude !== '' && 
        data.homeLongitude !== '' && 
        data.workLatitude !== '' && 
        data.workLongitude !== '';
      
      setSettingsExist(hasValidSettings);
      
      // If we have empty settings record but no actual locations, show edit form
      if (!hasValidSettings) {
        setIsEditing(true);
        return;
      }
      
      // If we have stored locations, set them
      if (data.homeLatitude && data.homeLongitude) {
        const homeLat = parseFloat(data.homeLatitude);
        const homeLng = parseFloat(data.homeLongitude);
        
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
      
      if (data.workLatitude && data.workLongitude) {
        const workLat = parseFloat(data.workLatitude);
        const workLng = parseFloat(data.workLongitude);
        
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
      const response = await fetch('/api/v1/travel-times');
      if (!response.ok) {
        throw new Error('Failed to fetch travel times');
      }
      const data = await response.json();
      
      // Transform the data to match our TravelTime interface
      const transformedData = data.map((item: any) => ({
        id: item.Id,
        userId: 1, // Since we don't have this in the API response, using a default value
        direction: item.IsHomeToWork === 1 ? 'home_to_work' : 'work_to_home',
        duration: item.Duration,
        distance: item.Distance,
        calculatedAt: item.CreatedOn
      }));
      
      setTravelTimes(transformedData);
    } catch (error) {
      console.error('Error fetching travel times:', error);
      setError('Failed to load travel times');
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
      setError("Please set both home and work locations first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/travel-times/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeLocation,
          workLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for specific Google Maps API errors
        if (data.message && data.message.includes('Google Maps API')) {
          setError(`Google Maps API Error: ${data.message}. This could be due to API key issues or rate limiting.`);
        } else if (data.message && data.message.includes('authorized to use this API')) {
          setError('The Google Maps API key needs to be enabled for the Routes API in Google Cloud Console.');
        } else {
          setError(data.message || 'Failed to update travel times');
        }
        return;
      }

      setSuccessMessage('Travel times updated successfully!');
      setSettingsExist(true);
      setIsEditing(false); // Hide edit form after successful update
      
      // Refresh the travel times data
      await loadTravelTimes();
    } catch (err) {
      console.error('Error updating travel times:', err);
      setError('Failed to update travel times. Please try again later.');
    } finally {
      setIsUpdatingTravelTimes(false);
      setLoading(false);
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

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const formatDistance = (kilometers: number): string => {
    return `${kilometers.toFixed(1)} km`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const formatCoordinates = (lat?: number, lng?: number): string => {
    if (!lat || !lng) return '';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to reverse geocode');
      }
      
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return formatCoordinates(lat, lng);
    }
  };

  const sortTravelTimes = (travelTimes: TravelTime[]) => {
    return [...travelTimes].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const handleSort = (key: keyof TravelTime) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredTravelTimes = travelTimes.filter(time => 
    directionFilter === 'all' ? true : time.direction === directionFilter
  );

  const sortedTravelTimes = sortTravelTimes(filteredTravelTimes);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportProgress(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/travel-times/import', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Join the array of errors with line breaks
          setImportError(errorData.errors.join('\n'));
        } else {
          setImportError(errorData.message || 'Failed to import travel times');
        }
        return;
      }

      // Only handle streaming if it's an event stream
      if (contentType?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              setImportProgress(data);
              
              if (data.progress === 100) {
                setSuccessMessage('Travel times imported successfully!');
                await loadTravelTimes(); // Refresh the travel times list
                setImportProgress(null);
              }
            }
          }
        }
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error importing travel times:', error);
      setImportError(error.message || 'Failed to import travel times');
      setImportProgress(null);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/travel-times/template');
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'travel-times-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-dog-gray mb-6">Navigation Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {saveError}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="homeAddress" className="block text-sm font-medium text-dog-gray mb-2">
                    Home Address
                  </label>
                  <AddressAutocomplete
                    id="homeAddress"
                    label="Home Address"
                    value={homeAddress}
                    onChange={handleHomeAddressChange}
                  />
                </div>

                <div>
                  <label htmlFor="workAddress" className="block text-sm font-medium text-dog-gray mb-2">
                    Work Address
                  </label>
                  <AddressAutocomplete
                    id="workAddress"
                    label="Work Address"
                    value={workAddress}
                    onChange={handleWorkAddressChange}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-dog-gray hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !homeLocation || !workLocation}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${isSaving || !homeLocation || !workLocation
                        ? 'bg-primary-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                      }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="h-[400px] rounded-lg overflow-hidden">
                <LocationMap
                  homeLocation={homeLocation}
                  workLocation={workLocation}
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-dog-gray mb-2">Home Address</h3>
                  <p className="text-secondary-600">{homeAddress}</p>
                  <p className="text-sm text-secondary-500 mt-1">{formatCoordinates(homeLocation?.lat, homeLocation?.lng)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-dog-gray mb-2">Work Address</h3>
                  <p className="text-secondary-600">{workAddress}</p>
                  <p className="text-sm text-secondary-500 mt-1">{formatCoordinates(workLocation?.lat, workLocation?.lng)}</p>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={toggleEditMode}
                    className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-dog-gray hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Edit Locations
                  </button>
                  <button
                    onClick={updateTravelTimes}
                    disabled={isUpdatingTravelTimes}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${isUpdatingTravelTimes
                        ? 'bg-primary-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                      }`}
                  >
                    {isUpdatingTravelTimes ? 'Updating...' : 'Update Travel Times'}
                  </button>
                </div>
              </div>

              <div className="h-[400px] rounded-lg overflow-hidden">
                <LocationMap
                  homeLocation={homeLocation}
                  workLocation={workLocation}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Travel Times Table */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-dog-gray">Travel Times History</h2>
          <div className="flex space-x-4">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-dog-gray hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Download Template
            </button>
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className={`px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-dog-gray hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isImporting ? 'Importing...' : 'Import Excel'}
              </button>
            </div>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="rounded-md border-secondary-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Directions</option>
              <option value="home_to_work">Home to Work</option>
              <option value="work_to_home">Work to Home</option>
            </select>
          </div>
        </div>

        {importError && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md whitespace-pre-line">
            {importError}
          </div>
        )}

        {importProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-secondary-600 mb-1">
              <span>Importing records...</span>
              <span>{importProgress.processedRecords} / {importProgress.totalRecords}</span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${importProgress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('direction')}
                >
                  Direction
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('duration')}
                >
                  Duration
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('distance')}
                >
                  Distance
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('calculatedAt')}
                >
                  Calculated At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {sortedTravelTimes.map((time) => (
                <tr key={time.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {time.direction === 'home_to_work' ? 'Home to Work' : 'Work to Home'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {formatDuration(time.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {formatDistance(time.distance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {formatDate(time.calculatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 