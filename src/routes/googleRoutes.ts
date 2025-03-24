import { Router } from 'express';
import { Request, Response } from 'express';
import { calculateRoute, reverseGeocode, forwardGeocode, Coordinates } from '../services/google';
import { GoogleAuthService } from '../services/google/auth';
import axios from 'axios';

const router = Router();
const googleAuth = GoogleAuthService.getInstance();

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
 * /google/maps/forward-geocode:
 *   post:
 *     summary: Convert address to coordinates using Google Maps
 *     tags: [Google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 example: "Beatrixstraat, Oude-Tonge, Netherlands"
 *             required:
 *               - address
 *           examples:
 *             example1:
 *               summary: Geocode Oude-Tonge address
 *               value:
 *                 address: "Beatrixstraat, Oude-Tonge, Netherlands"
 *     responses:
 *       200:
 *         description: Address geocoded to coordinates successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coordinates:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                       example: 51.8331303
 *                     lng:
 *                       type: number
 *                       example: 4.6925461
 *             examples:
 *               coordinatesExample:
 *                 summary: Example coordinates result
 *                 value:
 *                   coordinates:
 *                     lat: 51.8331303
 *                     lng: 4.6925461
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
 *         description: Could not geocode this address
 *       500:
 *         description: Server error
 */
router.post('/maps/forward-geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    
    // Validate input
    if (!address || typeof address !== 'string' || address.trim() === '') {
      return res.status(400).json({ message: 'A valid address string is required' });
    }

    // Forward geocode address to coordinates
    const coordinates = await forwardGeocode(address.trim());
    
    // Get the last error message from the geocoding service
    if (!coordinates) {
      // Check for API authorization errors based on logs
      const error = globalThis.lastForwardGeocodingError || 'Could not geocode this address';
      
      if (error.includes('not authorized') || error.includes('REQUEST_DENIED')) {
        return res.status(403).json({ 
          message: `Google API Error: ${error}`
        });
      }
      
      return res.status(404).json({ 
        message: error
      });
    }
    
    res.json({ coordinates });
  } catch (error) {
    console.error('Error forward geocoding address:', error);
    res.status(500).json({ message: 'Server error geocoding address' });
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
 * /google/auth/callback:
 *   post:
 *     summary: Handle Google OAuth callback
 *     tags: [Google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: The authorization code from Google
 *               redirectUri:
 *                 type: string
 *                 description: The redirect URI used in the login request
 *             required:
 *               - code
 *               - redirectUri
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 userInfo:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     picture:
 *                       type: string
 */
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ message: 'Code and redirect URI are required' });
    }

    // Exchange code for access token
    const tokenResponse = await googleAuth.getAccessToken(code, redirectUri);

    // Get user information
    const userInfo = await googleAuth.getUserInfo();

    res.json({ 
      access_token: tokenResponse.access_token,
      userInfo 
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).json({ message: 'Authentication failed' });
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
    googleAuth.clearTokenData();
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
    const token = await googleAuth.getValidAccessToken();
    res.json({ access_token: token });
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(401).json({ error: 'Not authenticated' });
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
    const accessToken = await googleAuth.getValidAccessToken();
    
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

export default router; 