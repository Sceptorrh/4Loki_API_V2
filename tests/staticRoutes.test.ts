import request from 'supertest';
import { app } from '../src/server';
import { 
  appointmentStatusIds, 
  customColorIds, 
  dogSizeIds, 
  hourTypeIds, 
  importExportTypeIds, 
  serviceIds,
  dogBreedIds
} from '../src/static/data';

// Set a longer timeout for all tests
jest.setTimeout(1000);

describe('Static Routes API Endpoints', () => {
  // Appointment Statuses
  describe('Appointment Statuses', () => {
    it('GET /api/v1/static/appointment-statuses should return all appointment statuses', async () => {
      const res = await request(app).get('/api/v1/static/appointment-statuses');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(appointmentStatusIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('label');
      expect(firstItem).toHaveProperty('order');
      expect(firstItem).toHaveProperty('color');
    });

    it('GET /api/v1/static/appointment-statuses/:id should return a specific appointment status for all valid IDs', async () => {
      // Test all valid IDs from static data
      for (const validId of appointmentStatusIds) {
        const res = await request(app).get(`/api/v1/static/appointment-statuses/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', validId);
        expect(res.body).toHaveProperty('label');
        expect(res.body).toHaveProperty('order');
        expect(res.body).toHaveProperty('color');
      }
    });

    it('GET /api/v1/static/appointment-statuses/:id should return 404 for invalid ID', async () => {
      // Use a non-existent ID
      const nonExistentId = 'NonExistentStatus';
      expect(appointmentStatusIds).not.toContain(nonExistentId);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/appointment-statuses/${nonExistentId}`)
        .expect(404);
    });
  });

  // Custom Colors
  describe('Custom Colors', () => {
    it('GET /api/v1/static/custom-colors should return all custom colors', async () => {
      const res = await request(app).get('/api/v1/static/custom-colors');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(customColorIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('color');
      expect(firstItem).toHaveProperty('order');
      expect(firstItem).toHaveProperty('hex');
      expect(firstItem).toHaveProperty('legend');
    });

    it('GET /api/v1/static/custom-colors/:color should return a specific custom color for all valid colors', async () => {
      // Test all valid colors from static data
      for (const validColor of customColorIds) {
        const res = await request(app).get(`/api/v1/static/custom-colors/${validColor}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('color', validColor);
        expect(res.body).toHaveProperty('order');
        expect(res.body).toHaveProperty('hex');
        expect(res.body).toHaveProperty('legend');
      }
    });

    it('GET /api/v1/static/custom-colors/:color should return 404 for invalid color', async () => {
      // Use a non-existent color
      const nonExistentColor = 'NonExistentColor';
      expect(customColorIds).not.toContain(nonExistentColor);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/custom-colors/${nonExistentColor}`)
        .expect(404);
    });
  });

  // Dog Sizes
  describe('Dog Sizes', () => {
    it('GET /api/v1/static/dog-sizes should return all dog sizes', async () => {
      const res = await request(app).get('/api/v1/static/dog-sizes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(dogSizeIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('label');
      expect(firstItem).toHaveProperty('order');
    });

    it('GET /api/v1/static/dog-sizes/:id should return a specific dog size for all valid IDs', async () => {
      // Test all valid IDs from static data
      for (const validId of dogSizeIds) {
        const res = await request(app).get(`/api/v1/static/dog-sizes/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', validId);
        expect(res.body).toHaveProperty('label');
        expect(res.body).toHaveProperty('order');
      }
    });

    it('GET /api/v1/static/dog-sizes/:id should return 404 for invalid ID', async () => {
      // Use a non-existent ID
      const nonExistentId = 'XL';
      expect(dogSizeIds).not.toContain(nonExistentId);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/dog-sizes/${nonExistentId}`)
        .expect(404);
    });
  });

  // Hour Types
  describe('Hour Types', () => {
    it('GET /api/v1/static/hour-types should return all hour types', async () => {
      const res = await request(app).get('/api/v1/static/hour-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(hourTypeIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('label');
      expect(firstItem).toHaveProperty('default_text');
      expect(firstItem).toHaveProperty('is_export');
    });

    it('GET /api/v1/static/hour-types/:id should return a specific hour type for all valid IDs', async () => {
      // Test all valid IDs from static data
      for (const validId of hourTypeIds) {
        const res = await request(app).get(`/api/v1/static/hour-types/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', validId);
        expect(res.body).toHaveProperty('label');
        expect(res.body).toHaveProperty('default_text');
        expect(res.body).toHaveProperty('is_export');
      }
    });

    it('GET /api/v1/static/hour-types/:id should return 404 for invalid ID', async () => {
      // Use a non-existent ID
      const nonExistentId = 'NonExistentHourType';
      expect(hourTypeIds).not.toContain(nonExistentId);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/hour-types/${nonExistentId}`)
        .expect(404);
    });
  });

  // Import/Export Types
  describe('Import/Export Types', () => {
    it('GET /api/v1/static/import-export-types should return all import/export types', async () => {
      const res = await request(app).get('/api/v1/static/import-export-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(importExportTypeIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('label');
    });

    it('GET /api/v1/static/import-export-types/:id should return a specific import/export type for all valid IDs', async () => {
      // Test all valid IDs from static data
      for (const validId of importExportTypeIds) {
        const res = await request(app).get(`/api/v1/static/import-export-types/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', validId);
        expect(res.body).toHaveProperty('label');
      }
    });

    it('GET /api/v1/static/import-export-types/:id should return 404 for invalid ID', async () => {
      // Use a non-existent ID
      const nonExistentId = 'NonExistentType';
      expect(importExportTypeIds).not.toContain(nonExistentId);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/import-export-types/${nonExistentId}`)
        .expect(404);
    });
  });

  // Dog Breeds
  describe('Dog Breeds', () => {
    it('GET /api/v1/static/dog-breeds should return all dog breeds', async () => {
      const res = await request(app).get('/api/v1/static/dog-breeds');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(dogBreedIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('Id');
      expect(firstItem).toHaveProperty('Name');
    });

    it('GET /api/v1/static/dog-breeds/:id should return a specific dog breed for all valid IDs', async () => {
      // Test all valid IDs from static data
      for (const validId of dogBreedIds) {
        const res = await request(app).get(`/api/v1/static/dog-breeds/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('Id', validId);
        expect(res.body).toHaveProperty('Name');
      }
    });

    it('GET /api/v1/static/dog-breeds/:id should return 404 for invalid ID', async () => {
      // Use a non-existent ID
      const nonExistentId = 'nonexistent_breed';
      expect(dogBreedIds).not.toContain(nonExistentId);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/dog-breeds/${nonExistentId}`)
        .expect(404);
    });
  });

  // Services
  describe('Services', () => {
    it('GET /api/v1/static/services should return all services', async () => {
      const res = await request(app).get('/api/v1/static/services');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Verify the number of records matches the expected count
      expect(res.body.length).toBe(serviceIds.length);
      
      // Check structure of returned data
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('Id');
      expect(firstItem).toHaveProperty('Name');
      expect(firstItem).toHaveProperty('StandardPrice');
      expect(firstItem).toHaveProperty('IsPriceAllowed');
      expect(firstItem).toHaveProperty('StandardDuration');
    });

    it('GET /api/v1/static/services/:id should return a specific service for all valid IDs', async () => {
      // Test all valid IDs from static data
      for (const validId of serviceIds) {
        const res = await request(app).get(`/api/v1/static/services/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('Id', validId);
        expect(res.body).toHaveProperty('Name');
        expect(res.body).toHaveProperty('StandardPrice');
        expect(res.body).toHaveProperty('IsPriceAllowed');
        expect(res.body).toHaveProperty('StandardDuration');
      }
    });

    it('GET /api/v1/static/services/:id should return 404 for invalid ID', async () => {
      // Use a non-existent ID
      const nonExistentId = 'nonexistent_service';
      expect(serviceIds).not.toContain(nonExistentId);
      
      // Use supertest's .expect() method to check for 404 status
      await request(app)
        .get(`/api/v1/static/services/${nonExistentId}`)
        .expect(404);
    });
  });

  // Test that verifies all static data counts match between data.ts and database
  describe('Comprehensive Static Data Verification', () => {
    it('should verify all static data counts match between data.ts and database', async () => {
      // Define the mapping between data arrays and API endpoints
      const dataMapping = [
        { data: appointmentStatusIds, endpoint: '/api/v1/static/appointment-statuses', idField: 'id' },
        { data: customColorIds, endpoint: '/api/v1/static/custom-colors', idField: 'color' },
        { data: dogSizeIds, endpoint: '/api/v1/static/dog-sizes', idField: 'id' },
        { data: hourTypeIds, endpoint: '/api/v1/static/hour-types', idField: 'id' },
        { data: importExportTypeIds, endpoint: '/api/v1/static/import-export-types', idField: 'id' },
        { data: serviceIds, endpoint: '/api/v1/static/services', idField: 'Id' },
        { data: dogBreedIds, endpoint: '/api/v1/static/dog-breeds', idField: 'Id' }
      ];

      // Loop through each mapping and verify
      for (const mapping of dataMapping) {
        const res = await request(app).get(mapping.endpoint);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // Verify count matches
        expect(res.body.length).toBe(mapping.data.length);
        
        // Verify each ID exists in the database
        for (const id of mapping.data) {
          const idExists = res.body.some((item: any) => item[mapping.idField] === id);
          expect(idExists).toBe(true);
        }
      }
    });
  });
}); 