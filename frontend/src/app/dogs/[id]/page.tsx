'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Dog } from '@/types';

export default function DogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dogId = params.id as string;
  
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dog by ID
        const dogResponse = await endpoints.dogs.getById(Number(dogId));
        
        console.log('Dog API Response:', dogResponse.data);
        setDog(dogResponse.data || null);
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

  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDelete = async () => {
    try {
      await endpoints.dogs.delete(Number(dogId));
      router.push('/dogs');
    } catch (err) {
      console.error('Error deleting dog:', err);
      setError('Failed to delete dog. Please try again later.');
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/dogs" className="text-primary-600 hover:text-primary-900">
            &larr; Back to Dogs
          </Link>
        </div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Dog not found
        </div>
        <div className="mt-4">
          <Link href="/dogs" className="text-primary-600 hover:text-primary-900">
            &larr; Back to Dogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dogs" className="text-primary-600 hover:text-primary-900">
          &larr; Back to Dogs
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {dog.Name || dog.name || 'Unnamed Dog'}
            </h1>
            <div className="flex space-x-2">
              <Link
                href={`/dogs/${dogId}/edit`}
                className="btn btn-secondary"
              >
                Edit
              </Link>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dog Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{dog.Name || dog.name || 'Unnamed'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Birthday</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(dog.Birthday || dog.birthday)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Size</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {dog.SizeName || (dog.DogSize ? (dog.DogSize.Name || dog.DogSize.label) : 'Unknown')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Breed(s)</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dog.BreedNames ? (
                      dog.BreedNames.split(',').map((breedName: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {breedName.trim()}
                        </span>
                      ))
                    ) : (dog.DogBreeds || dog.dogBreeds || []).length > 0 ? (
                      (dog.DogBreeds || dog.dogBreeds || []).map((breed, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {breed.Name || breed.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Unknown</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Health & Care</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Allergies</h3>
                  <p className="mt-1 text-sm text-gray-900">{dog.Allergies || dog.allergies || 'None'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Service Notes</h3>
                  <p className="mt-1 text-sm text-gray-900">{dog.ServiceNote || dog.serviceNote || 'None'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Owner</h3>
                  <p className="mt-1">
                    <Link 
                      href={`/customers/${dog.CustomerId || dog.customerId}`}
                      className="text-sm text-primary-600 hover:text-primary-900"
                    >
                      {dog.CustomerName || 'View Owner'}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment History</h2>
            <p className="text-sm text-gray-500">Appointment history functionality coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 