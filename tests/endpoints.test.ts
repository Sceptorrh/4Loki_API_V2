import request from 'supertest';
import { app } from '../src/server';

// Define interfaces for test data
interface Customer {
  Id?: number;
  Naam: string;
  Contactpersoon: string;
  Emailadres: string;
  Telefoonnummer: string;
  Adres: string;
  Postcode: string;
  Stad: string;
  Land: string;
}

interface Dog {
  Id?: number;
  CustomerId: number;
  Name: string;
  Birthday: string;
  Allergies?: string;
  ServiceNote?: string;
  DogSizeId: string;
}

interface Appointment {
  Id?: number;
  CustomerId: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  DateEnd: string;
  ActualDuration: number;
  AppointmentStatusId: string;
  AppointmentTypeId: number;
  Note?: string;
}

interface Service {
  Id?: number;
  Label: string;
  Order: number;
  Is_Active: boolean;
  OwnerId: number;
}

describe('API Endpoints', () => {
  // Global test variables with proper typing
  let customerIds: { [key: string]: number };
  let serviceIds: { [key: string]: number };
  let appointmentIds: { [key: string]: number };
  
  // Verify static data exists before all other tests
  beforeAll(async () => {
    // Verify custom colors exist
    const colorsRes = await request(app).get('/api/v1/static/custom-colors');
    expect(colorsRes.status).toBe(200);
    expect(Array.isArray(colorsRes.body)).toBe(true);
    expect(colorsRes.body.length).toBeGreaterThan(0);

    // Verify appointment statuses exist
    const statusesRes = await request(app).get('/api/v1/static/appointment-statuses');
    expect(statusesRes.status).toBe(200);
    expect(Array.isArray(statusesRes.body)).toBe(true);
    expect(statusesRes.body.length).toBeGreaterThan(0);

    // Verify dog sizes exist
    const sizesRes = await request(app).get('/api/v1/static/dog-sizes');
    expect(sizesRes.status).toBe(200);
    expect(Array.isArray(sizesRes.body)).toBe(true);
    expect(sizesRes.body.length).toBeGreaterThan(0);

    // Verify appointment types exist
    const typesRes = await request(app).get('/api/v1/static/appointment-types');
    expect(typesRes.status).toBe(200);
    expect(Array.isArray(typesRes.body)).toBe(true);
    expect(typesRes.body.length).toBeGreaterThan(0);

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

  // Clean up after all tests
  afterAll(async () => {
    try {
      // Delete dependent records first
      await request(app).delete('/api/v1/appointments');
      // Add a delay to ensure appointments are fully deleted
      await new Promise(resolve => setTimeout(resolve, 1000));
      await request(app).delete('/api/v1/dogs');
      await request(app).delete('/api/v1/customers');
      await request(app).delete('/api/v1/dog-breeds');
    } catch (error) {
      throw new Error(`Failed to clean up test data: ${error}`);
    }
  });

  // Customer and Dog Data Tests
  describe('Customer and Dog Data', () => {
    it('POST /api/v1/customers should insert customers', async () => {
      const customers: Customer[] = [
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
      const insertedCustomers: Customer[] = [];
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
        johnDoeId: insertedCustomers[0].Id!,
        janeSmithId: insertedCustomers[1].Id!,
        aliceJohnsonId: insertedCustomers[2].Id!,
        bobWilsonId: insertedCustomers[3].Id!
      };

      // Verify customers were inserted
      const checkCustomersRes = await request(app).get('/api/v1/customers/table');
      expect(checkCustomersRes.status).toBe(200);
      expect(Array.isArray(checkCustomersRes.body)).toBe(true);
      expect(checkCustomersRes.body.length).toBe(4);

      // Verify customer search works
      const searchRes = await request(app).get('/api/v1/customers/table?search=John Doe');
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

  // Appointment Tests
  describe('Appointment Data', () => {
    it('POST /api/v1/appointments should insert appointments', async () => {
      // Verify we have customer and service IDs from previous tests
      expect(customerIds).toBeDefined();
      expect(customerIds.johnDoeId).toBeDefined();

      const appointments: Appointment[] = [
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
      const insertedAppointments: Appointment[] = [];
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
        appointment1Id: insertedAppointments[0].Id!,
        appointment2Id: insertedAppointments[1].Id!,
        appointment3Id: insertedAppointments[2].Id!
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



