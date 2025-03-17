'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { FaCalendarCheck, FaCalendarTimes, FaCalendarDay, FaClock, FaMoneyBillWave, FaCheck, FaCalendarAlt } from 'react-icons/fa';

interface Dog {
  DogId: number;
  DogName: string;
  ServiceCount: number;
  Breeds?: Array<{
    BreedId: string;
    BreedName: string;
  }>;
  Services?: Array<{
    ServiceId: number;
    ServiceName: string;
    Price: number;
  }>;
}

interface Status {
  Id: string;
  Label: string;
  Color: string;
  HexColor?: string;
}

interface AppointmentDetail {
  AppointmentId: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  ContactPerson: string;
  Status: Status;
  Dogs: Dog[];
  Note?: string;
  CustomerPhone?: string;
  CustomerEmail?: string;
  CustomerName?: string;
  CustomerNotes?: string;
  CustomerAllowContactShare?: string;
}

interface CompleteAppointmentResponse {
  appointment: {
    Id: number;
    Date: string;
    TimeStart: string;
    TimeEnd: string;
    Note?: string;
    AppointmentStatusId: string;
    CustomerId: number;
  };
  appointmentDogs: Array<{
    DogId: number;
    DogName: string;
    Note?: string;
    services: Array<{
      ServiceId: number;
      ServiceName: string;
      Price: number;
    }>;
    breeds: Array<{
      BreedId: string;
      BreedName: string;
    }>;
  }>;
  customer: {
    Id: number;
    Naam: string;
    Emailadres?: string;
    Telefoonnummer?: string;
    Contactpersoon: string;
    Notities?: string;
    IsExported?: boolean;
    IsAllowContactShare?: string;
    CreatedOn?: string;
    UpdatedOn?: string;
  };
  status: {
    Id: string;
    Label: string;
    Color: string;
  };
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await endpoints.appointments.getComplete(parseInt(appointmentId));
        
        // Ensure the response data has all required fields
        const responseData = response.data as CompleteAppointmentResponse;
        if (!responseData) {
          throw new Error('No appointment data received');
        }
        
        // Get status information
        const statusResponse = await endpoints.appointmentStatuses.getAll();
        const statuses = statusResponse.data || [];
        const statusInfo = statuses.find((s: any) => s.Id === responseData.appointment.AppointmentStatusId) || {
          Id: 'unknown',
          Label: 'Unknown',
          Color: '#cccccc'
        };
        
        // Transform the data to match our component's expected format
        const appointmentData: AppointmentDetail = {
          AppointmentId: responseData.appointment.Id,
          Date: responseData.appointment.Date,
          TimeStart: responseData.appointment.TimeStart,
          TimeEnd: responseData.appointment.TimeEnd,
          Note: responseData.appointment.Note,
          Status: responseData.status,
          ContactPerson: responseData.customer.Contactpersoon || '',
          CustomerName: responseData.customer.Naam || '',
          CustomerEmail: responseData.customer.Emailadres,
          CustomerPhone: responseData.customer.Telefoonnummer,
          CustomerNotes: responseData.customer.Notities,
          CustomerAllowContactShare: responseData.customer.IsAllowContactShare,
          Dogs: responseData.appointmentDogs.map(dog => ({
            DogId: dog.DogId,
            DogName: dog.DogName,
            ServiceCount: dog.services?.length || 0,
            Breeds: dog.breeds,
            Services: dog.services
          }))
        };
        
        setAppointment(appointmentData);
        setError(null);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      setLoading(true);
      await endpoints.appointments.delete(parseInt(appointmentId));
      router.push('/appointments');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment. Please try again.');
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  // Calculate total price for all services
  const calculateTotalPrice = (dogs: Dog[]) => {
    return dogs.reduce((total, dog) => {
      const dogTotal = (dog.Services || []).reduce((sum, service) => sum + Number(service.Price || 0), 0);
      return total + dogTotal;
    }, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointment details...</p>
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
          <Link href="/appointments" className="text-primary-600 hover:text-primary-900">
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Appointment not found</p>
          <Link href="/appointments" className="text-primary-600 hover:text-primary-900">
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
        <div className="flex space-x-4">
          <Link href="/appointments" className="text-primary-600 hover:text-primary-900">
            Back to Appointments
          </Link>
          <Link href={`/appointments/${appointmentId}/edit`} className="text-primary-600 hover:text-primary-900">
            Edit
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Appointment Header */}
        <div 
          className="px-6 py-4 border-b" 
          style={{ 
            borderLeftWidth: '6px', 
            borderLeftStyle: 'solid', 
            borderLeftColor: appointment.Status?.HexColor || appointment.Status?.Color || '#8b5cf6' 
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {format(new Date(appointment.Date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <p className="text-gray-600">
                {format(new Date(`${appointment.Date}T${appointment.TimeStart}`), 'h:mm a')} - {format(new Date(`${appointment.Date}T${appointment.TimeEnd}`), 'h:mm a')}
              </p>
            </div>
            <div>
              {appointment.Status && (
                <span 
                  className="px-3 py-1 inline-flex text-sm font-medium rounded-full items-center"
                  style={{ 
                    backgroundColor: `${appointment.Status.HexColor || appointment.Status.Color || '#8b5cf6'}20`,
                    color: appointment.Status.HexColor || appointment.Status.Color || '#8b5cf6'
                  }}
                >
                  {/* Status icon based on status */}
                  <span className="mr-2">
                    {appointment.Status.Id === 'Can' && <FaCalendarTimes />}
                    {appointment.Status.Id === 'Exp' && <FaCalendarCheck />}
                    {appointment.Status.Id === 'Inv' && <FaMoneyBillWave />}
                    {appointment.Status.Id === 'NotExp' && <FaCalendarDay />}
                    {appointment.Status.Id === 'Pln' && <FaCalendarAlt />}
                    {!['Can', 'Exp', 'Inv', 'NotExp', 'Pln'].includes(appointment.Status.Id) && <FaCalendarDay />}
                  </span>
                  {appointment.Status.Label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
              <div className="space-y-2">
                {appointment.CustomerName && (
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span> {appointment.CustomerName}
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-medium">Contact Person:</span> {appointment.ContactPerson}
                </p>
                {appointment.CustomerPhone && (
                  <p className="text-gray-700">
                    <span className="font-medium">Phone:</span> {appointment.CustomerPhone}
                  </p>
                )}
                {appointment.CustomerEmail && (
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span> {appointment.CustomerEmail}
                  </p>
                )}
                {appointment.CustomerNotes && (
                  <p className="text-gray-700">
                    <span className="font-medium">Notes:</span> {appointment.CustomerNotes}
                  </p>
                )}
                {appointment.CustomerAllowContactShare && (
                  <p className="text-gray-700">
                    <span className="font-medium">Contact Sharing:</span> {appointment.CustomerAllowContactShare}
                  </p>
                )}
              </div>
            </div>

            {/* Dogs Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dogs</h3>
              {appointment.Dogs && appointment.Dogs.length > 0 ? (
                <div className="space-y-4">
                  {appointment.Dogs.map(dog => {
                    // Calculate total price for this dog
                    const dogTotalPrice = (dog.Services || []).reduce(
                      (sum, service) => sum + Number(service.Price || 0), 
                      0
                    );
                    
                    return (
                      <div key={dog.DogId} className="border rounded-md p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-700 font-medium">{dog.DogName}</span>
                          <span className="text-gray-500">{dog.ServiceCount} service(s)</span>
                        </div>
                        
                        {/* Dog Breeds */}
                        {dog.Breeds && dog.Breeds.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm text-gray-600">Breeds: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dog.Breeds.map(breed => (
                                <span 
                                  key={breed.BreedId}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {breed.BreedName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Dog Services */}
                        {dog.Services && dog.Services.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Services: </span>
                            <ul className="mt-1 space-y-1">
                              {dog.Services.map(service => (
                                <li key={service.ServiceId} className="flex justify-between text-sm">
                                  <span>{service.ServiceName}</span>
                                  <span>€{(Number(service.Price || 0)).toFixed(2)}</span>
                                </li>
                              ))}
                              <li className="flex justify-between text-sm font-medium border-t pt-1 mt-1">
                                <span>Total for {dog.DogName}</span>
                                <span>€{dogTotalPrice.toFixed(2)}</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Overall Total */}
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between font-medium text-gray-900">
                      <span>Total Price</span>
                      <span>€{calculateTotalPrice(appointment.Dogs).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No dogs associated with this appointment</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.Note && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-line">{appointment.Note}</p>
              </div>
            </div>
          )}

          {/* Delete Button */}
          <div className="mt-8 border-t pt-6">
            {deleteConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-700 mb-3">Are you sure you want to delete this appointment?</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleDelete} 
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    onClick={cancelDelete} 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleDelete} 
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Delete Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 