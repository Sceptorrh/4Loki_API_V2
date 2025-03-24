import axios from 'axios';
import { googleConfig } from './config';

// Types for coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Response interfaces for Google Routes API
export interface RoutesApiResponse {
  routes: {
    distanceMeters: number;
    duration: string;
    polyline: {
      encodedPolyline: string;
    };
    legs: Array<{
      distanceMeters: number;
      duration: string;
      startLocation: {
        latLng: {
          latitude: number;
          longitude: number;
        };
      };
      endLocation: {
        latLng: {
          latitude: number;
          longitude: number;
        };
      };
    }>;
    travelAdvisory?: {
      tollInfo?: {
        estimatedPrice?: Array<{
          value: string;
          currencyCode: string;
        }>;
      };
    };
  }[];
}

// Processed route data
export interface RouteData {
  distance: number;        // in meters
  duration: number;        // in seconds
  durationInTraffic?: number; // in seconds
  originAddress: string;
  destinationAddress: string;
  distanceKm?: number;     // in kilometers with 1 decimal
}

// Convert ISO 8601 duration string to seconds (e.g. "PT1H30M" -> 5400 seconds)
// Also handles simple seconds format like "2552s"
function isoDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  
  console.log('Parsing duration string:', duration);
  
  try {
    // Check for simple seconds format (e.g., "2552s")
    const simpleSecondsMatch = /^(\d+)s$/i.exec(duration);
    if (simpleSecondsMatch) {
      const seconds = parseInt(simpleSecondsMatch[1], 10);
      console.log('Parsed simple seconds format:', seconds);
      return seconds;
    }
    
    // For full ISO 8601 duration (e.g., "P1DT2H30M45S")
    // P indicates period, T separates date and time parts
    const regex = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
    const matches = duration.match(regex);
    
    if (!matches) {
      console.error('Invalid duration format:', duration);
      return 0;
    }
    
    const days = parseInt(matches[1] || '0', 10);
    const hours = parseInt(matches[2] || '0', 10);
    const minutes = parseInt(matches[3] || '0', 10);
    const seconds = parseInt(matches[4] || '0', 10);
    
    const totalSeconds = (days * 24 * 60 * 60) + 
                         (hours * 60 * 60) + 
                         (minutes * 60) + 
                         seconds;
    
    console.log('Parsed duration components:', { days, hours, minutes, seconds });
    console.log('Total seconds:', totalSeconds);
    
    return totalSeconds;
  } catch (error) {
    console.error('Error parsing duration:', error);
    return 0;
  }
}

// Format distance from meters to kilometers with one decimal
function formatDistanceToKm(meters: number): number {
  if (!meters) return 0;
  return Math.round(meters / 100) / 10; // Convert to km with 1 decimal
}

/**
 * Calculate route between two points using Google Routes API (v2)
 * 
 * @param origin Origin coordinates (latitude, longitude)
 * @param destination Destination coordinates (latitude, longitude)
 * @param includeDepartureTime Whether to include real-time traffic data
 * @returns Promise with route data (distance, duration)
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,
  includeDepartureTime: boolean = true
): Promise<RouteData | null> {
  try {
    // Prepare the request body according to Routes API specifications
    const requestBody: any = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng
          }
        }
      },
      travelMode: googleConfig.defaultParams.routes.travelMode,
      routingPreference: googleConfig.defaultParams.routes.routingPreference,
      polylineQuality: googleConfig.defaultParams.routes.polylineQuality,
      languageCode: googleConfig.defaultParams.routes.languageCode,
      units: googleConfig.defaultParams.routes.units
    };

    // Add departure time for real-time traffic data if requested
    if (includeDepartureTime) {
      // Set departure time to 5 minutes in the future to ensure it's valid
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);
      requestBody.departureTime = futureDate.toISOString();
    }

    // Define the fields we want to receive in the response
    const fieldMask = 'routes.duration,routes.distanceMeters,routes.legs';

    // Make the API request
    const response = await axios.post<RoutesApiResponse>(
      googleConfig.maps.routesUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleConfig.apiKey,
          'X-Goog-FieldMask': fieldMask
        }
      }
    );

    // Check if we have valid routes
    if (!response.data.routes || response.data.routes.length === 0) {
      console.error('No routes found in the response');
      return null;
    }

    const route = response.data.routes[0];
    
    // Extract origin and destination addresses from the legs
    let originAddress = "";
    let destinationAddress = "";
    
    if (route.legs && route.legs.length > 0) {
      const leg = route.legs[0];
      originAddress = `${leg.startLocation.latLng.latitude},${leg.startLocation.latLng.longitude}`;
      destinationAddress = `${leg.endLocation.latLng.latitude},${leg.endLocation.latLng.longitude}`;
    }

    // Convert duration from ISO 8601 string to seconds
    const durationInSeconds = isoDurationToSeconds(route.duration);

    // Extract route data
    const routeData: RouteData = {
      distance: route.distanceMeters,       // in meters
      duration: durationInSeconds,          // in seconds
      originAddress,
      destinationAddress
    };

    // Add formatted values for the GoogleRoutes endpoint response
    return {
      ...routeData,
      distanceKm: formatDistanceToKm(route.distanceMeters) // Add formatted distance in km
    };
  } catch (error) {
    console.error('Error calculating route with Google Routes API:', error);
    
    // Provide more detailed error information
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 403) {
        throw new Error('The Google Maps API key is not authorized to use the Routes API. Please enable it in the Google Cloud Console.');
      } else if (error.response.status === 400) {
        // Extract specific error information
        const errorData = error.response.data?.error;
        if (errorData) {
          throw new Error(`Google Routes API error: ${errorData.message} (${errorData.status})`);
        }
      }
    }
    
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address
 * 
 * @param lat Latitude to geocode
 * @param lng Longitude to geocode
 * @returns Promise with formatted address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await axios.get(googleConfig.maps.geocodingUrl, {
      params: {
        latlng: `${lat},${lng}`,
        key: googleConfig.apiKey
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding with Google Maps:', error);
    return null;
  }
} 