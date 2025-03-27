'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Dog, Appointment } from '@/types';

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
        
        // Fetch customer details if we have a CustomerId
        let customerData = null;
        if (dogResponse.data?.CustomerId || dogResponse.data?.customerId) {
          const customerResponse = await endpoints.customers.getById(
            dogResponse.data.CustomerId || dogResponse.data.customerId
          );
          customerData = customerResponse.data;
          console.log('Customer API Response:', customerData);
        }
        
        // Fetch appointments for the customer
        let appointmentsData = [];
        if (customerData?.Id || customerData?.id) {
          const appointmentsResponse = await endpoints.appointments.getByCustomerId(
            customerData.Id || customerData.id
          );
          appointmentsData = appointmentsResponse.data || [];
          console.log('Appointments API Response:', appointmentsData);
        }
        
        // Combine all data
        const combinedDogData = {
          ...dogResponse.data,
          CustomerName: customerData?.Contactpersoon || customerData?.Naam,
          Appointments: appointmentsData
        };
        
        console.log('Combined Dog Data:', combinedDogData);
        setDog(combinedDogData || null);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
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
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 1910) return 'Not set';
    return date.toLocaleDateString();
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
      const today = new Date();
      const monthDiff = today.getMonth() - birthday.getMonth() + 
                       (12 * (today.getFullYear() - birthday.getFullYear()));
      
      if (monthDiff <= 0) {
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

  if (error || !dog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Failed to load dog information. Please try again later.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">{dog.Name || dog.name || 'Unnamed'}</h1>
            <div className="flex space-x-4">
              <Link
                href={`/dogs/${dogId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Dog
              </Link>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                  <h3 className="text-sm font-medium text-gray-500">Age</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatAge(dog.Birthday || dog.birthday)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Size</h3>
                  <p className="mt-1 text-sm text-gray-900">         
                    {dog.Size || dog.size || dog.SizeName || (dog.DogSize && dog.DogSize.label) || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Breeds</h3>
                  <div className="mt-1">
                    {dog.DogBreeds && dog.DogBreeds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dog.DogBreeds.map((breed, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {breed.Name || breed.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No breeds specified</p>
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
                      {dog.Contactpersoon || dog.contactpersoon || dog.CustomerName || dog.customerName || 'Unknown Owner'}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment History</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {(dog.Appointments || []).length > 0 ? (
                  [...(dog.Appointments || [])].map((appointment: Appointment) => (
                    <li key={appointment.Id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(appointment.Date)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.TimeStart} - {appointment.TimeEnd}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.AppointmentStatusId}
                        </div>
                      </div>
                      {appointment.Note && (
                        <p className="mt-2 text-sm text-gray-600">
                          {appointment.Note}
                        </p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-4">
                    <p className="text-sm text-gray-500">No appointments found</p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 