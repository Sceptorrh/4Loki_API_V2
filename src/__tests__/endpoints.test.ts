import request from 'supertest';
import { app } from '../server';

describe('API Endpoints', () => {
  // Health check endpoint
  describe('GET /api/v1/health', () => {
    it('GET /api/v1/health should return 200 OK', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  // Dropdown endpoints
  describe('Dropdown Endpoints', () => {
    it('GET /api/v1/dropdowns/dogbreeds should return dog breeds', async () => {
      const res = await request(app).get('/api/v1/dropdowns/dogbreeds');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/dropdowns/customers should return customers with dogs', async () => {
      const res = await request(app).get('/api/v1/dropdowns/customers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/dropdowns/paymenttypes should return payment types', async () => {
      const res = await request(app).get('/api/v1/dropdowns/paymenttypes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/dropdowns/btwpercentages should return BTW percentages', async () => {
      const res = await request(app).get('/api/v1/dropdowns/btwpercentages');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/dropdowns/hourtypes should return hour types', async () => {
      const res = await request(app).get('/api/v1/dropdowns/hourtypes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Customer endpoints
  describe('Customer Endpoints', () => {
    it('GET /api/v1/customers/table should return customer table data', async () => {
      const res = await request(app).get('/api/v1/customers/table');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/customers/table?search=test should handle customer search', async () => {
      const res = await request(app).get('/api/v1/customers/table?search=test');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Dog endpoints
  describe('Dog Endpoints', () => {
    it('GET /api/v1/dogs/table should return dog table data', async () => {
      const res = await request(app).get('/api/v1/dogs/table');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/dogs/table?search=test should handle dog search', async () => {
      const res = await request(app).get('/api/v1/dogs/table?search=test');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
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

    it('GET /custom-swagger.js should serve custom Swagger JS', async () => {
      const res = await request(app).get('/custom-swagger.js');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/javascript');
    });
  });

  // Static Table endpoints
  describe('Static Table Endpoints', () => {
    it('GET /api/v1/static/appointment-statuses should return appointment statuses', async () => {
      const res = await request(app).get('/api/v1/static/appointment-statuses');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/appointment-types should return appointment types', async () => {
      const res = await request(app).get('/api/v1/static/appointment-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/btw-percentages should return BTW percentages', async () => {
      const res = await request(app).get('/api/v1/static/btw-percentages');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/custom-colors should return custom colors', async () => {
      const res = await request(app).get('/api/v1/static/custom-colors');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/dog-sizes should return dog sizes', async () => {
      const res = await request(app).get('/api/v1/static/dog-sizes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/hour-types should return hour types', async () => {
      const res = await request(app).get('/api/v1/static/hour-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/import-export-types should return import/export types', async () => {
      const res = await request(app).get('/api/v1/static/import-export-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/invoice-categories should return invoice categories', async () => {
      const res = await request(app).get('/api/v1/static/invoice-categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/payment-types should return payment types', async () => {
      const res = await request(app).get('/api/v1/static/payment-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/v1/static/travel-time-types should return travel time types', async () => {
      const res = await request(app).get('/api/v1/static/travel-time-types');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    describe('Insert Static Data', () => {
      it('POST /api/v1/static/custom-colors should insert custom colors first', async () => {
        // First delete appointment statuses due to foreign key constraint
        const deleteStatusRes = await request(app).delete('/api/v1/static/appointment-statuses');
        expect(deleteStatusRes.status).toBe(200);

        // Then delete custom colors
        const deleteColorsRes = await request(app).delete('/api/v1/static/custom-colors');
        expect(deleteColorsRes.status).toBe(200);
        
        const colors = [
          { color: 'Cancelled', order: 4, hex: '#a80808', legend: 'Geannuleerd' },
          { color: 'Exported', order: 3, hex: '#74ed86', legend: 'Geexporteerd' },
          { color: 'Invoiced', order: 2, hex: '#4973de', legend: 'Gefactureerd' },
          { color: 'NotExported', order: 6, hex: '#b5cc8d', legend: 'Niet geexporteerd' },
          { color: 'OtherHours', order: 5, hex: '#57c2bb', legend: 'Andere uren' },
          { color: 'Planned', order: 1, hex: '#a9abb0', legend: 'Geplanned' }
        ];
        
        console.log('Sending custom colors:', JSON.stringify(colors, null, 2));
        
        const res = await request(app)
          .post('/api/v1/static/custom-colors')
          .set('Content-Type', 'application/json')
          .send(colors);
          
        console.log('Custom colors response:', res.status, res.body);
        
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Custom colors inserted successfully');

        // Verify the colors were inserted
        const checkRes = await request(app).get('/api/v1/static/custom-colors');
        console.log('Inserted colors:', checkRes.body);
        expect(checkRes.status).toBe(200);
        expect(Array.isArray(checkRes.body)).toBe(true);
        expect(checkRes.body.length).toBe(6);

        // Verify each color was inserted correctly
        for (const expectedColor of colors) {
          const foundColor = checkRes.body.find((c: { color: string }) => c.color === expectedColor.color);
          expect(foundColor).toBeDefined();
          expect(foundColor.order).toBe(expectedColor.order);
          expect(foundColor.hex).toBe(expectedColor.hex);
          expect(foundColor.legend).toBe(expectedColor.legend);
        }
      });

      it('POST /api/v1/static/appointment-statuses should then insert appointment statuses', async () => {
        // Clear existing appointment statuses first
        const deleteRes = await request(app).delete('/api/v1/static/appointment-statuses');
        expect(deleteRes.status).toBe(200);
        
        // Verify custom colors exist before proceeding
        const colorsRes = await request(app).get('/api/v1/static/custom-colors');
        expect(colorsRes.status).toBe(200);
        expect(Array.isArray(colorsRes.body)).toBe(true);
        expect(colorsRes.body.length).toBe(6);
        
        const statuses = [
          { id: 'Can', label: 'Geannuleerd', order: 3, is_active: 1, color: 'Cancelled' },
          { id: 'Exp', label: 'Geexporteerd', order: 7, is_active: 1, color: 'Exported' },
          { id: 'Inv', label: 'Gefactureerd', order: 5, is_active: 1, color: 'Invoiced' },
          { id: 'NotExp', label: 'NotExported', order: 8, is_active: 1, color: 'NotExported' },
          { id: 'Pln', label: 'Gepland', order: 2, is_active: 1, color: 'Planned' }
        ];
        
        console.log('Sending appointment statuses:', JSON.stringify(statuses, null, 2));
        
        const res = await request(app)
          .post('/api/v1/static/appointment-statuses')
          .set('Content-Type', 'application/json')
          .send(statuses);
          
        console.log('Response:', res.status, res.body);
        
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Appointment statuses inserted successfully');

        // Verify the data was inserted correctly
        const checkRes = await request(app).get('/api/v1/static/appointment-statuses');
        console.log('Inserted data:', checkRes.body);
        expect(checkRes.status).toBe(200);
        expect(Array.isArray(checkRes.body)).toBe(true);
        expect(checkRes.body.length).toBe(5);

        // Verify each status was inserted correctly
        for (const expectedStatus of statuses) {
          const foundStatus = checkRes.body.find((s: { id: string }) => s.id === expectedStatus.id);
          expect(foundStatus).toBeDefined();
          expect(foundStatus.label).toBe(expectedStatus.label);
          expect(foundStatus.order).toBe(expectedStatus.order);
          expect(foundStatus.is_active).toBe(expectedStatus.is_active);
          expect(foundStatus.color).toBe(expectedStatus.color);
        }
      });

      it('POST /api/v1/static/appointment-types should insert appointment types', async () => {
        const types = [
          { id: 1, label: 'DogWalking', order: 2, is_active: true, label_dutch: 'Uitlaatservice' },
          { id: 2, label: 'Absent', order: 3, is_active: true, label_dutch: 'Afwezigheid' },
          { id: 3, label: 'Grooming', order: 1, is_active: true, label_dutch: 'Trimmen' }
        ];
        const res = await request(app).post('/api/v1/static/appointment-types').send(types);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Appointment types inserted successfully');
      });

      it('POST /api/v1/static/btw-percentages should insert BTW percentages', async () => {
        const percentages = [
          { id: 1, label: '21%', amount: 21 },
          { id: 2, label: '0%', amount: 0 }
        ];
        const res = await request(app).post('/api/v1/static/btw-percentages').send(percentages);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('BTW percentages inserted successfully');
      });

      it('POST /api/v1/static/dog-sizes should insert dog sizes', async () => {
        const sizes = [
          { id: 'L', label: 'Large', order: 3, is_active: true },
          { id: 'M', label: 'Middle', order: 2, is_active: true },
          { id: 'S', label: 'Small', order: 1, is_active: true },
          { id: 'X', label: 'ExtraLarge', order: 4, is_active: true }
        ];
        const res = await request(app).post('/api/v1/static/dog-sizes').send(sizes);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Dog sizes inserted successfully');
      });

      it('POST /api/v1/static/hour-types should insert hour types', async () => {
        const types = [
          { id: 'Adm', label: 'Administratie', order: 1, is_active: true, default_text: 'Administratie', is_export: true },
          { id: 'App', label: 'Afspraak', order: 10, is_active: true, default_text: null, is_export: false },
          { id: 'Cur', label: 'Cursus', order: 3, is_active: true, default_text: 'Cursus gevolgd', is_export: true },
          { id: 'Fac', label: 'Factuur', order: 5, is_active: true, default_text: null, is_export: true },
          { id: 'Ink', label: 'Inkopen', order: 2, is_active: true, default_text: 'Inkopen gedaan', is_export: true },
          { id: 'Reis', label: 'Reistijd', order: 6, is_active: true, default_text: 'Reistijd', is_export: true },
          { id: 'sch', label: 'Schoonmaken', order: 4, is_active: true, default_text: 'Trimsalon schoongemaakt', is_export: true },
          { id: 'Stage', label: 'Stage trimsalon', order: 7, is_active: true, default_text: 'Stage trimsalon', is_export: true },
          { id: 'Vak', label: 'Vakantie', order: 8, is_active: true, default_text: 'Vakantie', is_export: false },
          { id: 'Zk', label: 'Ziek', order: 9, is_active: true, default_text: 'Ziek', is_export: false }
        ];
        const res = await request(app).post('/api/v1/static/hour-types').send(types);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Hour types inserted successfully');
      });

      it('POST /api/v1/static/import-export-types should insert import/export types', async () => {
        const types = [
          { id: 'Hour', label: 'Hour' },
          { id: 'Invoice', label: 'Invoice' },
          { id: 'Purchase', label: 'Purchase' },
          { id: 'Relation', label: 'Relation' }
        ];
        const res = await request(app).post('/api/v1/static/import-export-types').send(types);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Import/export types inserted successfully');
      });

      it('POST /api/v1/static/invoice-categories should insert invoice categories', async () => {
        const categories = [
          { id: 1, label: 'Paarden', order: 3, is_active: true, knab: 'Omzet Paarden' },
          { id: 2, label: 'Trimsalon', order: 1, is_active: true, knab: 'Omzet Trimsalon' },
          { id: 3, label: 'Chuck & Charlie', order: 2, is_active: true, knab: 'Omzet Chuck&Charlie' }
        ];
        const res = await request(app).post('/api/v1/static/invoice-categories').send(categories);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Invoice categories inserted successfully');
      });

      it('POST /api/v1/static/payment-types should insert payment types', async () => {
        const types = [
          { id: 'BT', label: 'Bank', order: 3, is_active: true, label_dutch: null },
          { id: 'Csh', label: 'Cash', order: 2, is_active: true, label_dutch: null }
        ];
        const res = await request(app).post('/api/v1/static/payment-types').send(types);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Payment types inserted successfully');
      });

      it('POST /api/v1/static/travel-time-types should insert travel time types', async () => {
        const types = [
          { id: 1, label: 'HomeWork', order: 1, is_active: true },
          { id: 2, label: 'WorkHome', order: 2, is_active: true }
        ];
        const res = await request(app).post('/api/v1/static/travel-time-types').send(types);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Travel time types inserted successfully');
      });

      test('POST /api/v1/dog-breeds - Insert dog breeds', async () => {
        console.log('Attempting to delete existing dog breeds...');
        const deleteResponse = await request(app)
          .delete('/api/v1/dog-breeds')
          .expect(200);
        console.log('Delete response:', deleteResponse.status, deleteResponse.body);

        const breeds = [
          { Name: 'Labrador Retriever', OwnerId: 1 },
          { Name: 'German Shepherd', OwnerId: 1 },
          { Name: 'Golden Retriever', OwnerId: 1 },
          { Name: 'French Bulldog', OwnerId: 1 },
          { Name: 'Poodle', OwnerId: 1 }
        ];

        // Insert each breed individually
        for (const breed of breeds) {
          console.log('Attempting to insert dog breed:', breed);
          const response = await request(app)
            .post('/api/v1/dog-breeds')
            .send(breed)
            .expect(201);
          console.log('Insert response:', response.status, response.body);
        }

        console.log('Verifying inserted breeds...');
        const verifyResponse = await request(app)
          .get('/api/v1/dropdowns/dogbreeds')
          .expect(200);
        console.log('Verify response:', verifyResponse.status, verifyResponse.body);
        expect(verifyResponse.body).toBeInstanceOf(Array);
        expect(verifyResponse.body.length).toBe(5);

        // Verify each breed was inserted correctly
        for (const expectedBreed of breeds) {
          const foundBreed = verifyResponse.body.find((b: { name: string }) => b.name === expectedBreed.Name);
          expect(foundBreed).toBeDefined();
        }
      });
    });
  });

  // Customer and Dog Data Tests
  describe('Customer and Dog Data', () => {
    it('POST /api/v1/customers should insert customers', async () => {
      const customers = [
        {
          Naam: 'John Doe',
          Contactpersoon: 'John Doe',
          Emailadres: 'john.doe@example.com',
          Telefoonnummer: '0612345678',
          Adres: 'Street 1',
          Postcode: '1234AB',
          Stad: 'Amsterdam',
          Land: 'Netherlands'
        },
        {
          Naam: 'Jane Smith',
          Contactpersoon: 'Jane Smith',
          Emailadres: 'jane.smith@example.com',
          Telefoonnummer: '0687654321',
          Adres: 'Street 2',
          Postcode: '5678CD',
          Stad: 'Rotterdam',
          Land: 'Netherlands'
        },
        {
          Naam: 'Alice Johnson',
          Contactpersoon: 'Alice Johnson',
          Emailadres: 'alice.j@example.com',
          Telefoonnummer: '0611223344',
          Adres: 'Street 3',
          Postcode: '9012EF',
          Stad: 'Utrecht',
          Land: 'Netherlands'
        },
        {
          Naam: 'Bob Wilson',
          Contactpersoon: 'Bob Wilson',
          Emailadres: 'bob.w@example.com',
          Telefoonnummer: '0644556677',
          Adres: 'Street 4',
          Postcode: '3456GH',
          Stad: 'Den Haag',
          Land: 'Netherlands'
        }
      ];

      // Insert each customer
      const insertedCustomers = [];
      for (const customer of customers) {
        const res = await request(app)
          .post('/api/v1/customers')
          .set('Content-Type', 'application/json')
          .send(customer);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Customer inserted successfully');
        insertedCustomers.push(res.body);
      }

      // Verify customers were inserted
      const checkCustomersRes = await request(app).get('/api/v1/customers/table');
      expect(checkCustomersRes.status).toBe(200);
      expect(Array.isArray(checkCustomersRes.body)).toBe(true);
      expect(checkCustomersRes.body.length).toBe(4);

      // Verify customer search works
      const searchRes = await request(app).get('/api/v1/customers/table?search=john');
      expect(searchRes.status).toBe(200);
      expect(Array.isArray(searchRes.body)).toBe(true);
      expect(searchRes.body.length).toBe(1);
      expect(searchRes.body[0].Contactpersoon).toBe('John Doe');
    });

    it('POST /api/v1/dogs should insert dogs and connect them to customers', async () => {
      // First get the customers to get their IDs
      const customersRes = await request(app).get('/api/v1/customers/table');
      const customers = customersRes.body;
      
      // Create dogs for specific customers
      const dogs = [
        {
          CustomerId: customers[0].Id, // John Doe's dogs
          Name: 'Max',
          Birthday: '2020-01-01T00:00:00.000Z',
          Allergies: 'None',
          ServiceNote: 'Regular grooming needed',
          DogSizeId: 'L'
        },
        {
          CustomerId: customers[0].Id,
          Name: 'Luna',
          Birthday: '2021-02-15T00:00:00.000Z',
          Allergies: 'Chicken',
          ServiceNote: 'Sensitive skin',
          DogSizeId: 'M'
        },
        {
          CustomerId: customers[1].Id, // Jane Smith's dog
          Name: 'Charlie',
          Birthday: '2019-06-30T00:00:00.000Z',
          ServiceNote: 'Very friendly',
          DogSizeId: 'L'
        },
        {
          CustomerId: customers[3].Id, // Bob Wilson's dogs
          Name: 'Bella',
          Birthday: '2022-03-10T00:00:00.000Z',
          Allergies: 'Grain',
          ServiceNote: 'Short coat',
          DogSizeId: 'S'
        },
        {
          CustomerId: customers[3].Id,
          Name: 'Rocky',
          Birthday: '2021-11-20T00:00:00.000Z',
          ServiceNote: 'Regular trimming needed',
          DogSizeId: 'M'
        },
        {
          CustomerId: customers[3].Id,
          Name: 'Daisy',
          Birthday: '2020-08-15T00:00:00.000Z',
          ServiceNote: 'Long coat',
          DogSizeId: 'L'
        }
      ];

      // Insert each dog
      for (const dog of dogs) {
        const res = await request(app)
          .post('/api/v1/dogs')
          .set('Content-Type', 'application/json')
          .send(dog);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Dog inserted successfully');
      }

      // Verify dogs were inserted
      const checkDogsRes = await request(app).get('/api/v1/dogs/table');
      expect(checkDogsRes.status).toBe(200);
      expect(Array.isArray(checkDogsRes.body)).toBe(true);
      expect(checkDogsRes.body.length).toBe(6);

      // Verify dog search works
      const dogSearchRes = await request(app).get('/api/v1/dogs/table?search=max');
      expect(dogSearchRes.status).toBe(200);
      expect(Array.isArray(dogSearchRes.body)).toBe(true);
      expect(dogSearchRes.body.length).toBe(1);
      expect(dogSearchRes.body[0].Name).toBe('Max');
    });
  });
}); 