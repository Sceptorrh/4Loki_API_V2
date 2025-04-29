import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const AI_SETTINGS_PATH = path.join(process.cwd(), '..', 'configuration', 'aiSettings.json');

const readAISettings = async () => {
  try {
    const data = await fs.readFile(AI_SETTINGS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return default settings
    return { apiKey: null, lastUpdated: null };
  }
};

const writeAISettings = async (settings: { apiKey: string | null; lastUpdated: string | null }) => {
  await fs.writeFile(AI_SETTINGS_PATH, JSON.stringify(settings, null, 2));
};

export const getAISettings = async (req: Request, res: Response) => {
  try {
    const settings = await readAISettings();
    res.json({ apiKey: settings.apiKey });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    res.status(500).json({ error: 'Failed to fetch AI settings' });
  }
};

export const updateAISettings = async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const settings = {
      apiKey,
      lastUpdated: new Date().toISOString()
    };

    await writeAISettings(settings);
    res.json({ message: 'AI settings updated successfully' });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
}; 

