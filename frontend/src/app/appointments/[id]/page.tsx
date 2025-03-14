'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

interface Dog {
  DogId: number;
  DogName: string;
  ServiceCount: number;
}

interface Status {
  Id: string;
  Label: string;
  Color: string;
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
        const response = await endpoints.appointments.getById(parseInt(appointmentId));
        
        // Ensure the response data has all required fields
        const appointmentData = response.data;
        if (!appointmentData) {
          throw new Error('No appointment data received');
        }
        
        // Set default values for potentially missing properties
        if (!appointmentData.Status) {
          appointmentData.Status = {
            Id: 'unknown',
            Label: 'Unknown',
            Color: '#cccccc'
          };
        }
        
        if (!appointmentData.Dogs) {
          appointmentData.Dogs = [];
        }
        
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
            borderLeftColor: appointment.Status?.Color || '#cccccc' 
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
              {appointment.Status ? (
                <span 
                  className="px-3 py-1 inline-flex text-sm font-medium rounded-full"
                  style={{ 
                    backgroundColor: `${appointment.Status.Color}20`,
                    color: appointment.Status.Color
                  }}
                >
                  {appointment.Status.Label}
                </span>
              ) : (
                <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                  Unknown Status
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
                <p className="text-gray-700">
                  <span className="font-medium">Name:</span> {appointment.ContactPerson}
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
              </div>
            </div>

            {/* Dogs Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dogs</h3>
              {appointment.Dogs.length > 0 ? (
                <ul className="space-y-2">
                  {appointment.Dogs.map(dog => (
                    <li key={dog.DogId} className="flex justify-between">
                      <span className="text-gray-700">{dog.DogName}</span>
                      <span className="text-gray-500">{dog.ServiceCount} service(s)</span>
                    </li>
                  ))}
                </ul>
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