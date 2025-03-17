'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Dog, DogBreed, DogSize } from '@/types';

export default function EditDogPage() {
  const params = useParams();
  const router = useRouter();
  const dogId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogBreeds, setDogBreeds] = useState<DogBreed[]>([]);
  const [dogSizes, setDogSizes] = useState<DogSize[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [breedSearchTerm, setBreedSearchTerm] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Dog>>({
    Name: '',
    Birthday: '',
    Allergies: '',
    ServiceNote: '',
    DogSizeId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dog, breeds, and sizes in parallel
        const [dogResponse, breedsResponse, sizesResponse] = await Promise.all([
          endpoints.dogs.getById(Number(dogId)),
          endpoints.dogBreeds.getAll(),
          endpoints.dogSizes.getAll()
        ]);
        
        const dogData = dogResponse.data;
        console.log('Dog API Response:', dogData);
        
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
        
        setDogBreeds(breedsResponse.data || []);
        setDogSizes(sizesResponse.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching dog data:', err);
        setError('Failed to load dog information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (dogId) {
      fetchData();
    }
  }, [dogId]);

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
      
      console.log('Sending dog data:', dogData);
      
      const response = await endpoints.dogs.update(Number(dogId), dogData);
      console.log('Dog updated:', response.data);
      
      // Redirect to the dog detail page
      router.push(`/dogs/${dogId}`);
    } catch (err) {
      console.error('Error updating dog:', err);
      setError('Failed to update dog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dog information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/dogs/${dogId}`} className="text-primary-600 hover:text-primary-900">
          &larr; Back to Dog
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">Edit Dog</h1>
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
                  <div className="relative" id="breed-search-container-edit">
                    <input
                      type="text"
                      placeholder="Search breeds..."
                      value={breedSearchTerm}
                      onChange={(e) => setBreedSearchTerm(e.target.value)}
                      onFocus={() => setShowBreedDropdown(true)}
                      className="w-full input"
                      id="breed-search-input-edit"
                    />
                    
                    {/* Breed dropdown - positioned fixed to avoid container clipping */}
                    {showBreedDropdown && (
                      <>
                        <div 
                          className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-300 overflow-hidden"
                          style={{
                            width: document.getElementById('breed-search-input-edit')?.offsetWidth || 300,
                            maxHeight: '300px',
                            top: (() => {
                              const input = document.getElementById('breed-search-input-edit');
                              if (!input) return '200px';
                              const rect = input.getBoundingClientRect();
                              return `${rect.bottom + window.scrollY + 4}px`;
                            })(),
                            left: (() => {
                              const input = document.getElementById('breed-search-input-edit');
                              if (!input) return '0px';
                              const rect = input.getBoundingClientRect();
                              return `${rect.left + window.scrollX}px`;
                            })()
                          }}
                        >
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
                href={`/dogs/${dogId}`}
                className="btn btn-secondary mr-4"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 