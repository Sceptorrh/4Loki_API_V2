import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface LocationMapProps {
  homeLocation?: google.maps.LatLngLiteral;
  workLocation?: google.maps.LatLngLiteral;
  homeAddress?: string;
  workAddress?: string;
  apiKey?: string;
}

// A simple wrapper component to isolate the Google Maps entirely from React's DOM reconciliation
const MapPortal: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a new div outside of React's control
    if (portalContainerRef.current) {
      const mapContainer = document.createElement('div');
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100%';
      mapContainer.style.position = 'absolute';
      mapContainer.style.inset = '0';
      portalContainerRef.current.appendChild(mapContainer);
      setMountNode(mapContainer);

      return () => {
        if (portalContainerRef.current?.contains(mapContainer)) {
          portalContainerRef.current.removeChild(mapContainer);
        }
      };
    }
  }, []);

  return (
    <div 
      ref={portalContainerRef}
      className="relative w-full h-full rounded-md overflow-hidden"
    >
      {mountNode && createPortal(children, mountNode)}
    </div>
  );
};

// This component contains the actual Google Maps implementation
const GoogleMapContent: React.FC<LocationMapProps> = ({
  homeLocation,
  workLocation,
  homeAddress,
  workAddress,
  apiKey
}) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const mountedRef = useRef(false);

  // Clean up all map resources
  const cleanupMap = useCallback(() => {
    try {
      // Remove event listeners
      if (listenersRef.current.length > 0) {
        listenersRef.current.forEach(listener => {
          if (listener) google.maps.event.removeListener(listener);
        });
        listenersRef.current = [];
      }

      // Remove markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (marker) marker.setMap(null);
        });
        markersRef.current = [];
      }

      // Remove directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }

      // Clear listeners on map instance
      if (mapInstanceRef.current) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    } catch (error) {
      console.error('Error during map cleanup:', error);
    }
  }, []);

  // Update map markers and directions
  const updateMapFeatures = useCallback(() => {
    if (!mapInstanceRef.current || !mountedRef.current) return;

    // Clear any existing markers and directions
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add home marker
    if (homeLocation) {
      const homeMarker = new google.maps.Marker({
        position: homeLocation,
        map: mapInstanceRef.current,
        title: homeAddress || 'Home',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        },
      });
      
      markersRef.current.push(homeMarker);
      bounds.extend(homeLocation);
      hasMarkers = true;
    }

    // Add work marker
    if (workLocation) {
      const workMarker = new google.maps.Marker({
        position: workLocation,
        map: mapInstanceRef.current,
        title: workAddress || 'Work',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      });
      
      markersRef.current.push(workMarker);
      bounds.extend(workLocation);
      hasMarkers = true;
    }

    // Add route between markers
    if (homeLocation && workLocation) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4a8b80',
          strokeWeight: 5,
          strokeOpacity: 0.7,
        },
      });
      
      directionsRendererRef.current = directionsRenderer;
      
      directionsService.route({
        origin: homeLocation,
        destination: workLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (!mountedRef.current) return;
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Error getting directions:', status);
        }
      });
    }

    // Fit map to bounds
    if (hasMarkers) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50, 
        bottom: 50,
        left: 50
      });
    }
  }, [homeLocation, workLocation, homeAddress, workAddress]);

  // Handle auth errors from Google Maps
  const handleAuthError = useCallback(() => {
    const authErrorListener = window.google?.maps.event.addListener(window, 'error', (e: Event) => {
      console.error('Google Maps Auth Error:', e);
      setMapError('Google Maps authentication error. Please check your API key restrictions.');
    });
    
    if (authErrorListener) {
      listenersRef.current.push(authErrorListener);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    console.log('Map content mounting');
    mountedRef.current = true;

    // Initialize map if container and Google API are available
    if (mapContainerRef.current && window.google?.maps) {
      try {
        // Check if an error is already shown in the console
        const errorConsoleElements = document.querySelectorAll('.gm-err-container, .gm-err-content');
        if (errorConsoleElements.length > 0) {
          // Try to extract the error message
          const errorText = Array.from(errorConsoleElements)
            .map(el => el.textContent?.trim())
            .join(' ')
            .replace(/\s+/g, ' ');
          
          if (errorText) {
            console.error('Google Maps Error from DOM:', errorText);
            // Check for specific error messages
            if (errorText.includes('not authorized') || errorText.includes('not activated')) {
              setMapError('API not activated for this project. The Places API or other required APIs are not enabled.');
            } else {
              setMapError(`Google Maps error: ${errorText}`);
            }
            return;
          }
        }

        // Clean up any existing map
        cleanupMap();

        // Add auth error listener
        handleAuthError();

        console.log('Creating new map');
        // Create map
        const netherlandsCenter = { lat: 52.1326, lng: 5.2913 };
        
        // Get map options with additional options for better error handling
        const mapOptions = {
          center: netherlandsCenter,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative', // Less aggressive gesture handling
          restriction: {
            latLngBounds: {
              north: 53.7253,
              south: 50.7534,
              east: 7.2275,
              west: 3.3632
            },
            strictBounds: false
          }
        };

        // Create the map
        const map = new google.maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Listen for auth errors
        const authErrorListener = google.maps.event.addListenerOnce(map, 'auth_error', () => {
          if (mountedRef.current) {
            console.error('Google Maps auth error occurred');
            setMapError('Google Maps could not be loaded due to authentication issues. Please check your API key.');
          }
        });
        listenersRef.current.push(authErrorListener);

        // Add idle listener to know when map is ready
        const idleListener = google.maps.event.addListenerOnce(map, 'idle', () => {
          if (mountedRef.current) {
            console.log('Map fully loaded and idle');
            setMapLoaded(true);
          }
        });
        listenersRef.current.push(idleListener);

        // Listen for other errors
        const errorListener = google.maps.event.addListener(map, 'error', (e: any) => {
          if (mountedRef.current) {
            console.error('Google Maps error occurred:', e);
            
            // Check for specific error codes
            if (e && e.code) {
              switch (e.code) {
                case 'ApiNotActivatedMapError':
                  setMapError('The Places API is not activated for this project. Please enable it in the Google Cloud Console.');
                  break;
                default:
                  setMapError(`An error occurred while loading Google Maps: ${e.message || 'Unknown error'}`);
              }
            } else {
              setMapError('An error occurred while loading Google Maps.');
            }
          }
        });
        listenersRef.current.push(errorListener);

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      setMapError('Google Maps API or map container not available');
    }

    // Cleanup function
    return () => {
      console.log('Map content unmounting');
      mountedRef.current = false;
      cleanupMap();
    };
  }, [cleanupMap, handleAuthError]);

  // Update map when locations change or map becomes ready
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && mountedRef.current) {
      updateMapFeatures();
    }
  }, [mapLoaded, updateMapFeatures]);

  // Show error if map failed to load
  if (mapError) {
    // Check for specific API not activated error
    const isApiNotActivatedError = mapError.includes('ApiNotActivatedMapError') || 
                                   mapError.includes('API not activated');

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4 overflow-auto">
        <p className="text-red-600 font-medium mb-2">Error Loading Map</p>
        <pre className="text-red-500 text-sm whitespace-pre-wrap text-center max-w-full overflow-auto p-2 bg-red-100 rounded">
          {mapError}
        </pre>
        <div className="mt-3 text-gray-600 text-sm">
          {isApiNotActivatedError ? (
            <>
              <p className="font-semibold">The Places API is not activated for this project.</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-left">
                <li>Go to the <a href="https://console.cloud.google.com/google/maps-apis/api-list" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Select your project</li>
                <li>Click "Enable APIs and Services"</li>
                <li>Search for "Places API" and enable it</li>
                <li>Also enable: Maps JavaScript API, Directions API, and Geocoding API</li>
                <li>Wait a few minutes for changes to take effect</li>
              </ol>
            </>
          ) : (
            <>
              <p>The Google Maps API key may have domain restrictions or may be invalid.</p>
              <p>Please check your API key configuration.</p>
            </>
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading indicator if map is not yet loaded
  return (
    <>
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0"
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </>
  );
};

// The main LocationMap component
const LocationMap: React.FC<LocationMapProps> = (props) => {
  // Generate a unique identifier for this instance - helps with reconciliation
  const [instanceId] = useState(() => `map-instance-${Date.now()}`);
  const [apiKeyState, setApiKeyState] = useState<string | null>(null);
  
  // Fetch the API key if it wasn't passed in props
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        if (!props.apiKey) {
          const response = await fetch('/api/navigation-settings/api-key');
          const data = await response.json();
          if (data.apiKey) {
            setApiKeyState(data.apiKey);
          }
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    };
    
    fetchApiKey();
  }, [props.apiKey]);
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Location Map</h3>
      
      <div className="w-full h-64 md:h-96 rounded-md border border-gray-300 overflow-hidden">
        <MapPortal>
          <GoogleMapContent
            key={instanceId}
            {...props}
            apiKey={props.apiKey || apiKeyState || undefined}
          />
        </MapPortal>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm">{props.homeAddress || 'Home (not set)'}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">{props.workAddress || 'Work (not set)'}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationMap; 