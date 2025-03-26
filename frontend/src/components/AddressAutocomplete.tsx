import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/AddressAutocomplete.module.css';

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, placeData?: { lat: number; lng: number; display_name: string }) => void;
  required?: boolean;
}

interface GooglePlaceResult {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

// Shared timestamp of the last API request across all instances
let lastApiRequestTime = 0;

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueueRef = useRef<string | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search for places via the Google Places Autocomplete API with rate limiting
  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Set loading state immediately to give user feedback
    setLoading(true);
    setError(null);

    // Store the query in case we need to process it later
    searchQueueRef.current = query;

    // Calculate time until next allowed request (1000ms = 1 second)
    const now = Date.now();
    const timeUntilNextRequest = Math.max(0, lastApiRequestTime + 1000 - now);

    // Clear any existing timeout
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }

    // If we need to wait, set a timeout
    if (timeUntilNextRequest > 0) {
      requestTimeoutRef.current = setTimeout(() => {
        // Only proceed if this is still the latest query
        if (searchQueueRef.current === query) {
          executeSearch(query);
        }
      }, timeUntilNextRequest);
    } else {
      // We can make the request immediately
      executeSearch(query);
    }
  };

  // Execute the actual search request
  const executeSearch = async (query: string) => {
    // Update the last request time
    lastApiRequestTime = Date.now();
    
    // Clear the queue since we're processing this query now
    searchQueueRef.current = null;

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Use Google Places Autocomplete API
      const response = await fetch(`/api/v1/google/maps/places/autocomplete?input=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error fetching address suggestions: ${response.statusText}`);
      }
      
      if (data.predictions) {
        setSuggestions(data.predictions);
        setError(null); // Clear any previous errors
      } else {
        setSuggestions([]);
        setError('No results found. Please try a different search.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error fetching address suggestions:', err);
        setError(`Error: ${err.message}`);
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a longer debounce timeout to reduce API calls (800ms)
    debounceTimeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 800);
  };

  // Handle selection of a suggestion
  const handleSuggestionClick = async (suggestion: GooglePlaceResult) => {
    try {
      // Get place details to get coordinates
      const response = await fetch(`/api/v1/google/maps/places/details?place_id=${suggestion.place_id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get place details');
      }

      if (data.result) {
        const place = data.result;
        const placeData = {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          display_name: place.formatted_address
        };
        
        onChange(place.formatted_address, placeData);
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error getting place details:', err);
      setError('Failed to get place details');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="mb-4 relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={styles.autocompleteContainer}>
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setFocused(false), 200);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={`Enter ${label.toLowerCase()}`}
          required={required}
          autoComplete="off"
        />
        {loading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinAnimation}></div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {focused && suggestions.length > 0 && (
        <div className={styles.suggestionsContainer}>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.structured_formatting ? (
                <>
                  <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                  <div className="text-sm text-gray-600">{suggestion.structured_formatting.secondary_text}</div>
                </>
              ) : (
                <div>{suggestion.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete; 