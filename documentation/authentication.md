# Authentication Flow Documentation

## Overview

The 4Loki API implements a single-user authentication system using Google OAuth 2.0 for the initial authentication, with sessions for subsequent requests. This document outlines the authentication flow, technologies used, and the overall structure of the authentication system.

## Technologies Used

- **Google OAuth 2.0**: For user authentication via Google accounts
- **Session-based Authentication**: For managing authentication state after OAuth login
- **JWT (jsonwebtoken)**: For token validation in certain backend operations
- **PostgreSQL**: For persisting authentication tokens and sessions
- **Express.js middleware**: For global authentication protection

## Configuration

Authentication configuration is managed through a combination of environment variables and a configuration file:

- Google OAuth credentials are stored in `configuration/google.json` including:
  - `OAUTH_CLIENT_ID`: Google OAuth client ID
  - `OAUTH_CLIENT_SECRET`: Google OAuth client secret
  - `ROUTES_API_KEY`: Google Maps API key for non-authenticated routes

- Environment variables for authentication security:
  - `JWT_SECRET`: Secret key for JWT token validation
  - `AUTHORIZED_GOOGLE_USER_ID`: The Google user ID of the single authorized user

## Authentication Flow

### 1. Login Process

1. The client initiates authentication by requesting a Google OAuth URL from the `/api/v1/google/auth/login` endpoint
2. The backend generates a login URL with the appropriate scopes and a secure state parameter for CSRF protection
3. The user is redirected to Google's authentication page
4. After successful authentication with Google, Google redirects back to the specified redirect URI with an authorization code and state

### 2. Token Exchange & Session Creation

1. The client sends the authorization code, redirect URI, and state to the `/api/v1/google/auth/callback` endpoint
2. The backend verifies the state parameter to prevent CSRF attacks
3. The backend exchanges the code for access and refresh tokens using Google's OAuth API
4. The backend:
   - Stores the tokens in memory (in the GoogleAuthService singleton)
   - Persists the tokens in the database (in the GoogleAuth table)
   - Creates a new session with a unique session ID
   - Verifies the user is the authorized single user
5. The backend returns only the session ID and basic user info to the client

### 3. Authenticated Requests

1. The client includes the session ID in the `x-session-id` header for subsequent requests
2. The global authentication middleware:
   - Checks if the path is in the whitelist of public paths
   - Verifies the session ID for non-public paths
   - For specific routes (backup/Google), passes the token directly
   - For standard routes, performs further validation
3. For authorized requests, the middleware attaches user information to the request object

### 4. Token Refresh

The system autonomously manages token refresh:

1. A scheduled process runs every 10 minutes to check token expiration
2. Tokens approaching expiration (within 15 minutes) are automatically refreshed
3. The refresh process updates:
   - In-memory cache
   - Database storage
4. The client never needs to handle token refresh

### 5. Logout

When a user logs out:

1. The client sends a request to `/api/v1/google/auth/logout` with the session ID
2. The backend deletes the session from the database
3. The client removes the session ID from its storage

## Database Schema

The authentication system uses three key tables:

### GoogleAuth Table

```sql
CREATE TABLE IF NOT EXISTS `GoogleAuth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

### Sessions Table

```sql
CREATE TABLE IF NOT EXISTS `Sessions` (
  `id` varchar(32) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `token` text NOT NULL,
  `expires` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_expires_index` (`expires`)
);
```

### OAuthState Table

```sql
CREATE TABLE IF NOT EXISTS `OAuthState` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state` varchar(32) NOT NULL,
  `expires` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_state_state_unique` (`state`),
  KEY `oauth_state_expires_index` (`expires`)
);
```

## Code Structure

The authentication system is organized across multiple files:

### Google Auth Service (`src/services/google/auth.ts`)

A singleton service that:
- Manages OAuth flow
- Handles token exchange and refresh
- Stores tokens in memory and database
- Implements CSRF protection
- Contains the token refresh scheduler

### Session Service (`src/services/session/sessionService.ts`)

A singleton service that:
- Creates and manages user sessions
- Validates session IDs
- Maps sessions to tokens
- Handles session expiration

### Auth Middleware (`src/middleware/auth.ts`)

Middleware applied globally that:
- Exempts public paths from authentication
- Validates session IDs
- Handles special routes with different authentication requirements
- Verifies the authorized user ID

### Google Routes (`src/routes/googleRoutes.ts`)

Defines the API endpoints for:
- OAuth login and callback handling
- Session-based authentication
- User information retrieval
- Logout functionality

## Security Features

- **CSRF Protection**: State parameter validation in the OAuth flow
- **Single User Authorization**: Validation against the `AUTHORIZED_GOOGLE_USER_ID`
- **Server-side Tokens**: Tokens never exposed to the client
- **Global Authentication**: All routes protected by default except explicitly whitelisted ones
- **Session Expiration**: Sessions automatically expire after 24 hours
- **Automatic Token Refresh**: Tokens refreshed before expiration

## API Endpoints

Authentication-related API endpoints:

- **GET** `/api/v1/google/auth/login`: Generate Google OAuth login URL
- **POST** `/api/v1/google/auth/callback`: Process Google OAuth callback and create session
- **POST** `/api/v1/google/auth/logout`: End the user's session
- **GET** `/api/v1/google/auth/token`: Check if authentication token is valid 