'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { Dog } from '@/types';

export default function DogsPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dogs from the table endpoint
        const dogsResponse = await endpoints.dogs.getTable();
        
        console.log('Dogs API Response:', dogsResponse.data);
        setDogs(dogsResponse.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching dogs data:', err);
        setError('Failed to load dogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter dogs based on search term
  const filteredDogs = dogs.filter(dog => {
    if (!dog) return false;
    
    const name = (dog.Name || dog.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    // Search by name
    return name.includes(search);
  });

  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dogs</h1>
        <Link href="/dogs/new" className="btn btn-primary">
          New Dog
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search dogs..."
          className="input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dogs...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : filteredDogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {searchTerm ? (
            <p className="text-gray-500 mb-4">No dogs found matching "{searchTerm}"</p>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No dogs found</p>
              <Link href="/dogs/new" className="btn btn-primary">
                Add your first dog
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birthday
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDogs.map((dog) => (
                <tr key={dog.Id || dog.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {dog.Name || dog.name || 'Unnamed'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {dog.BreedNames ? (
                        dog.BreedNames.split(',').map((breedName: string, index: number) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {breedName.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {dog.SizeName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatDate(dog.Birthday || dog.birthday)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/customers/${dog.CustomerId || dog.customerId}`}
                      className="text-sm text-primary-600 hover:text-primary-900"
                    >
                      {dog.CustomerName || 'View Owner'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dogs/${dog.Id || dog.id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dogs/${dog.Id || dog.id}/edit`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 