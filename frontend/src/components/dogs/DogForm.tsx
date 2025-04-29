import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dog, DogBreed, DogSize } from '@/types';
import CustomerSelection from '@/components/dogs/CustomerSelection';

interface CustomerDropdownItem {
  id: number;
  contactperson: string;
  dogs: {
    id: number;
    name: string;
  }[];
}

interface DogFormProps {
  initialCustomerId?: number | null;
  onSuccess?: (dogId: number) => void;
  showCustomerSelection?: boolean;
  backUrl?: string;
  showHeader?: boolean;
  onCancel?: () => void;
}

export default function DogForm({
  initialCustomerId = null,
  onSuccess,
  showCustomerSelection = true,
  backUrl = '/dogs',
  showHeader = true,
  onCancel
}: DogFormProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogBreeds, setDogBreeds] = useState<DogBreed[]>([]);
  const [dogSizes, setDogSizes] = useState<DogSize[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(initialCustomerId);
  const [breedSearchTerm, setBreedSearchTerm] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Dog>>({
    CustomerId: initialCustomerId || undefined,
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBreedToggle = (breedId: string) => {
    setSelectedBreeds(prev => {
      if (prev.includes(breedId)) {
        return prev.filter(id => id !== breedId);
      } else {
        return [...prev, breedId];
      }
    });
  };

  const handleRemoveBreed = (breedId: string) => {
    setSelectedBreeds(prev => prev.filter(id => id !== breedId));
  };

  const filteredBreeds = dogBreeds.filter(breed => 
    (breed.Name || breed.name || '').toLowerCase().includes(breedSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the dog data with selected breeds
      const dogData = {
        ...formData,
        // Convert empty DogSizeId to null for the API
        DogSizeId: formData.DogSizeId === '' ? null : formData.DogSizeId,
        // Ensure breed IDs are sent in the correct format
        DogBreeds: selectedBreeds.map(breedId => ({ Id: breedId }))
      };
      
      console.log('Sending dog data:', dogData);
      
      const response = await endpoints.dogs.create(dogData);
      console.log('Dog created:', response.data);
      
      const newDogId = response.data.Id || response.data.id;
      
      if (onSuccess) {
        onSuccess(newDogId);
      } else {
        // Redirect to the dog detail page or back to the customer page
        if (initialCustomerId) {
          router.push(`/customers/${initialCustomerId}`);
        } else {
          router.push(`/dogs/${newDogId}`);
        }
      }
    } catch (err) {
      console.error('Error creating dog:', err);
      setError('Failed to create dog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (backUrl) {
      router.push(backUrl);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">Add New Dog</h1>
        </div>
      )}

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {showCustomerSelection && (
                <CustomerSelection
                  selectedCustomerId={selectedCustomerId}
                  customers={customers}
                  onCustomerChange={handleCustomerChange}
                />
              )}

              <div>
                <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="Name"
                  name="Name"
                  value={formData.Name}
                  onChange={handleChange}
                  className="mt-1 input"
                  required
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
                  {dogSizes.map((size) => (
                    <option key={size.Id} value={size.Id}>
                      {size.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breeds
                </label>
                
                {/* Selected breeds display */}
                {selectedBreeds.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedBreeds.map(breedId => {
                      const breed = dogBreeds.find(b => b.Id === breedId);
                      return (
                        <div 
                          key={breedId} 
                          className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md flex items-center"
                        >
                          <span>{breed?.Name || breed?.name}</span>
                          <button 
                            type="button" 
                            className="ml-1 text-primary-600 hover:text-primary-800"
                            onClick={() => handleRemoveBreed(breedId)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search breeds..."
                    value={breedSearchTerm}
                    onChange={(e) => setBreedSearchTerm(e.target.value)}
                    onFocus={() => setShowBreedDropdown(true)}
                    className="input w-full"
                  />
                  {showBreedDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredBreeds.map((breed) => (
                        <button
                          key={breed.Id}
                          type="button"
                          onClick={() => {
                            handleBreedToggle(breed.Id);
                            setBreedSearchTerm('');
                            setShowBreedDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          {breed.Name || breed.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary mr-4"
            >
              Cancel
            </button>
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
  );
} 