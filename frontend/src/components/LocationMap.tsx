import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  homeLocation?: { lat: number; lng: number };
  workLocation?: { lat: number; lng: number };
  homeAddress?: string;
  workAddress?: string;
  onEdit?: () => void;
}

const LocationMap: React.FC<LocationMapProps> = ({
  homeLocation,
  workLocation,
  homeAddress,
  workAddress,
  onEdit,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const polyline = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix Leaflet's default icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    // Create custom marker icons
    const homeIcon = new L.Icon({
      iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const workIcon = new L.Icon({
      iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Create the map
    const map = L.map(mapContainerRef.current).setView([52.1326, 5.2913], 7);
    mapInstance.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Set up markers and route when locations change
    const updateMarkers = () => {
      // Clear previous markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      // Clear previous polylines
      if (polyline.current) {
        polyline.current.remove();
        polyline.current = null;
      }

      const bounds = new L.LatLngBounds([]);
      let hasMarkers = false;

      // Add home marker
      if (homeLocation) {
        const marker = L.marker([homeLocation.lat, homeLocation.lng], { icon: homeIcon })
          .bindPopup(getDisplayText(homeLocation, homeAddress, 'Home'))
          .addTo(map);
        
        markers.current.push(marker);
        bounds.extend([homeLocation.lat, homeLocation.lng]);
        hasMarkers = true;
      }

      // Add work marker
      if (workLocation) {
        const marker = L.marker([workLocation.lat, workLocation.lng], { icon: workIcon })
          .bindPopup(getDisplayText(workLocation, workAddress, 'Work'))
          .addTo(map);
        
        markers.current.push(marker);
        bounds.extend([workLocation.lat, workLocation.lng]);
        hasMarkers = true;
      }

      // Add polyline between markers
      if (homeLocation && workLocation) {
        polyline.current = L.polyline(
          [[homeLocation.lat, homeLocation.lng], [workLocation.lat, workLocation.lng]],
          { color: '#4a8b80', weight: 5, opacity: 0.7 }
        ).addTo(map);
      }

      // Fit bounds if markers exist
      if (hasMarkers) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    // Initial update
    updateMarkers();
    setMapReady(true);

    // Update when locations change
    const observer = new MutationObserver(() => {
      if (homeLocation || workLocation) {
        updateMarkers();
      }
    });

    // Cleanup function
    return () => {
      observer.disconnect();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Effect to update markers when locations change
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    // Clear previous markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Clear previous polylines
    if (polyline.current) {
      polyline.current.remove();
      polyline.current = null;
    }

    const map = mapInstance.current;
    const bounds = new L.LatLngBounds([]);
    let hasMarkers = false;

    // Create custom marker icons
    const homeIcon = new L.Icon({
      iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const workIcon = new L.Icon({
      iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Add home marker
    if (homeLocation) {
      const marker = L.marker([homeLocation.lat, homeLocation.lng], { icon: homeIcon })
        .bindPopup(getDisplayText(homeLocation, homeAddress, 'Home'))
        .addTo(map);
      
      markers.current.push(marker);
      bounds.extend([homeLocation.lat, homeLocation.lng]);
      hasMarkers = true;
    }

    // Add work marker
    if (workLocation) {
      const marker = L.marker([workLocation.lat, workLocation.lng], { icon: workIcon })
        .bindPopup(getDisplayText(workLocation, workAddress, 'Work'))
        .addTo(map);
      
      markers.current.push(marker);
      bounds.extend([workLocation.lat, workLocation.lng]);
      hasMarkers = true;
    }

    // Add polyline between markers
    if (homeLocation && workLocation) {
      polyline.current = L.polyline(
        [[homeLocation.lat, homeLocation.lng], [workLocation.lat, workLocation.lng]],
        { color: '#4a8b80', weight: 5, opacity: 0.7 }
      ).addTo(map);
    }

    // Fit bounds if markers exist
    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [homeLocation, workLocation, homeAddress, workAddress, mapReady]);

  // Format coordinates for display
  const formatCoordinates = (lat?: number, lng?: number): string => {
    if (!lat || !lng) return 'Not set';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Helper to determine what to display (address or coordinates)
  const getDisplayText = (location?: {lat: number, lng: number}, address?: string, label: string = ''): string => {
    if (!location) return `${label} (not set)`;
    if (address) return address;
    return `${label}: ${formatCoordinates(location.lat, location.lng)}`;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Location Map</h3>
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
          </svg>
          {(!homeLocation || !workLocation) ? 'Set Locations' : 'Edit Locations'}
        </button>
      </div>
      
      <div className="w-full h-64 md:h-96 rounded-md border border-gray-300 overflow-hidden">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm">{getDisplayText(homeLocation, homeAddress, 'Home')}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">{getDisplayText(workLocation, workAddress, 'Work')}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationMap; 