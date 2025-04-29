import { FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { Dog, DogBreed, DogSize } from '@/types';
import CustomerSelection from './CustomerSelection';

interface DogModalProps {
  onClose: () => void;
  onDogCreated?: (dogId: number, dogName: string) => void;
  onDogUpdated?: (dogId: number, dogName: string) => void;
  customerId?: number;
  dogId?: number;
  mode: 'create' | 'edit';
  isCustomerEditable?: boolean;
}

export default function DogModal({ 
  onClose, 
  onDogCreated, 
  onDogUpdated,
  customerId,
  dogId,
  mode = 'create',
  isCustomerEditable = true
}: DogModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogBreeds, setDogBreeds] = useState<DogBreed[]>([]);
  const [dogSizes, setDogSizes] = useState<DogSize[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [breedSearchTerm, setBreedSearchTerm] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customerId || null);
  
  const [formData, setFormData] = useState<Partial<Dog>>({
    Name: '',
    Birthday: '',
    Allergies: '',
    ServiceNote: '',
    DogSizeId: '',
    CustomerId: customerId || undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch breeds, sizes, and customers in parallel
        const [breedsResponse, sizesResponse, customersResponse] = await Promise.all([
          endpoints.dogBreeds.getAll(),
          endpoints.dogSizes.getAll(),
          endpoints.customers.getDropdown()
        ]);
        
        setDogBreeds(breedsResponse.data || []);
        setDogSizes(sizesResponse.data || []);
        setCustomers(customersResponse.data || []);

        // If in edit mode, fetch the dog data
        if (mode === 'edit' && dogId) {
          const dogResponse = await endpoints.dogs.getById(Number(dogId));
          const dogData = dogResponse.data;
          
          // Initialize form data
          setFormData({
            Name: dogData.Name || dogData.name || '',
            Birthday: dogData.Birthday || dogData.birthday || '',
            Allergies: dogData.Allergies || dogData.allergies || '',
            ServiceNote: dogData.ServiceNote || dogData.serviceNote || '',
            DogSizeId: dogData.DogSizeId || dogData.dogSizeId || '',
            CustomerId: dogData.CustomerId || dogData.customerId,
          });
          
          // Initialize selected breeds
          const dogBreedIds = (dogData.DogBreeds || dogData.dogBreeds || []).map(
            (breed: DogBreed) => breed.Id || breed.id
          );
          setSelectedBreeds(dogBreedIds);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dogId, mode, customerId]);

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

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setFormData(prev => ({ ...prev, CustomerId: customerId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Prepare the dog data with selected breeds
      const dogData = {
        ...formData,
        // Convert empty DogSizeId to null for the API
        DogSizeId: formData.DogSizeId === '' ? null : formData.DogSizeId,
        // Ensure breed IDs are sent in the correct format
        DogBreeds: selectedBreeds.map(breedId => ({ Id: breedId }))
      };
      
      let response;
      if (mode === 'edit' && dogId) {
        response = await endpoints.dogs.update(Number(dogId), dogData);
        if (onDogUpdated) {
          onDogUpdated(Number(dogId), dogData.Name || '');
        }
      } else {
        response = await endpoints.dogs.create(dogData);
        if (onDogCreated) {
          onDogCreated(response.data.Id, dogData.Name || '');
        }
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving dog:', err);
      setError('Failed to save dog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'edit' ? 'Edit Dog' : 'Add New Dog'}
          </h3>
          <button 
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mode === 'create' && (
              <div className="md:col-span-2">
                {isCustomerEditable ? (
                  <CustomerSelection
                    selectedCustomerId={selectedCustomerId}
                    customers={customers}
                    onCustomerChange={handleCustomerChange}
                  />
                ) : customerId ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer *
                    </label>
                    <div className="input bg-gray-50 text-gray-700">
                      {customers.find(c => c.id === customerId)?.contactperson || 'Loading...'}
                    </div>
                  </div>
                ) : null}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {dogSizes.map(size => (
                  <button
                    key={size.Id || size.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, DogSizeId: size.Id || size.id || '' }))}
                    className={`px-4 py-2 rounded-md border ${
                      formData.DogSizeId === (size.Id || size.id)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size.Name || size.label}
                  </button>
                ))}
                {formData.DogSizeId && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, DogSizeId: '' }))}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Breeds
              </label>
              
              {/* Selected breeds display */}
              {selectedBreeds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedBreeds.map(breedId => {
                    const breed = dogBreeds.find(b => (b.Id || b.id) === breedId);
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
                  className="w-full input"
                />
                
                {showBreedDropdown && (
                  <>
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredBreeds.length === 0 ? (
                          <div className="p-2 text-gray-500">No breeds found</div>
                        ) : (
                          filteredBreeds.map(breed => {
                            const breedId = breed.Id || breed.id || '';
                            const isSelected = selectedBreeds.includes(breedId);
                            
                            return (
                              <div 
                                key={breedId}
                                className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center ${isSelected ? 'bg-primary-50' : ''}`}
                                onClick={() => handleBreedToggle(breedId)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                                />
                                <span>{breed.Name || breed.name}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    
                    {/* Click outside handler */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowBreedDropdown(false)}
                    ></div>
                  </>
                )}
              </div>
            </div>

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

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary mr-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Dog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 