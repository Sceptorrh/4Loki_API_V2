import { Router, Request, Response } from 'express';
import { calculateRoute, reverseGeocode, forwardGeocode, Coordinates } from '../services/google';
import { GoogleAuthService } from '../services/google/auth';
import { authenticateToken } from '../middleware/auth';
import axios from 'axios';
import { listDriveFiles } from '../services/google/drive';
import { loadSecrets, googleConfig } from '../services/google/config';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

const router = Router();
const googleAuth = GoogleAuthService.getInstance();

// Auth callback route - no authentication required
router.post('/auth/callback', async (req, res) => {
  try {
    console.log('Auth callback received:', {
      body: req.body,
      headers: req.headers,
      cookies: req.cookies
    });

    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      console.error('Missing required parameters:', { code, redirectUri });
      return res.status(400).json({ message: 'Code and redirect URI are required' });
    }

    // Exchange code for access token
    console.log('Attempting to exchange code for token...');
    const tokenResponse = await googleAuth.getAccessToken(code, redirectUri, res);
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokenResponse.access_token,
      hasRefreshToken: !!tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in
    });

    // Get user information using the access token directly
    console.log('Attempting to get user info...');
    const userInfoResponse = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    });
    const userInfo = userInfoResponse.data;
    console.log('User info retrieved successfully:', {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name
    });

    res.json({ 
      access_token: tokenResponse.access_token,
      userInfo 
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ message: 'Authentication failed' });
  }
});

// Forward geocode route - no authentication required (uses API key only)
router.post('/maps/forward-geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    const coordinates = await forwardGeocode(address);
    
    if (!coordinates) {
      return res.status(404).json({ message: 'Could not geocode this address' });
    }
    
    res.json({ coordinates });
  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({ message: 'Server error geocoding address' });
  }
});

// Places Autocomplete route - no authentication required (uses API key only)
router.get('/maps/places/autocomplete', async (req: Request, res: Response) => {
  try {
    const { input } = req.query;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ message: 'Input query is required' });
    }

    console.log('Making Places API request with:', {
      input,
      apiKey: googleConfig.apiKey ? 'present' : 'missing',
      url: googleConfig.maps.placesAutocomplete
    });

    const response = await axios.post(googleConfig.maps.placesAutocomplete, {
      textQuery: input,
      languageCode: 'en'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleConfig.apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.id'
      }
    });

    console.log('Places API response:', {
      status: response.status,
      hasPlaces: !!response.data.places,
      errorMessage: response.data.error?.message
    });

    if (response.data.places) {
      // Transform the response to match the expected format
      const predictions = response.data.places.map((place: any) => ({
        description: place.formattedAddress,
        place_id: place.id,
        structured_formatting: {
          main_text: place.displayName.text,
          secondary_text: place.formattedAddress
        }
      }));
      res.json({ predictions });
    } else {
      res.status(404).json({ 
        message: 'No predictions found',
        error: response.data.error?.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error getting place autocomplete:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    res.status(500).json({ 
      message: 'Server error getting place suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Place Details route - no authentication required (uses API key only)
router.get('/maps/places/details', async (req: Request, res: Response) => {
  try {
    const { place_id } = req.query;

    if (!place_id || typeof place_id !== 'string') {
      return res.status(400).json({ message: 'Place ID is required' });
    }

    const response = await axios.get(`${googleConfig.maps.placesDetails}/${place_id}`, {
      headers: {
        'X-Goog-Api-Key': googleConfig.apiKey,
        'X-Goog-FieldMask': 'id,formattedAddress,location'
      }
    });

    if (response.data) {
      // Transform the response to match the expected format
      const result = {
        formatted_address: response.data.formattedAddress,
        geometry: {
          location: {
            lat: response.data.location.latitude,
            lng: response.data.location.longitude
          }
        }
      };
      res.json({ result });
    } else {
      res.status(404).json({ message: 'Place not found' });
    }
  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({ message: 'Server error getting place details' });
  }
});

// Apply authentication middleware to all other routes
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Google
 *   description: Google API integration endpoints
 */

/**
 * @swagger
 * /google/maps/route:
 *   post:
 *     summary: Calculate route between two points using Google Maps
 *     tags: [Google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 51.8331303
 *                   lng:
 *                     type: number
 *                     example: 4.6925461
 *               destination:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 51.8184583
 *                   lng:
 *                     type: number
 *                     example: 4.5589537
 *               includeDepartureTime:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *             required:
 *               - origin
 *               - destination
 *           examples:
 *             example1:
 *               summary: Route from Oude-Tonge to Zuidland
 *               value:
 *                 origin:
 *                   lat: 51.8331303
 *                   lng: 4.6925461
 *                 destination:
 *                   lat: 51.8184583
 *                   lng: 4.5589537
 *     responses:
 *       200:
 *         description: Route calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distance:
 *                   type: number
 *                   description: Distance in meters
 *                   example: 15682
 *                 distanceKm:
 *                   type: number
 *                   description: Distance in kilometers (with 1 decimal)
 *                   example: 15.7
 *                 duration:
 *                   type: number
 *                   description: Duration in seconds
 *                   example: 1042
 *                 durationMinutes:
 *                   type: number
 *                   description: Duration in minutes (rounded)
 *                   example: 17
 *                 durationInTraffic:
 *                   type: number
 *                   description: Duration with traffic in seconds
 *                   example: 1158
 *                 originAddress:
 *                   type: string
 *                   example: "51.8331303,4.6925461"
 *                 destinationAddress:
 *                   type: string
 *                   example: "51.8184583,4.5589537"
 *             examples:
 *               routeExample:
 *                 summary: Example route calculation result
 *                 value:
 *                   distance: 15682
 *                   distanceKm: 15.7
 *                   duration: 1042
 *                   durationMinutes: 17
 *                   originAddress: "51.8331303,4.6925461"
 *                   destinationAddress: "51.8184583,4.5589537"
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/maps/route', async (req: Request, res: Response) => {
  try {
    const { origin, destination, includeDepartureTime = true } = req.body;
    
    // Validate input
    if (!origin || !destination || 
        !origin.lat || !origin.lng ||
        !destination.lat || !destination.lng) {
      return res.status(400).json({ message: 'Origin and destination coordinates are required' });
    }

    // Calculate route
    const routeData = await calculateRoute(
      origin as Coordinates,
      destination as Coordinates,
      includeDepartureTime
    );
    
    if (!routeData) {
      return res.status(500).json({ message: 'Failed to calculate route' });
    }
    
    // Format the response with additional fields for convenience
    const response = {
      ...routeData,
      // Calculate duration in minutes
      durationMinutes: Math.round(routeData.duration / 60)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error calculating route:', error);
    res.status(500).json({ message: 'Server error calculating route' });
  }
});

/**
 * @swagger
 * /google/maps/geocode:
 *   post:
 *     summary: Reverse geocode coordinates to get address
 *     tags: [Google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 51.8331303
 *                   lng:
 *                     type: number
 *                     example: 4.6925461
 *             required:
 *               - coordinates
 *           examples:
 *             example1:
 *               summary: Geocode Oude-Tonge coordinates
 *               value:
 *                 coordinates:
 *                   lat: 51.8331303
 *                   lng: 4.6925461
 *     responses:
 *       200:
 *         description: Address geocoded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   example: "Beatrixstraat, Oude-Tonge, Goeree-Overflakkee, Zuid-Holland, Nederland, 3255 AR, Nederland"
 *             examples:
 *               geocodeExample:
 *                 summary: Example geocoding result
 *                 value:
 *                   address: "Beatrixstraat, Oude-Tonge, Goeree-Overflakkee, Zuid-Holland, Nederland, 3255 AR, Nederland"
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: API authorization error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Google API Error: This API project is not authorized to use this API."
 *       404:
 *         description: Could not geocode these coordinates
 *       500:
 *         description: Server error
 */
router.post('/maps/geocode', async (req: Request, res: Response) => {
  try {
    const { coordinates } = req.body;
    
    // Validate input
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return res.status(400).json({ message: 'Valid coordinates are required' });
    }

    // Geocode coordinates - updated to use separate lat/lng parameters
    const address = await reverseGeocode(coordinates.lat, coordinates.lng);
    
    // Get the last error message from the geocoding service
    if (!address) {
      // Check for API authorization errors based on logs
      const error = globalThis.lastGeocodingError || 'Could not geocode these coordinates';
      
      if (error.includes('not authorized') || error.includes('REQUEST_DENIED')) {
        return res.status(403).json({ 
          message: `Google API Error: ${error}`
        });
      }
      
      return res.status(404).json({ 
        message: error
      });
    }
    
    res.json({ address });
  } catch (error) {
    console.error('Error geocoding coordinates:', error);
    res.status(500).json({ message: 'Server error geocoding coordinates' });
  }
});

/**
 * @swagger
 * /google/auth/login:
 *   get:
 *     summary: Get Google OAuth login URL
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: redirectUri
 *         required: true
 *         schema:
 *           type: string
 *         description: The redirect URI after successful login
 *     responses:
 *       200:
 *         description: Login URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loginUrl:
 *                   type: string
 */
router.get('/auth/login', (req, res) => {
  try {
    const { redirectUri } = req.query;
    
    if (!redirectUri || typeof redirectUri !== 'string') {
      return res.status(400).json({ message: 'Redirect URI is required' });
    }

    const loginUrl = googleAuth.getLoginUrl(redirectUri);
    res.json({ loginUrl });
  } catch (error) {
    console.error('Error generating login URL:', error);
    res.status(500).json({ message: 'Failed to generate login URL' });
  }
});

/**
 * @swagger
 * /google/auth/logout:
 *   post:
 *     summary: Logout from Google
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/auth/logout', (req, res) => {
  try {
    googleAuth.clearTokenData(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
});

/**
 * @swagger
 * /google/auth/token:
 *   get:
 *     summary: Get the current Google OAuth access token
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: Access token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
router.get('/auth/token', async (req, res) => {
  try {
    const token = await googleAuth.getValidAccessToken(req);
    const tokenData = googleAuth.getTokenData();
    
    res.json({ 
      token,
      tokenStatus: {
        hasAccessToken: !!token,
        hasRefreshToken: !!tokenData?.refresh_token,
        expiresAt: tokenData?.expires_at
      }
    });
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(401).json({ 
      message: 'Failed to get access token',
      tokenStatus: {
        hasAccessToken: false,
        hasRefreshToken: false,
        expiresAt: null
      }
    });
  }
});

/**
 * @swagger
 * /google/contacts:
 *   get:
 *     summary: Get Google contacts
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resourceName:
 *                         type: string
 *                       names:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             displayName:
 *                               type: string
 *                       emailAddresses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                       phoneNumbers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *       401:
 *         description: Not authenticated
 */
router.get('/contacts', async (req, res) => {
  try {
    const accessToken = await googleAuth.getValidAccessToken(req);
    
    // Fetch contacts from Google People API
    const response = await axios.get(
      'https://people.googleapis.com/v1/people/me/connections',
      {
        params: {
          personFields: 'names,emailAddresses,phoneNumbers',
          pageSize: 100
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json({
      contacts: response.data.connections || []
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      res.status(401).json({ error: 'Not authenticated' });
    } else {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }
});

// Google Drive backup routes
router.get('/drive-files', async (req, res) => {
  try {
    const accessToken = await googleAuth.getValidAccessToken(req);
    const files = await listDriveFiles(accessToken);
    res.json({ files });
  } catch (error) {
    console.error('Error listing drive files:', error);
    res.status(500).json({ message: 'Failed to list Google Drive files' });
  }
});

export default router; 