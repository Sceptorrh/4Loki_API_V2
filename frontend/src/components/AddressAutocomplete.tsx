import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, placeData?: google.maps.places.PlaceResult) => void;
  required?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        // Get API key from the server
        const response = await fetch('/api/navigation-settings/api-key');
        if (!response.ok) throw new Error('Failed to fetch API key');
        
        const data = await response.json();
        if (!data.apiKey) {
          setError('No API key available. Please configure a Google Maps API key in your settings.');
          return;
        }

        // Get the Google Maps instance from the shared loader
        await loadGoogleMaps(data.apiKey);
        setLoaded(true);
        
        if (!inputRef.current || !window.google) return;
        
        const options = {
          componentRestrictions: { country: 'nl' },
          fields: ['address_components', 'geometry', 'name', 'formatted_address'],
        };
        
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, options);
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.formatted_address) {
            onChange(place.formatted_address, place);
          }
        });
      } catch (err) {
        console.error('Google Maps loader error:', err);
        setError(`Error loading Google Maps: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    initializeAutocomplete();
  }, []);

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={`Enter ${label.toLowerCase()}`}
        required={required}
        disabled={!loaded && !error}
      />
      {!loaded && !error && (
        <p className="mt-1 text-sm text-gray-500">Loading address autocomplete...</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AddressAutocomplete; 