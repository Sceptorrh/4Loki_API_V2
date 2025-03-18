import { Loader } from '@googlemaps/js-api-loader';

let loader: Loader | null = null;
let loadPromise: Promise<typeof google> | null = null;
let currentApiKey: string | null = null;

const createLoader = (apiKey: string): Loader => {
  try {
    return new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
      language: 'nl'
    });
  } catch (error) {
    console.error('Error creating Google Maps loader:', error);
    throw new Error(`Failed to create Google Maps loader: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getGoogleMapsLoader = (apiKey: string): Loader => {
  if (!apiKey) {
    throw new Error('API key is required to load Google Maps');
  }

  // Reset loader if API key changes
  if (currentApiKey !== apiKey) {
    loader = null;
    loadPromise = null;
    currentApiKey = apiKey;
  }

  if (!loader) {
    try {
      loader = createLoader(apiKey);
    } catch (error) {
      console.error('Error in getGoogleMapsLoader:', error);
      throw error;
    }
  }

  return loader;
};

export const loadGoogleMaps = async (apiKey: string): Promise<typeof google> => {
  if (!apiKey) {
    throw new Error('API key is required to load Google Maps');
  }

  try {
    // Reset loader if API key changes
    if (currentApiKey !== apiKey) {
      loader = null;
      loadPromise = null;
      currentApiKey = apiKey;
    }

    if (!loadPromise) {
      const mapsLoader = getGoogleMapsLoader(apiKey);
      loadPromise = mapsLoader.load().catch(error => {
        console.error('Error loading Google Maps:', error);
        loadPromise = null; // Reset promise on error
        throw error;
      });
    }

    return await loadPromise;
  } catch (error) {
    console.error('Error in loadGoogleMaps:', error);
    throw new Error(`Failed to load Google Maps: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 