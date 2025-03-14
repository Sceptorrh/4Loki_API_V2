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
      setSaving(true);
      setError(null);
      
      // Prepare the dog data with selected breeds
      const dogData = {
        ...formData,
        DogBreeds: selectedBreeds.map(breedId => ({ Id: breedId }))
      };
      
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