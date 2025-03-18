# Setting Up Your Google API Key Securely

This document explains how to set up your Google API key for the travel time tracking and address autocomplete features.

## Required APIs

Your Google API key needs the following APIs enabled:

1. **Routes API** - For calculating travel times and routes (this is the next generation version of the Directions API)
2. **Maps JavaScript API** - For displaying the map and includes directions rendering functionality
3. **Places API** - For address autocomplete

Note: The Directions API is not needed as a separate API since the Routes API provides this functionality as its next generation version, and the Maps JavaScript API includes the directions service for rendering routes on maps.

## Option 1: Using secrets.json (Recommended)

This is the recommended approach as it keeps your API key out of the database and source control.

1. Create a file named `secrets.json` in the root directory of the project
2. Add your Google API key to this file using the following format:

```json
{
  "ROUTES_API_KEY": "your-google-api-key-here"
}
```

3. Make sure `secrets.json` is in your `.gitignore` file to prevent accidentally committing it to version control
4. The server will automatically detect and use this API key

## Option 2: Environment Variable

You can also set the API key as an environment variable:

1. Add the following to your `.env` file:

```
ROUTES_API_KEY=your-google-api-key-here
```

2. Make sure your `.env` file is in your `.gitignore`
3. The server will use this value if `secrets.json` is not found

## Option 3: Web Interface

If you prefer, you can enter the API key in the web interface:

1. Navigate to the Navigation Settings page
2. Enter your API key in the "Google API Key" field
3. Save your settings

Note: This is the least secure option as the key will be stored in the database. The server will only use this key if no key is found in `secrets.json` or environment variables.

## Obtaining a Google API Key

1. **Create a Google Cloud Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the Required APIs:**
   - In your Google Cloud project, go to "APIs & Services" > "Library"
   - Search for and enable each of these APIs:
     - Routes API
     - Maps JavaScript API
     - Places API
   - Note: You do not need to separately enable the Directions API as its functionality is included in the Routes API and Maps JavaScript API

3. **Create API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create credentials" > "API key"
   - Copy the generated API key

4. **Secure Your API Key (Recommended):**
   - Click on the newly created API key in the credentials list
   - Under "Application restrictions", consider restricting to your application domain
   - Under "API restrictions", restrict the key to only the APIs listed above

5. **Set Up Billing (Required):**
   - Google Maps Platform APIs require billing to be enabled
   - Go to "Billing" in the Google Cloud Console
   - Link a billing account to your project
   - New accounts often get free credits to start 