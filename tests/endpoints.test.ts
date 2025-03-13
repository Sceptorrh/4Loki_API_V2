import request from 'supertest';
import { app } from '../src/server';

describe('API Endpoints', () => {
  // Global test variables
  let customerIds: { [key: string]: number };
  let serviceIds: { [key: string]: number };
  
  // Ensure static data is inserted before all other tests
  beforeAll(async () => {
    // Insert custom colors first
    const colors = [
      { color: 'Cancelled', order: 4, hex: '#a80808', legend: 'Geannuleerd' },
      { color: 'Exported', order: 3, hex: '#74ed86', legend: 'Geexporteerd' },
      { color: 'Invoiced', order: 2, hex: '#4973de', legend: 'Gefactureerd' },
      { color: 'NotExported', order: 6, hex: '#b5cc8d', legend: 'Niet geexporteerd' },
      { color: 'OtherHours', order: 5, hex: '#57c2bb', legend: 'Andere uren' },
      { color: 'Planned', order: 1, hex: '#a9abb0', legend: 'Geplanned' }
    ];
    
    await request(app).delete('/api/v1/static/appointment-statuses');
    await request(app).delete('/api/v1/static/custom-colors');
    await request(app).post('/api/v1/static/custom-colors').send(colors);

    // Insert appointment statuses
    const statuses = [
      { id: 'Can', label: 'Geannuleerd', order: 3, is_active: 1, color: 'Cancelled' },
      { id: 'Exp', label: 'Geexporteerd', order: 7, is_active: 1, color: 'Exported' },
      { id: 'Inv', label: 'Gefactureerd', order: 5, is_active: 1, color: 'Invoiced' },
      { id: 'NotExp', label: 'NotExported', order: 8, is_active: 1, color: 'NotExported' },
      { id: 'Pln', label: 'Gepland', order: 2, is_active: 1, color: 'Planned' }
    ];
    await request(app).post('/api/v1/static/appointment-statuses').send(statuses);

    // Insert dog sizes (required for dog tests)
    console.log('Setting up dog sizes...');
    try {
      // First delete existing dog sizes
      console.log('Deleting existing dog sizes...');
      await request(app).delete('/api/v1/static/dog-sizes');
      
      const sizes = [
        { id: 'L', label: 'Large', order: 3, is_active: true },
        { id: 'M', label: 'Middle', order: 2, is_active: true },
        { id: 'S', label: 'Small', order: 1, is_active: true },
        { id: 'X', label: 'ExtraLarge', order: 4, is_active: true }
      ];
      
      console.log('Inserting dog sizes:', JSON.stringify(sizes, null, 2));
      const res = await request(app).post('/api/v1/static/dog-sizes').send(sizes);
      console.log('Dog sizes insertion response:', res.status, res.body);
      
      if (res.status !== 201) {
        throw new Error(`Failed to insert dog sizes: ${JSON.stringify(res.body)}`);
      }
      
      // Verify dog sizes were inserted
      const checkRes = await request(app).get('/api/v1/static/dog-sizes');
      console.log('Verifying dog sizes:', checkRes.status, checkRes.body);
      if (!Array.isArray(checkRes.body) || checkRes.body.length !== 4) {
        throw new Error('Dog sizes verification failed');
      }
    } catch (error) {
      console.error('Error setting up dog sizes:', error);
      throw error;
    }

    // Insert dog breeds
    const breeds = [
      { Name: 'Labrador Retriever', OwnerId: 1 },
      { Name: 'German Shepherd', OwnerId: 1 },
      { Name: 'Golden Retriever', OwnerId: 1 },
      { Name: 'French Bulldog', OwnerId: 1 },
      { Name: 'Poodle', OwnerId: 1 }
    ];

    await request(app).delete('/api/v1/dog-breeds');
    for (const breed of breeds) {
      await request(app).post('/api/v1/dog-breeds').send(breed);
    }
  });

  // Static Table endpoints first
  describe('Static Table Endpoints', () => {
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
    });

    // Static table GET endpoints
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

      // Insert each customer and store their IDs
      const insertedCustomers = [];
      for (const customer of customers) {
        const res = await request(app)
          .post('/api/v1/customers')
          .set('Content-Type', 'application/json')
          .send(customer);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject(customer);
        expect(res.body.Id).toBeDefined();
        insertedCustomers.push(res.body);
      }

      // Store customer IDs for use in other tests
      customerIds = {
        johnDoeId: insertedCustomers[0].Id,
        janeSmithId: insertedCustomers[1].Id,
        aliceJohnsonId: insertedCustomers[2].Id,
        bobWilsonId: insertedCustomers[3].Id
      };
      console.log('Stored customer IDs:', customerIds);

      // Verify customers were inserted
      const checkCustomersRes = await request(app).get('/api/v1/customers/table');
      expect(checkCustomersRes.status).toBe(200);
      expect(Array.isArray(checkCustomersRes.body)).toBe(true);
      expect(checkCustomersRes.body.length).toBe(4);

      // Verify customer search works
      console.log('Searching for customer with "John Doe"...');
      const searchRes = await request(app).get('/api/v1/customers/table?search=John Doe');
      console.log('Search response:', searchRes.status, searchRes.body);
      expect(searchRes.status).toBe(200);
      expect(Array.isArray(searchRes.body)).toBe(true);
      expect(searchRes.body.length).toBe(1);
      expect(searchRes.body[0].Contactpersoon).toBe('John Doe');
    });

    it('POST /api/v1/dogs should insert dogs and connect them to customers', async () => {
      // Verify we have customer IDs
      expect(customerIds).toBeDefined();
      expect(customerIds.johnDoeId).toBeDefined();
      expect(customerIds.janeSmithId).toBeDefined();
      expect(customerIds.bobWilsonId).toBeDefined();
      
      // Verify dog sizes exist
      const dogSizesRes = await request(app).get('/api/v1/static/dog-sizes');
      expect(dogSizesRes.status).toBe(200);
      expect(Array.isArray(dogSizesRes.body)).toBe(true);
      expect(dogSizesRes.body.length).toBe(4);

      // Create dogs for specific customers
      const dogs = [
        {
          CustomerId: customerIds.johnDoeId,
          Name: 'Max',
          Birthday: '2020-01-01',
          Allergies: 'None',
          ServiceNote: 'Regular grooming needed',
          DogSizeId: 'L'
        },
        {
          CustomerId: customerIds.johnDoeId,
          Name: 'Luna',
          Birthday: '2021-02-15',
          Allergies: 'Chicken',
          ServiceNote: 'Sensitive skin',
          DogSizeId: 'M'
        },
        {
          CustomerId: customerIds.janeSmithId,
          Name: 'Charlie',
          Birthday: '2019-06-30',
          ServiceNote: 'Very friendly',
          DogSizeId: 'L'
        },
        {
          CustomerId: customerIds.bobWilsonId,
          Name: 'Bella',
          Birthday: '2022-03-10',
          Allergies: 'Grain',
          ServiceNote: 'Short coat',
          DogSizeId: 'S'
        },
        {
          CustomerId: customerIds.bobWilsonId,
          Name: 'Rocky',
          Birthday: '2021-11-20',
          ServiceNote: 'Regular trimming needed',
          DogSizeId: 'M'
        },
        {
          CustomerId: customerIds.bobWilsonId,
          Name: 'Daisy',
          Birthday: '2020-08-15',
          ServiceNote: 'Long coat',
          DogSizeId: 'L'
        }
      ];

      // Insert all dogs in parallel
      const insertPromises = dogs.map(dog => 
        request(app)
          .post('/api/v1/dogs')
          .send(dog)
          .then(res => {
            expect(res.status).toBe(201);
            expect(res.body.Name).toBe(dog.Name);
            expect(res.body.CustomerId).toBe(dog.CustomerId);
            expect(res.body.DogSizeId).toBe(dog.DogSizeId);
            return res.body;
          })
      );

      const insertedDogs = await Promise.all(insertPromises);
      expect(insertedDogs.length).toBe(6);

      // Verify dogs were inserted using the base endpoint
      const checkDogsRes = await request(app).get('/api/v1/dogs');
      expect(checkDogsRes.status).toBe(200);
      expect(Array.isArray(checkDogsRes.body)).toBe(true);
      expect(checkDogsRes.body.length).toBe(6);

      // Debug: Log all dogs to verify their data
      console.log('All dogs:', JSON.stringify(checkDogsRes.body, null, 2));

      // Verify dog search works using the table endpoint
      console.log('Attempting to search for dog "Max"...');
      const dogSearchRes = await request(app).get('/api/v1/dogs/table?search=max');
      console.log('Search response:', JSON.stringify(dogSearchRes.body, null, 2));
      expect(dogSearchRes.status).toBe(200);
      expect(Array.isArray(dogSearchRes.body)).toBe(true);
      expect(dogSearchRes.body.length).toBe(1);
      expect(dogSearchRes.body[0].Name).toBe('Max');
    });
  });

  // Dog Breed Tests
  describe('Dog Breed Data', () => {
    it('POST /api/v1/dog-breeds should insert dog breeds', async () => {
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

    it('GET /api/v1/dog-breeds should return all dog breeds', async () => {
      const res = await request(app).get('/api/v1/dog-breeds');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);
    });
  });

  // Service Tests
  describe('Service Data', () => {
    interface Service {
      Name: string;
      StandardPrice: number;
      StandardDuration: number;
      IsPrice0Allowed: boolean;
      OwnerId: number;
    }

    const services: Service[] = [
      {
        Name: 'Basic Grooming',
        StandardPrice: 50.00,
        StandardDuration: 60,
        IsPrice0Allowed: false,
        OwnerId: 1
      },
      {
        Name: 'Full Grooming',
        StandardPrice: 75.00,
        StandardDuration: 90,
        IsPrice0Allowed: false,
        OwnerId: 1
      },
      {
        Name: 'Nail Trimming',
        StandardPrice: 20.00,
        StandardDuration: 30,
        IsPrice0Allowed: false,
        OwnerId: 1
      }
    ];

    // Insert each service and store their IDs
    interface ServiceResponse extends Service {
      Id: number;
    }
    const insertedServices: ServiceResponse[] = [];

    it('POST /api/v1/services should insert services', async () => {
      for (const service of services) {
        const res = await request(app)
          .post('/api/v1/services')
          .send(service);

        expect(res.status).toBe(201);
        // Update expectations to handle type conversions
        expect(res.body.Name).toBe(service.Name);
        expect(parseFloat(res.body.StandardPrice)).toBe(service.StandardPrice);
        expect(res.body.StandardDuration).toBe(service.StandardDuration);
        expect(Boolean(res.body.IsPrice0Allowed)).toBe(service.IsPrice0Allowed);
        expect(res.body.OwnerId).toBe(service.OwnerId);
        expect(res.body.Id).toBeDefined();
        insertedServices.push(res.body);
      }

      // Store service IDs for use in other tests
      serviceIds = {
        basicGroomingId: insertedServices[0].Id,
        fullGroomingId: insertedServices[1].Id,
        nailTrimmingId: insertedServices[2].Id
      };
      console.log('Stored service IDs:', serviceIds);
    });

    it('GET /api/v1/services should return all services', async () => {
      const res = await request(app).get('/api/v1/services');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(services.length);
      
      // Verify each service was inserted correctly
      for (const expectedService of services) {
        const foundService = res.body.find((s: any) => s.Name === expectedService.Name);
        expect(foundService).toBeDefined();
        expect(parseFloat(foundService.StandardPrice)).toBe(expectedService.StandardPrice);
        expect(foundService.StandardDuration).toBe(expectedService.StandardDuration);
        expect(Boolean(foundService.IsPrice0Allowed)).toBe(expectedService.IsPrice0Allowed);
        expect(foundService.OwnerId).toBe(expectedService.OwnerId);
      }
    });
  });

  // Appointment Tests
  describe('Appointment Data', () => {
    let appointmentIds: { [key: string]: number };

    it('POST /api/v1/appointments should insert appointments', async () => {
      // Verify we have customer and service IDs from previous tests
      expect(customerIds).toBeDefined();
      expect(customerIds.johnDoeId).toBeDefined();
      expect(serviceIds).toBeDefined();
      expect(serviceIds.basicGroomingId).toBeDefined();

      const appointments = [
        {
          CustomerId: customerIds.johnDoeId,
          Date: '2024-03-20',
          TimeStart: '10:00',
          TimeEnd: '11:00',
          DateEnd: '2024-03-20',
          ActualDuration: 60,
          AppointmentStatusId: 'Pln',
          AppointmentTypeId: 3,
          Note: 'First appointment'
        },
        {
          CustomerId: customerIds.janeSmithId,
          Date: '2024-03-21',
          TimeStart: '14:00',
          TimeEnd: '15:30',
          DateEnd: '2024-03-21',
          ActualDuration: 90,
          AppointmentStatusId: 'Pln',
          AppointmentTypeId: 2,
          Note: 'Second appointment'
        },
        {
          CustomerId: customerIds.bobWilsonId,
          Date: '2024-03-22',
          TimeStart: '09:30',
          TimeEnd: '10:30',
          DateEnd: '2024-03-22',
          ActualDuration: 60,
          AppointmentStatusId: 'Pln',
          AppointmentTypeId: 1,
          Note: 'Third appointment'
        }
      ];

      // Insert each appointment and store their IDs
      const insertedAppointments = [];
      for (const appointment of appointments) {
        const res = await request(app)
          .post('/api/v1/appointments')
          .send(appointment);

        expect(res.status).toBe(201);
        expect(res.body.CustomerId).toBe(appointment.CustomerId);
        expect(res.body.AppointmentStatusId).toBe(appointment.AppointmentStatusId);
        expect(res.body.Id).toBeDefined();
        insertedAppointments.push(res.body);
      }

      // Store appointment IDs for use in other tests
      appointmentIds = {
        appointment1Id: insertedAppointments[0].Id,
        appointment2Id: insertedAppointments[1].Id,
        appointment3Id: insertedAppointments[2].Id
      };

      // Verify appointments were inserted
      const checkAppointmentsRes = await request(app).get('/api/v1/appointments');
      expect(checkAppointmentsRes.status).toBe(200);
      expect(Array.isArray(checkAppointmentsRes.body)).toBe(true);
      expect(checkAppointmentsRes.body.length).toBe(3);
    });

    it('GET /api/v1/appointments should return all appointments', async () => {
      const res = await request(app).get('/api/v1/appointments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it('GET /api/v1/appointments/status/:statusId should return appointments by status', async () => {
      const res = await request(app).get('/api/v1/appointments/status/Pln');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });
  });

  // Dog Picture Tests
  describe('Dog Picture Data', () => {
    it('POST /api/v1/dog-pictures should insert dog pictures', async () => {
      // First get an appointment ID
      const appointmentsRes = await request(app).get('/api/v1/appointments');
      expect(appointmentsRes.status).toBe(200);
      expect(Array.isArray(appointmentsRes.body)).toBe(true);
      expect(appointmentsRes.body.length).toBeGreaterThan(0);
      
      const appointmentId = appointmentsRes.body[0].Id;
      expect(appointmentId).toBeDefined();

      const now = new Date();
      const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const dogPictures = [
        {
          DogId: 1,
          AppointmentId: appointmentId,
          DateTime: mysqlDatetime,
          OwnerId: 1,
          Picture: Buffer.from('test image 1').toString('base64')
        },
        {
          DogId: 1,
          AppointmentId: appointmentId,
          DateTime: mysqlDatetime,
          OwnerId: 1,
          Picture: Buffer.from('test image 2').toString('base64')
        }
      ];

      // Insert each dog picture
      for (const picture of dogPictures) {
        const res = await request(app)
          .post('/api/v1/dog-pictures')
          .send(picture);

        expect(res.status).toBe(201);
        expect(res.body.DogId).toBe(picture.DogId);
        expect(res.body.AppointmentId).toBe(picture.AppointmentId);
        expect(res.body.Id).toBeDefined();
      }
    });

    it('GET /api/v1/dog-pictures should return all dog pictures', async () => {
      const res = await request(app).get('/api/v1/dog-pictures');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

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

    it('GET /api-docs/custom-swagger.js should serve custom Swagger JS', async () => {
      const res = await request(app).get('/api-docs/custom-swagger.js');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/javascript');
    });
  });
}); 



