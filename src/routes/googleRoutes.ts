import { Router, Request, Response } from 'express';
import { calculateRoute, reverseGeocode, forwardGeocode, Coordinates } from '../services/google';
import { GoogleAuthService } from '../services/google/auth';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { listDriveFiles } from '../services/google/drive';
import { loadSecrets, googleConfig } from '../services/google/config';
import { SessionService } from '../services/session/sessionService';
import { logger } from '../utils/logger';
import pool from '../config/database';
import { UserService } from '../services/user/userService';

const router = Router();
const googleAuth = GoogleAuthService.getInstance();

// Auth callback route - no authentication required
router.post('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri, state } = req.body;
    if (!code || !redirectUri || !state) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Verify state parameter
    const isValidState = await googleAuth.verifyOAuthState(state);
    if (!isValidState) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }

    // Exchange code for tokens
    const accessToken = await googleAuth.getAccessToken(code, redirectUri);
    if (!accessToken) {
      return res.status(400).json({ message: 'Failed to get access token' });
    }

    // Get user info
    const userInfo = await googleAuth.getUserInfo(accessToken);
    if (!userInfo) {
      return res.status(400).json({ message: 'Failed to get user info' });
    }

    // Verify user is authorized
    const googleConfig = loadSecrets();
    if (userInfo.email !== googleConfig.AUTHORIZED_USER_EMAIL) {
      return res.status(403).json({ message: 'Unauthorized user' });
    }

    // Create or update user
    const user = await UserService.createOrUpdateUser({
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    });

    // Create session with tokens
    const sessionId = await SessionService.createSession(
      user.id,
      accessToken,
      googleAuth.getTokenData()?.refreshToken || '',
      googleAuth.getTokenData()?.expiresIn || 3600
    );

    // Redirect to frontend with session ID
    res.json({
      sessionId,
      userInfo: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    logger.error('Error in Google OAuth callback:', error);
    res.status(500).json({ message: 'Failed to complete authentication' });
  }
});

// Auth callback route for GET requests (from OAuth redirect)
router.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, redirectUri } = req.query;

    if (!code || !state || !redirectUri || typeof code !== 'string' || typeof state !== 'string' || typeof redirectUri !== 'string') {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify state parameter
    const isValidState = await googleAuth.verifyOAuthState(state);
    if (!isValidState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Get access token
    const accessToken = await googleAuth.getAccessToken(code, redirectUri);
    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // Get user info
    const userInfo = await googleAuth.getUserInfo(accessToken);
    if (!userInfo) {
      return res.status(400).json({ error: 'Failed to get user info' });
    }

    // Get token data
    const tokenData = googleAuth.getTokenData();
    if (!tokenData) {
      return res.status(400).json({ error: 'Failed to get token data' });
    }

    // Create session with tokens
    const sessionId = await SessionService.createSession(
      userInfo.id,
      accessToken,
      tokenData.refreshToken,
      tokenData.expiresIn
    );

    // Redirect to frontend with session ID
    res.redirect(`http://localhost:3001/auth-success?sessionId=${sessionId}`);
  } catch (error) {
    logger.error('Error in Google OAuth callback:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// Get user info endpoint - no authentication required
router.get('/auth/user', async (req: Request, res: Response) => {
  try {
    logger.info('GET /auth/user - Request received');
    
    // Check both header and cookies for session ID
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    
    if (!sessionId || typeof sessionId !== 'string') {
      logger.error('GET /auth/user - No session ID provided in headers or cookies');
      return res.status(401).json({ message: 'Session ID is required' });
    }

    logger.info(`GET /auth/user - Session ID: ${sessionId}`);

    // Validate session using SessionService
    const sessionService = SessionService.getInstance();
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      logger.error(`GET /auth/user - Invalid session: ${sessionId}`);
      return res.status(401).json({ message: 'Invalid session' });
    }

    logger.info(`GET /auth/user - Session found for user: ${session.userId}`);

    // Get user info from session
    const [rows] = await pool.query(
      'SELECT u.* FROM Users u WHERE u.id = ?',
      [session.userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      logger.error(`GET /auth/user - User not found for ID: ${session.userId}`);
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0] as { id: string; email: string; name: string; picture: string };
    logger.info(`GET /auth/user - User found: ${user.email}`);
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    });
  } catch (error) {
    logger.error('GET /auth/user - Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Apply authentication middleware to all other routes
router.use(authenticateToken);

// All routes below this line will require authentication
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
 * tags:
 *   name: Google
 *   description: Google API integration endpoints
 */

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
router.get('/auth/login', async (req: Request, res: Response) => {
  try {
    const loginUrl = await googleAuth.generateLoginUrl();
    res.json({ url: loginUrl });
  } catch (error) {
    logger.error('Error generating login URL:', error);
    res.status(500).json({ error: 'Failed to generate login URL' });
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
router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const loginUrl = await googleAuth.generateLoginUrl();
    res.json({ url: loginUrl });
  } catch (error) {
    logger.error('Error generating login URL:', error);
    res.status(500).json({ error: 'Failed to generate login URL' });
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
router.get('/auth/token', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const token = await googleAuth.getToken(sessionId);
    res.json({ hasToken: !!token });
  } catch (error) {
    logger.error('Error checking token:', error);
    res.status(500).json({ message: 'Failed to check token status' });
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
router.get('/contacts', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const accessToken = await googleAuth.getToken(sessionId);
    if (!accessToken) {
      return res.status(401).json({ message: 'No valid token available' });
    }

    // Get search query from request
    const query = req.query.q as string;

    // Fetch contacts from Google People API
    const response = await axios.get(
      'https://people.googleapis.com/v1/people:searchContacts',
      {
        params: {
          query: query,
          readMask: 'names,emailAddresses,phoneNumbers',
          pageSize: 100
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json({
      contacts: response.data.results || []
    });
  } catch (error) {
    logger.error('Error getting contacts:', error);
    res.status(500).json({ message: 'Failed to get contacts' });
  }
});

// Google Drive backup routes
router.get('/drive-files', async (req: AuthRequest, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const accessToken = await googleAuth.getToken(sessionId);
    
    if (!accessToken) {
      return res.status(401).json({ message: 'No valid token available' });
    }
    
    const files = await listDriveFiles(accessToken);
    res.json({ files });
  } catch (error) {
    console.error('Error listing drive files:', error);
    res.status(500).json({ message: 'Failed to list drive files' });
  }
});

// Get tokens endpoint
router.get('/drive/tokens', async (req: AuthRequest, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const token = await googleAuth.getToken(sessionId);
    res.json({ hasToken: !!token });
  } catch (error) {
    console.error('Error checking tokens:', error);
    res.status(500).json({ message: 'Failed to check token status' });
  }
});

// Get calendar events endpoint
router.get('/calendar/events', async (req: AuthRequest, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const token = await googleAuth.getToken(sessionId);
    
    if (!token) {
      return res.status(401).json({ message: 'No valid token available' });
    }
    
    // Add actual calendar implementation here
    res.json({ message: 'Calendar events endpoint' });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ message: 'Failed to get calendar events' });
  }
});

// Upload to Drive endpoint
router.post('/drive/upload', async (req: AuthRequest, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const token = await googleAuth.getToken(sessionId);
    
    if (!token) {
      return res.status(401).json({ message: 'No valid token available' });
    }
    
    // Add actual upload implementation here
    res.json({ message: 'File upload endpoint' });
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    res.status(500).json({ message: 'Failed to upload to Drive' });
  }
});

// Login URL generation endpoint
router.get('/auth/login-url', async (req, res) => {
  try {
    logger.info('Login URL requested');
    const loginUrl = await googleAuth.generateLoginUrl();
    logger.info(`Generated login URL: ${loginUrl}`);
    res.json({ loginUrl });
  } catch (error) {
    logger.error('Error generating login URL:', error);
    res.status(500).json({ message: 'Failed to generate login URL' });
  }
});

// Store OAuth state endpoint
router.post('/auth/store-state', async (req, res) => {
  try {
    const { state, expires } = req.body;

    if (!state || !expires) {
      return res.status(400).json({ message: 'State and expiration time are required' });
    }

    // Store the state in the database
    await pool.query(
      'INSERT INTO OAuthState (state, expires) VALUES (?, ?)',
      [state, new Date(expires)]
    );

    res.json({ message: 'State stored successfully' });
  } catch (error) {
    console.error('Error storing OAuth state:', error);
    res.status(500).json({ message: 'Failed to store OAuth state' });
  }
});

// Get drive files endpoint
router.get('/drive/files', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const accessToken = await googleAuth.getToken(sessionId);
    if (!accessToken) {
      return res.status(401).json({ message: 'No valid token available' });
    }

    const files = await listDriveFiles(accessToken);
    res.json({ files });
  } catch (error) {
    logger.error('Error getting drive files:', error);
    res.status(500).json({ message: 'Failed to get drive files' });
  }
});

export default router; 