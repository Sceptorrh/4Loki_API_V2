import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  homeLocation?: { lat: number; lng: number };
  workLocation?: { lat: number; lng: number };
  homeAddress?: string;
  workAddress?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  homeLocation,
  workLocation,
  homeAddress,
  workAddress,
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
          .bindPopup(homeAddress || 'Home')
          .addTo(map);
        
        markers.current.push(marker);
        bounds.extend([homeLocation.lat, homeLocation.lng]);
        hasMarkers = true;
      }

      // Add work marker
      if (workLocation) {
        const marker = L.marker([workLocation.lat, workLocation.lng], { icon: workIcon })
          .bindPopup(workAddress || 'Work')
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
        .bindPopup(homeAddress || 'Home')
        .addTo(map);
      
      markers.current.push(marker);
      bounds.extend([homeLocation.lat, homeLocation.lng]);
      hasMarkers = true;
    }

    // Add work marker
    if (workLocation) {
      const marker = L.marker([workLocation.lat, workLocation.lng], { icon: workIcon })
        .bindPopup(workAddress || 'Work')
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

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Location Map</h3>
      
      <div className="w-full h-64 md:h-96 rounded-md border border-gray-300 overflow-hidden">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm">{homeAddress || 'Home (not set)'}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">{workAddress || 'Work (not set)'}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationMap; 