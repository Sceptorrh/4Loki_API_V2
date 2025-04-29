'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dog } from '@/types';
import DogModal from '@/components/dogs/DogModal';

type SortField = 'name' | 'size' | 'birthday' | 'owner' | 'age' | null;
type SortDirection = 'asc' | 'desc';

export default function DogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDogId, setEditingDogId] = useState<number | undefined>();

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
    
    const search = searchTerm.toLowerCase();
    
    // Search by name
    const name = (dog.Name || dog.name || '').toLowerCase();
    if (name.includes(search)) return true;
    
    // Search by breed
    const breeds = dog.Breeds 
      ? dog.Breeds.map(breed => (breed.Name || breed.name || '').toLowerCase())
      : dog.BreedNames 
        ? dog.BreedNames.split(',').map(breed => breed.trim().toLowerCase())
        : [];
    if (breeds.some(breed => breed.includes(search))) return true;
    
    // Search by owner name
    const ownerName = (dog.CustomerName || '').toLowerCase();
    if (ownerName.includes(search)) return true;
    
    return false;
  });

  // Sort dogs based on current sort field and direction
  const sortedDogs = [...filteredDogs].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = (a.Name || a.name || '').toLowerCase();
        bValue = (b.Name || b.name || '').toLowerCase();
        break;
      case 'size':
        aValue = (a.Size || '').toLowerCase();
        bValue = (b.Size || '').toLowerCase();
        break;
      case 'birthday':
        aValue = a.Birthday || a.birthday || '';
        bValue = b.Birthday || b.birthday || '';
        break;
      case 'owner':
        aValue = (a.CustomerName || '').toLowerCase();
        bValue = (b.CustomerName || '').toLowerCase();
        break;
      case 'age':
        const aDate = a.Birthday || a.birthday ? new Date(a.Birthday || a.birthday || '') : null;
        const bDate = b.Birthday || b.birthday ? new Date(b.Birthday || b.birthday || '') : null;
        aValue = aDate ? calculateAge(aDate) : -1;
        bValue = bDate ? calculateAge(bDate) : -1;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Helper function to format date to show only month and day
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 1910) return 'Not set';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Calculate age from birthday
  const calculateAge = (birthday: Date): number => {
    if (!birthday || isNaN(birthday.getTime()) || birthday.getFullYear() < 1910) return -1;
    
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format age with appropriate units
  const formatAge = (dateString: string | undefined): string => {
    if (!dateString) return 'Not set';
    
    const birthday = new Date(dateString);
    if (isNaN(birthday.getTime()) || birthday.getFullYear() < 1910) return 'Not set';
    
    const ageYears = calculateAge(birthday);
    
    if (ageYears < 0) return 'Not set';
    if (ageYears === 0) {
      // Calculate age in months for puppies
      const today = new Date();
      const monthDiff = today.getMonth() - birthday.getMonth() + 
                       (12 * (today.getFullYear() - birthday.getFullYear()));
      
      if (monthDiff <= 0) {
        // Calculate age in weeks for very young puppies
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((today.getTime() - birthday.getTime()) / oneDay));
        const weeks = Math.floor(diffDays / 7);
        
        if (weeks <= 0) {
          return `${diffDays} days`;
        }
        return `${weeks} weeks`;
      }
      return `${monthDiff} months`;
    }
    
    return `${ageYears} years`;
  };

  const handleDogCreated = (dogId: number, dogName: string) => {
    setShowModal(false);
    if (customerId) {
      router.push(`/customers/${customerId}`);
    } else {
      router.push(`/dogs/${dogId}`);
    }
  };

  const handleDogUpdated = (dogId: number, dogName: string) => {
    setShowModal(false);
    setEditingDogId(undefined);
    router.push(`/dogs/${dogId}`);
  };

  const handleRowClick = (dogId: string | number | undefined) => {
    if (!dogId) return;
    
    // If already tracking a click, it's a double click
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
      setEditingDogId(Number(dogId));
      setShowModal(true);
    } else {
      // Set a timeout to detect if this is a single click
      const timer = setTimeout(() => {
        setClickTimer(null);
        router.push(`/dogs/${dogId}`);
      }, 250); // 250ms delay to detect double click
      
      setClickTimer(timer);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dogs</h1>
        <button 
          onClick={() => {
            setEditingDogId(undefined);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          New Dog
        </button>
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon field="name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breed
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('size')}
                >
                  Size <SortIcon field="size" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('birthday')}
                >
                  Birthday <SortIcon field="birthday" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('age')}
                >
                  Age <SortIcon field="age" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('owner')}
                >
                  Owner <SortIcon field="owner" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDogs.map((dog) => {
                const dogId = dog.Id || dog.id;
                const editUrl = `/dogs/${dogId}/edit`;
                
                return (
                  <tr 
                    key={dogId}
                    onClick={() => handleRowClick(dogId)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {dog.Name || dog.name || 'Unnamed'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {dog.Breeds && dog.Breeds.length > 0 ? (
                          dog.Breeds.map((breed, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {breed.Name || breed.name}
                            </span>
                          ))
                        ) : dog.BreedNames ? (
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
                        {dog.Size || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(dog.Birthday || dog.birthday)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatAge(dog.Birthday || dog.birthday)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/customers/${dog.CustomerId || dog.customerId}`}
                        className="text-sm text-primary-600 hover:text-primary-900"
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        {dog.CustomerName || 'View Owner'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          setEditingDogId(Number(dogId));
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <DogModal
          mode={editingDogId ? "edit" : "create"}
          dogId={editingDogId}
          customerId={customerId ? parseInt(customerId) : undefined}
          onClose={() => {
            setShowModal(false);
            setEditingDogId(undefined);
          }}
          onDogCreated={handleDogCreated}
          onDogUpdated={handleDogUpdated}
        />
      )}
    </div>
  );
} 