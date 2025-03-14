import request from 'supertest';
import { app } from '../src/server';

describe('Generic Endpoints', () => {

  // Health check endpoint
  describe('GET /api/v1/health', () => {
    it('GET /api/v1/health should return 200 OK', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });


  // OpenAPI/Swagger endpoints
  describe('API Documentation', () => {
    it('GET /api-docs/ should serve Swagger UI', async () => {
      const res = await request(app).get('/api-docs/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });

    it('GET /api-spec.json should serve OpenAPI spec', async () => {
      const res = await request(app).get('/api-spec.json');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
    });

    it('GET /api-docs/custom-swagger.js should serve custom Swagger JS', async () => {
      const res = await request(app).get('/api-docs/custom-swagger.js');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/javascript');
    });
  });
}); 



