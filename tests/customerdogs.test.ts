import request from 'supertest';
import { app } from '../src/server';
import { dogSizeIds, dogBreedIds } from '../src/static/data';

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

describe('API Endpoints', () => {
  // Global test variables with proper typing
  let customerIds: { [key: string]: number };

  // Note: We're intentionally not cleaning up test data after tests
  // This allows the data to persist in the database for development/demo purposes
  
  // Customer and Dog Data Tests
  describe('Customer and Dog Data', () => {
    it('POST /api/v1/customers should insert customers', async () => {
      const customers: Customer[] = [
        {
          Naam: 'John Doe',
          Contactpersoon: 'John',
          Emailadres: 'john@example.com',
          Telefoonnummer: '123456789',
          IsAllowContactShare: 'yes'
        },
        {
          Naam: 'Jane Smith',
          Contactpersoon: 'Jane',
          Emailadres: 'jane@example.com',
          Telefoonnummer: '987654321',
          IsAllowContactShare: 'yes'
        },
        {
          Naam: 'Alice Johnson',
          Contactpersoon: 'Alice',
          Emailadres: 'alice@example.com',
          Telefoonnummer: '456789123',
          IsAllowContactShare: 'no'
        },
        {
          Naam: 'Bob Williams',
          Contactpersoon: 'Bob',
          Emailadres: 'bob@example.com',
          Telefoonnummer: '111222333',
          IsAllowContactShare: 'yes'
        },
        {
          Naam: 'Test Klant',
          Contactpersoon: 'Test Contact',
          Emailadres: 'test@example.com',
          Telefoonnummer: '0612345678',
          IsAllowContactShare: 'yes'
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
        bobWilliamsId: insertedCustomers[3].Id!,
        testKlantId: insertedCustomers[4].Id!
      };

      // Verify customers were inserted
      const checkCustomersRes = await request(app).get('/api/v1/customers/table');
      expect(checkCustomersRes.status).toBe(200);
      expect(Array.isArray(checkCustomersRes.body)).toBe(true);
      expect(checkCustomersRes.body.length).toBe(5);

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
      expect(customerIds.bobWilliamsId).toBeDefined();
      
      // Verify dog sizes exist
      const dogSizesRes = await request(app).get('/api/v1/static/dog-sizes');
      expect(dogSizesRes.status).toBe(200);
      expect(Array.isArray(dogSizesRes.body)).toBe(true);
      expect(dogSizesRes.body.length).toBe(dogSizeIds.length);

      // Create dogs for specific customers
      const dogs = [
        {
          CustomerId: customerIds.johnDoeId,
          Name: 'Max',
          Birthday: '2020-01-01',
          Allergies: 'None',
          ServiceNote: 'Regular grooming needed',
          DogSizeId: dogSizeIds[0], // Use L size from static data
          DogBreeds: [dogBreedIds[0], dogBreedIds[2]] // Labrador and Golden Retriever
        },
        {
          CustomerId: customerIds.johnDoeId,
          Name: 'Luna',
          Birthday: '2021-02-15',
          Allergies: 'Chicken',
          ServiceNote: 'Sensitive skin',
          DogSizeId: dogSizeIds[1], // Use M size from static data
          DogBreeds: [dogBreedIds[9]] // Yorkshire Terrier
        },
        {
          CustomerId: customerIds.janeSmithId,
          Name: 'Charlie',
          Birthday: '2019-06-30',
          ServiceNote: 'Very friendly',
          DogSizeId: dogSizeIds[0], // Use L size from static data
          DogBreeds: [dogBreedIds[1], dogBreedIds[7]] // German Shepherd and Rottweiler
        },
        {
          CustomerId: customerIds.bobWilliamsId,
          Name: 'Bella',
          Birthday: '2022-03-10',
          Allergies: 'Grain',
          ServiceNote: 'Short coat',
          DogSizeId: dogSizeIds[2], // Use S size from static data
          DogBreeds: [dogBreedIds[11]] // Chihuahua
        },
        {
          CustomerId: customerIds.bobWilliamsId,
          Name: 'Rocky',
          Birthday: '2021-11-20',
          ServiceNote: 'Regular trimming needed',
          DogSizeId: dogSizeIds[1], // Use M size from static data
          DogBreeds: [dogBreedIds[10], dogBreedIds[6]] // Boxer and Beagle
        },
        {
          CustomerId: customerIds.bobWilliamsId,
          Name: 'Daisy',
          Birthday: '2020-08-15',
          ServiceNote: 'Long coat',
          DogSizeId: dogSizeIds[0], // Use L size from static data
          DogBreeds: [dogBreedIds[5], dogBreedIds[13]] // Poodle and Corgi
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
            // Verify DogBreeds were added
            if (dog.DogBreeds && dog.DogBreeds.length > 0) {
              expect(res.body.DogBreeds).toBeDefined();
              expect(Array.isArray(res.body.DogBreeds)).toBe(true);
              expect(res.body.DogBreeds.length).toBe(dog.DogBreeds.length);
              // Check that each breed ID is in the response
              dog.DogBreeds.forEach(breedId => {
                const foundBreed = res.body.DogBreeds.find((b: any) => b.Id === breedId);
                expect(foundBreed).toBeDefined();
              });
            }
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

      // Verify dog search works using the table endpoint
      const dogSearchRes = await request(app).get('/api/v1/dogs/table?search=max');
      expect(dogSearchRes.status).toBe(200);
      expect(Array.isArray(dogSearchRes.body)).toBe(true);
      expect(dogSearchRes.body.length).toBe(1);
      expect(dogSearchRes.body[0].Name).toBe('Max');
      
      // Verify we can search by breed name
      const breedSearchRes = await request(app).get('/api/v1/dogs/table?search=labrador');
      expect(breedSearchRes.status).toBe(200);
      expect(Array.isArray(breedSearchRes.body)).toBe(true);
      expect(breedSearchRes.body.length).toBeGreaterThan(0);
      expect(breedSearchRes.body[0].Breeds).toContain('Labrador Retriever');
    });

    it('PUT /api/v1/dogs/:id should update a dog with new breeds', async () => {
      // Get all dogs
      const dogsRes = await request(app).get('/api/v1/dogs');
      expect(dogsRes.status).toBe(200);
      expect(Array.isArray(dogsRes.body)).toBe(true);
      
      // Get the first dog
      const dogToUpdate = dogsRes.body[0];
      expect(dogToUpdate.Id).toBeDefined();
      
      // Update the dog with new breeds
      const updatedDogData = {
        CustomerId: dogToUpdate.CustomerId,
        Name: dogToUpdate.Name + ' Updated',
        Birthday: dogToUpdate.Birthday,
        Allergies: dogToUpdate.Allergies,
        ServiceNote: dogToUpdate.ServiceNote,
        DogSizeId: dogToUpdate.DogSizeId,
        DogBreeds: [dogBreedIds[3], dogBreedIds[4]] // French Bulldog and Bulldog
      };
      
      const updateRes = await request(app)
        .put(`/api/v1/dogs/${dogToUpdate.Id}`)
        .send(updatedDogData);
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.Name).toBe(updatedDogData.Name);
      expect(updateRes.body.DogBreeds).toBeDefined();
      expect(Array.isArray(updateRes.body.DogBreeds)).toBe(true);
      expect(updateRes.body.DogBreeds.length).toBe(2);
      
      // Verify the breeds were updated
      const updatedDogRes = await request(app).get(`/api/v1/dogs/${dogToUpdate.Id}`);
      expect(updatedDogRes.status).toBe(200);
      expect(updatedDogRes.body.DogBreeds).toBeDefined();
      expect(Array.isArray(updatedDogRes.body.DogBreeds)).toBe(true);
      expect(updatedDogRes.body.DogBreeds.length).toBe(2);
      
      // Check that each breed ID is in the response
      updatedDogData.DogBreeds.forEach(breedId => {
        const foundBreed = updatedDogRes.body.DogBreeds.find((b: any) => b.Id === breedId);
        expect(foundBreed).toBeDefined();
      });
    });
    
    it('GET /api/v1/dogs/:id should return a dog with its breeds', async () => {
      // Get all dogs
      const dogsRes = await request(app).get('/api/v1/dogs');
      expect(dogsRes.status).toBe(200);
      expect(Array.isArray(dogsRes.body)).toBe(true);
      
      // Get a dog with breeds
      const dogId = dogsRes.body[1].Id; // Use the second dog
      const dogRes = await request(app).get(`/api/v1/dogs/${dogId}`);
      
      expect(dogRes.status).toBe(200);
      expect(dogRes.body.Id).toBe(dogId);
      expect(dogRes.body.DogBreeds).toBeDefined();
      expect(Array.isArray(dogRes.body.DogBreeds)).toBe(true);
    });

    it('DELETE /api/v1/dogs/:id should delete a dog and its associated breeds', async () => {
      // Get all dogs
      const dogsRes = await request(app).get('/api/v1/dogs');
      expect(dogsRes.status).toBe(200);
      expect(Array.isArray(dogsRes.body)).toBe(true);
      
      // Get the last dog to delete
      const dogToDelete = dogsRes.body[dogsRes.body.length - 1];
      expect(dogToDelete.Id).toBeDefined();
      
      // Verify the dog has breeds
      const dogRes = await request(app).get(`/api/v1/dogs/${dogToDelete.Id}`);
      expect(dogRes.status).toBe(200);
      expect(dogRes.body.DogBreeds).toBeDefined();
      expect(Array.isArray(dogRes.body.DogBreeds)).toBe(true);
      expect(dogRes.body.DogBreeds.length).toBeGreaterThan(0);
      
      // Delete the dog
      const deleteRes = await request(app).delete(`/api/v1/dogs/${dogToDelete.Id}`);
      expect(deleteRes.status).toBe(200);
      
      // Verify the dog is deleted
      const deletedDogRes = await request(app).get(`/api/v1/dogs/${dogToDelete.Id}`);
      expect(deletedDogRes.status).toBe(404);
      
      // Verify the total count of dogs has decreased
      const updatedDogsRes = await request(app).get('/api/v1/dogs');
      expect(updatedDogsRes.status).toBe(200);
      expect(Array.isArray(updatedDogsRes.body)).toBe(true);
      expect(updatedDogsRes.body.length).toBe(dogsRes.body.length - 1);
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

}); 



