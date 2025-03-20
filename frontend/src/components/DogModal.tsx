import { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { endpoints } from '@/lib/api';

interface DogModalProps {
  onClose: () => void;
  onDogCreated: (dogId: number, dogName: string) => void;
  customerId: number;
}

interface DogBreed {
  id: string;
  name: string;
  Id?: string;
  Name?: string;
  label?: string;
}

interface DogSize {
  id: string;
  name: string;
  Id?: string;
  Name?: string;
  label?: string;
}

export default function DogModal({ onClose, onDogCreated, customerId }: DogModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breeds, setBreeds] = useState<DogBreed[]>([]);
  const [sizes, setSizes] = useState<DogSize[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [breedSearchTerm, setBreedSearchTerm] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const breedSearchRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    size_id: '',
    notes: '',
    birth_date: '',
    allergies: ''
  });

  // Fetch breeds and sizes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const breedsResponse = await endpoints.dogBreeds.getAll();
        console.log('Dog breeds response:', breedsResponse.data);
        
        // Transform the data to ensure it has consistent property names
        const transformedBreeds = (breedsResponse.data || []).map((breed: any) => ({
          id: breed.id || breed.Id,
          name: breed.name || breed.Name || breed.label
        }));
        console.log('Transformed breeds:', transformedBreeds);
        setBreeds(transformedBreeds);
        
        const sizesResponse = await endpoints.dogSizes.getAll();
        console.log('Dog sizes response:', sizesResponse.data);
        
        // Transform the data to ensure it has consistent property names
        const transformedSizes = (sizesResponse.data || []).map((size: any) => ({
          id: size.id || size.Id,
          name: size.name || size.Name || size.label
        }));
        console.log('Transformed sizes:', transformedSizes);
        setSizes(transformedSizes);
      } catch (err) {
        console.error('Error fetching dog data:', err);
        setError('Failed to load breed and size data.');
      }
    };
    
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (breedSearchRef.current && !breedSearchRef.current.contains(event.target as Node)) {
        setShowBreedDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const filteredBreeds = breeds.filter(breed => 
    (breed.name || '').toLowerCase().includes(breedSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name) {
      setError('Please enter a name for the dog.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Transform data to match API expectations
      const apiData = {
        Name: formData.name,
        CustomerId: customerId,
        SizeId: formData.size_id || undefined,
        Notes: formData.notes || undefined,
        BirthDate: formData.birth_date || undefined,
        Allergies: formData.allergies || undefined,
        // Add the selected breeds
        DogBreeds: selectedBreeds.map(breedId => ({ Id: breedId }))
      };
      
      const response = await endpoints.dogs.create(apiData);
      
      // Pass the new dog data back to the parent component
      onDogCreated(response.data.Id, formData.name);
      
      // Close the modal
      onClose();
    } catch (err: any) {
      console.error('Error creating dog:', err);
      setError(err.response?.data?.message || 'Failed to create dog. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Dog</h3>
          <button 
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input w-full"
                required
                placeholder="Dog's name"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Breeds
              </label>
              
              {/* Selected breeds display */}
              {selectedBreeds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedBreeds.map(breedId => {
                    const breed = breeds.find(b => b.id === breedId);
                    return (
                      <div 
                        key={breedId} 
                        className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md flex items-center"
                      >
                        <span>{breed?.name}</span>
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
              <div className="relative" ref={breedSearchRef} id="breed-search-container">
                <input
                  type="text"
                  placeholder="Search breeds..."
                  value={breedSearchTerm}
                  onChange={(e) => setBreedSearchTerm(e.target.value)}
                  onFocus={() => setShowBreedDropdown(true)}
                  className="input w-full"
                  id="breed-search-input-modal"
                />
                
                {/* Breed dropdown - positioned absolute */}
                {showBreedDropdown && (
                  <div 
                    className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto"
                  >
                    {filteredBreeds.length === 0 ? (
                      <div className="p-2 text-gray-500">No breeds found</div>
                    ) : (
                      filteredBreeds.map(breed => {
                        const isSelected = selectedBreeds.includes(breed.id);
                        
                        return (
                          <div 
                            key={breed.id}
                            className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center ${isSelected ? 'bg-primary-50' : ''}`}
                            onClick={() => handleBreedToggle(breed.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                            />
                            <span>{breed.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, size_id: size.id }))}
                    className={`px-4 py-2 rounded-md border ${
                      formData.size_id === size.id
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
                {formData.size_id && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, size_id: '' }))}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <input
                type="text"
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="input w-full"
                placeholder="Any allergies the dog has"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input w-full"
                placeholder="Any special notes about this dog"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Add Dog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 