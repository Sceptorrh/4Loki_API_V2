import request from 'supertest';
import { app } from '../src/server';
import { dogSizeIds, dogBreedIds, appointmentStatusIds } from '../src/static/data';

// Define interfaces for test data
interface Customer {
  Id?: number;
  Naam: string;
  Contactpersoon: string;
  Emailadres: string;
  Telefoonnummer: string;
  Notities?: string;
  IsAllowContactShare?: string;
}

interface Dog {
  Id?: number;
  CustomerId: number;
  Name: string;
  Birthday: string;
  Allergies?: string;
  ServiceNote?: string;
  DogSizeId: string;
  DogBreeds?: string[];
}

interface Appointment {
  Id?: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  DateEnd: string;
  ActualDuration: number;
  CustomerId: number;
  AppointmentStatusId: string;
  Note?: string;
}

interface AppointmentDog {
  DogId: number;
  Note?: string;
  services: Array<{
    ServiceId: string;
    Price: number;
  }>;
}

interface CompleteAppointment {
  appointment: Appointment;
  appointmentDogs: AppointmentDog[];
}

describe('Appointment API Endpoints', () => {
  // Global test variables
  let customerId: number;
  let dogIds: number[] = [];
  let appointmentId: number;
  let completeAppointmentId: number;
  let serviceIds: string[] = [];

  // Setup test data
  beforeAll(async () => {
    // Create a test customer
    const customerData: Customer = {
      Naam: 'Test Customer',
      Contactpersoon: 'Test Contact',
      Emailadres: 'test@example.com',
      Telefoonnummer: '0612345678',
      IsAllowContactShare: 'YES'
    };

    const customerRes = await request(app)
      .post('/api/v1/customers')
      .send(customerData);

    expect(customerRes.status).toBe(201);
    customerId = customerRes.body.Id;

    // Create test dogs
    const dogData1: Dog = {
      CustomerId: customerId,
      Name: 'Test Dog 1',
      Birthday: '2020-01-01',
      DogSizeId: dogSizeIds[0], // Large
      DogBreeds: [dogBreedIds[0]] // Labrador
    };

    const dogData2: Dog = {
      CustomerId: customerId,
      Name: 'Test Dog 2',
      Birthday: '2021-02-15',
      DogSizeId: dogSizeIds[1], // Medium
      DogBreeds: [dogBreedIds[1]] // German Shepherd
    };

    const dogData3: Dog = {
      CustomerId: customerId,
      Name: 'Test Dog 3',
      Birthday: '2022-03-20',
      DogSizeId: dogSizeIds[2], // Small
      DogBreeds: [dogBreedIds[2]] // Golden Retriever
    };

    const dog1Res = await request(app)
      .post('/api/v1/dogs')
      .send(dogData1);

    const dog2Res = await request(app)
      .post('/api/v1/dogs')
      .send(dogData2);

    const dog3Res = await request(app)
      .post('/api/v1/dogs')
      .send(dogData3);

    expect(dog1Res.status).toBe(201);
    expect(dog2Res.status).toBe(201);
    expect(dog3Res.status).toBe(201);
    
    dogIds.push(dog1Res.body.Id);
    dogIds.push(dog2Res.body.Id);
    dogIds.push(dog3Res.body.Id);

    // Get available services
    const servicesRes = await request(app)
      .get('/api/v1/static/services');
    
    expect(servicesRes.status).toBe(200);
    expect(Array.isArray(servicesRes.body)).toBe(true);
    expect(servicesRes.body.length).toBeGreaterThan(0);
    
    serviceIds = servicesRes.body.map((service: any) => service.Id);
    console.log('Available serviceIds:', serviceIds);
  });

  describe('Basic Appointment Operations', () => {
    it('POST /api/v1/appointments should create a new appointment', async () => {
      const appointmentData: Appointment = {
        Date: '2023-06-15',
        TimeStart: '10:00',
        TimeEnd: '11:30',
        DateEnd: '2023-06-15',
        ActualDuration: 90,
        CustomerId: customerId,
        AppointmentStatusId: appointmentStatusIds[0], // SCHEDULED
        Note: 'Test appointment'
      };

      const res = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData);

      expect(res.status).toBe(201);
      expect(res.body.Date).toBe(appointmentData.Date);
      expect(res.body.CustomerId).toBe(appointmentData.CustomerId);
      expect(res.body.Id).toBeDefined();
      
      appointmentId = res.body.Id;
    });

    it('GET /api/v1/appointments should return all appointments', async () => {
      const res = await request(app)
        .get('/api/v1/appointments');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // Find our test appointment
      const testAppointment = res.body.find((a: any) => a.Id === appointmentId);
      expect(testAppointment).toBeDefined();
      expect(testAppointment.CustomerId).toBe(customerId);
    });

    it('GET /api/v1/appointments/:id should return a specific appointment', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`);

      expect(res.status).toBe(200);
      expect(res.body.Id).toBe(appointmentId);
      expect(res.body.CustomerId).toBe(customerId);
    });

    it('PUT /api/v1/appointments/:id should update an appointment', async () => {
      const updatedData = {
        Date: '2023-06-16',
        TimeStart: '11:00',
        TimeEnd: '12:30',
        DateEnd: '2023-06-16',
        ActualDuration: 90,
        CustomerId: customerId,
        AppointmentStatusId: appointmentStatusIds[1], // CONFIRMED
        Note: 'Updated test appointment'
      };

      const res = await request(app)
        .put(`/api/v1/appointments/${appointmentId}`)
        .send(updatedData);

      expect(res.status).toBe(200);
      
      // Verify the update
      const checkRes = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.Date).toBe(updatedData.Date);
      expect(checkRes.body.Note).toBe(updatedData.Note);
      expect(checkRes.body.AppointmentStatusId).toBe(updatedData.AppointmentStatusId);
    });

    it('GET /api/v1/appointments/date-range should return appointments in a date range', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/date-range')
        .query({ startDate: '2023-06-01', endDate: '2023-06-30' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Our test appointment should be in this range
      const testAppointment = res.body.find((a: any) => a.Id === appointmentId);
      expect(testAppointment).toBeDefined();
    });

    it('GET /api/v1/appointments/customer/:customerId should return customer appointments', async () => {
      // First, make sure we have at least one appointment for this customer
      const appointmentData: Appointment = {
        Date: '2023-01-01',
        TimeStart: '09:00',
        TimeEnd: '10:00',
        DateEnd: '2023-01-01',
        ActualDuration: 60,
        CustomerId: customerId,
        AppointmentStatusId: appointmentStatusIds[0], // Planned
        Note: 'Test appointment for customer'
      };

      const createRes = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData);
      
      expect(createRes.status).toBe(201);
      
      // Now try to get appointments for this customer
      const res = await request(app)
        .get(`/api/v1/appointments/customer/${customerId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // All appointments should belong to our test customer
      res.body.forEach((appointment: any) => {
        expect(appointment.CustomerId).toBe(customerId);
      });
    });
  });

  describe('Complete Appointment Operations', () => {
    it('POST /api/v1/appointments/complete should create a complete appointment with dogs and services', async () => {
      const completeAppointmentData: CompleteAppointment = {
        appointment: {
          Date: '2023-07-15',
          TimeStart: '14:00',
          TimeEnd: '16:00',
          DateEnd: '2023-07-15',
          ActualDuration: 120,
          CustomerId: customerId,
          AppointmentStatusId: appointmentStatusIds[0], // SCHEDULED
          Note: 'Complete test appointment'
        },
        appointmentDogs: [
          {
            DogId: dogIds[0],
            Note: 'First dog notes',
            services: [
              {
                ServiceId: serviceIds[0],
                Price: 50.00
              }
            ]
          },
          {
            DogId: dogIds[1],
            Note: 'Second dog notes',
            services: [
              {
                ServiceId: serviceIds[0],
                Price: 45.00
              },
              {
                ServiceId: serviceIds[1],
                Price: 15.00
              }
            ]
          },
          {
            DogId: dogIds[2],
            Note: 'Third dog notes',
            services: [
              {
                ServiceId: serviceIds[2],
                Price: 20.00
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/appointments/complete')
        .send(completeAppointmentData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Appointment created successfully');
      expect(res.body.appointmentId).toBeDefined();
      
      completeAppointmentId = res.body.appointmentId;
    });

    it('GET /api/v1/appointments/:id/complete should return a complete appointment', async () => {
      const res = await request(app)
        .get(`/api/v1/appointments/${completeAppointmentId}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.appointment).toBeDefined();
      expect(res.body.appointment.Id).toBe(completeAppointmentId);
      expect(res.body.appointmentDogs).toBeDefined();
      expect(Array.isArray(res.body.appointmentDogs)).toBe(true);
      expect(res.body.appointmentDogs.length).toBe(3);
      
      // Verify customer information
      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.Id).toBeDefined();
      expect(res.body.customer.Naam).toBeDefined();
      expect(res.body.customer.Contactpersoon).toBeDefined();
      
      // Verify status information
      expect(res.body.status).toBeDefined();
      expect(res.body.status.Id).toBeDefined();
      expect(res.body.status.Label).toBeDefined();
      expect(res.body.status.Color).toBeDefined();
      expect(res.body.status.HexColor).toBeDefined();
      expect(res.body.status.HexColor).toMatch(/^#[0-9a-f]{6}$/i);
      
      // Verify dogs and services
      const firstDog = res.body.appointmentDogs.find((dog: any) => dog.DogId === dogIds[0]);
      const secondDog = res.body.appointmentDogs.find((dog: any) => dog.DogId === dogIds[1]);
      const thirdDog = res.body.appointmentDogs.find((dog: any) => dog.DogId === dogIds[2]);
      
      expect(firstDog).toBeDefined();
      expect(secondDog).toBeDefined();
      expect(thirdDog).toBeDefined();
      
      // Verify services
      expect(firstDog.services).toBeDefined();
      expect(Array.isArray(firstDog.services)).toBe(true);
      expect(firstDog.services.length).toBe(1);
      
      expect(secondDog.services).toBeDefined();
      expect(Array.isArray(secondDog.services)).toBe(true);
      expect(secondDog.services.length).toBe(2);
      
      expect(thirdDog.services).toBeDefined();
      expect(Array.isArray(thirdDog.services)).toBe(true);
      expect(thirdDog.services.length).toBe(1);
      
      // Verify breeds
      expect(firstDog.breeds).toBeDefined();
      expect(Array.isArray(firstDog.breeds)).toBe(true);
      
      expect(secondDog.breeds).toBeDefined();
      expect(Array.isArray(secondDog.breeds)).toBe(true);
      
      expect(thirdDog.breeds).toBeDefined();
      expect(Array.isArray(thirdDog.breeds)).toBe(true);
    });

    it('PUT /api/v1/appointments/:id/complete should update a complete appointment', async () => {
      const updatedCompleteAppointmentData: CompleteAppointment = {
        appointment: {
          Date: '2023-07-16',
          TimeStart: '15:00',
          TimeEnd: '17:00',
          DateEnd: '2023-07-16',
          ActualDuration: 120,
          CustomerId: customerId,
          AppointmentStatusId: appointmentStatusIds[1], // CONFIRMED
          Note: 'Updated complete test appointment'
        },
        appointmentDogs: [
          {
            DogId: dogIds[0],
            Note: 'Updated first dog notes',
            services: [
              {
                ServiceId: serviceIds[0],
                Price: 55.00
              },
              {
                ServiceId: serviceIds[1],
                Price: 20.00
              }
            ]
          },
          {
            DogId: dogIds[1],
            Note: 'Updated second dog notes',
            services: [
              {
                ServiceId: serviceIds[2],
                Price: 35.00
              }
            ]
          },
          {
            DogId: dogIds[2],
            Note: 'Updated third dog notes',
            services: [
              {
                ServiceId: serviceIds[0],
                Price: 25.00
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .put(`/api/v1/appointments/${completeAppointmentId}/complete`)
        .send(updatedCompleteAppointmentData);

      if (res.status !== 200) {
        console.log('Error response body:', res.body);
      }
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Appointment updated successfully');
      
      // Verify the update
      const checkRes = await request(app)
        .get(`/api/v1/appointments/${completeAppointmentId}/complete`);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.appointment.Date).toBe(updatedCompleteAppointmentData.appointment.Date);
      expect(checkRes.body.appointment.Note).toBe(updatedCompleteAppointmentData.appointment.Note);
      expect(checkRes.body.appointmentDogs.length).toBe(3); // Three dogs now
      
      // Check all dogs
      const firstDog = checkRes.body.appointmentDogs.find((dog: any) => dog.DogId === dogIds[0]);
      const secondDog = checkRes.body.appointmentDogs.find((dog: any) => dog.DogId === dogIds[1]);
      const thirdDog = checkRes.body.appointmentDogs.find((dog: any) => dog.DogId === dogIds[2]);
      
      expect(firstDog).toBeDefined();
      expect(firstDog.Note).toBe('Updated first dog notes');
      expect(firstDog.services.length).toBe(2);
      
      expect(secondDog).toBeDefined();
      expect(secondDog.Note).toBe('Updated second dog notes');
      expect(secondDog.services.length).toBe(1);
      
      expect(thirdDog).toBeDefined();
      expect(thirdDog.Note).toBe('Updated third dog notes');
      expect(thirdDog.services.length).toBe(1);
    });

  });

}); 