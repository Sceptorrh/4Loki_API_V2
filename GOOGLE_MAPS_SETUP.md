# Google Maps API Setup Guide

If you're seeing errors related to the Google Maps API (REQUEST_DENIED, "API not authorized", etc.), follow these steps to properly set up your Google Maps API key:

## Step 1: Create or Access a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

## Step 2: Enable the Required APIs

For the navigation functionality to work properly, you need to enable the following APIs:

1. From your Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Routes API** - For calculating travel times and distances (replaces the legacy Distance Matrix API)
   - **Geocoding API** - For converting addresses to coordinates (and vice versa)
   - **Maps JavaScript API** - For displaying the map in the browser

## Step 3: Create API Key

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Google will generate a new API key for you

## Step 4: Restrict the API Key (Optional but Recommended)

For better security, restrict your API key:

1. Find your API key in the credentials list and click on it
2. Under "Application restrictions", choose "HTTP referrers" and add your domains
3. Under "API restrictions", restrict it to only the APIs you enabled

## Step 5: Update Your API Key in the Application

1. Open the `secrets.json` file in your project root
2. Update the `ROUTES_API_KEY` value with your new API key
3. Make sure the file is properly formatted (valid JSON with no duplicate entries)

Example `secrets.json`:
```json
{
  "ROUTES_API_KEY": "YOUR_API_KEY_HERE"
}
```

## Step 6: Billing Account (Required for Production Use)

For production use, you must set up a billing account:

1. Navigate to "Billing" in the Google Cloud Console
2. Set up a billing account and link it to your project

## Important Notes

- The Google Maps Platform has a free tier with a monthly credit of $200, which is sufficient for most small applications
- Monitor your API usage in the Google Cloud Console to avoid unexpected charges
- As of March 1, 2025, the Distance Matrix API will be deprecated in favor of the Routes API
- The error "This API project is not authorized to use this API" typically means:
  - The API is not enabled for the project
  - The billing hasn't been set up (if you've exceeded the free tier)
  - There are API restrictions preventing the usage

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Routes API Documentation](https://developers.google.com/maps/documentation/routes)
- [Usage and Billing Information](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [API Key Best Practices](https://developers.google.com/maps/documentation/javascript/get-api-key) 