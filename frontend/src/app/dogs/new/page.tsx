'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dog, DogBreed, DogSize } from '@/types';

interface CustomerDropdownItem {
  id: number;
  contactperson: string;
  dogs: {
    id: number;
    name: string;
  }[];
}

export default function NewDogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogBreeds, setDogBreeds] = useState<DogBreed[]>([]);
  const [dogSizes, setDogSizes] = useState<DogSize[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customerId ? parseInt(customerId) : null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Dog>>({
    CustomerId: customerId ? Number(customerId) : undefined,
    Name: '',
    Birthday: '',
    Allergies: '',
    ServiceNote: '',
    DogSizeId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch breeds, sizes, and customers in parallel
        const [breedsResponse, sizesResponse, customersResponse] = await Promise.all([
          endpoints.dogBreeds.getAll(),
          endpoints.dogSizes.getAll(),
          endpoints.customers.getDropdown()
        ]);
        
        setDogBreeds(breedsResponse.data || []);
        setDogSizes(sizesResponse.data || []);
        setCustomers(customersResponse.data || []);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError('Failed to load required data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setFormData(prev => ({ ...prev, CustomerId: customerId }));
    setDropdownOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setSelectedBreeds(selectedValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the dog data with selected breeds
      const dogData = {
        ...formData,
        DogBreeds: selectedBreeds.map(breedId => ({ Id: breedId }))
      };
      
      const response = await endpoints.dogs.create(dogData);
      console.log('Dog created:', response.data);
      
      // Redirect to the dog detail page or back to the customer page
      if (customerId) {
        router.push(`/customers/${customerId}`);
      } else {
        router.push(`/dogs/${response.data.Id || response.data.id}`);
      }
    } catch (err) {
      console.error('Error creating dog:', err);
      setError('Failed to create dog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={customerId ? `/customers/${customerId}` : '/dogs'} 
          className="text-primary-600 hover:text-primary-900"
        >
          &larr; {customerId ? 'Back to Customer' : 'Back to Dogs'}
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">Add New Dog</h1>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {!customerId && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full input flex justify-between items-center"
                      >
                        <span>
                          {selectedCustomerId
                            ? customers.find(c => c.id === selectedCustomerId)?.contactperson
                            : 'Select a customer'}
                        </span>
                        <span className="ml-2">▼</span>
                      </button>
                      {dropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {customers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleCustomerChange(customer.id)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              {customer.contactperson}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="Name"
                    name="Name"
                    required
                    value={formData.Name}
                    onChange={handleChange}
                    className="mt-1 input"
                  />
                </div>

                <div>
                  <label htmlFor="Birthday" className="block text-sm font-medium text-gray-700">
                    Birthday
                  </label>
                  <input
                    type="date"
                    id="Birthday"
                    name="Birthday"
                    value={formData.Birthday}
                    onChange={handleChange}
                    className="mt-1 input"
                  />
                </div>

                <div>
                  <label htmlFor="DogSizeId" className="block text-sm font-medium text-gray-700">
                    Size
                  </label>
                  <select
                    id="DogSizeId"
                    name="DogSizeId"
                    value={formData.DogSizeId}
                    onChange={handleChange}
                    className="mt-1 input"
                  >
                    <option value="">Select a size</option>
                    {dogSizes.map(size => (
                      <option key={size.Id || size.id} value={size.Id || size.id}>
                        {size.Name || size.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="breeds" className="block text-sm font-medium text-gray-700">
                    Breeds (hold Ctrl/Cmd to select multiple)
                  </label>
                  <select
                    id="breeds"
                    name="breeds"
                    multiple
                    value={selectedBreeds}
                    onChange={handleBreedChange}
                    className="mt-1 input h-32"
                  >
                    {dogBreeds.map(breed => (
                      <option key={breed.Id || breed.id} value={breed.Id || breed.id}>
                        {breed.Name || breed.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="Allergies" className="block text-sm font-medium text-gray-700">
                    Allergies
                  </label>
                  <textarea
                    id="Allergies"
                    name="Allergies"
                    rows={3}
                    value={formData.Allergies}
                    onChange={handleChange}
                    className="mt-1 input"
                  />
                </div>

                <div>
                  <label htmlFor="ServiceNote" className="block text-sm font-medium text-gray-700">
                    Service Notes
                  </label>
                  <textarea
                    id="ServiceNote"
                    name="ServiceNote"
                    rows={3}
                    value={formData.ServiceNote}
                    onChange={handleChange}
                    className="mt-1 input"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href={customerId ? `/customers/${customerId}` : '/dogs'}
                className="btn btn-secondary mr-4"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Saving...' : 'Save Dog'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 