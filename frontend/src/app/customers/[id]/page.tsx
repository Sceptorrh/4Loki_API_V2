'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Customer, Dog, Appointment } from '@/types';

// Helper function to normalize appointment data
const normalizeAppointmentData = (appointment: any): Appointment => {
  return {
    id: appointment.id || appointment.Id || appointment.AppointmentId,
    date: appointment.date || appointment.Date,
    time: appointment.time || appointment.TimeStart,
    customer_id: appointment.customer_id || appointment.CustomerId,
    customer_name: appointment.customer_name || appointment.ContactPerson,
    status: appointment.status || appointment.AppointmentStatusId || (appointment.Status ? appointment.Status.Id : undefined),
    statusLabel: appointment.statusLabel || (appointment.Status ? appointment.Status.Label : undefined),
    notes: appointment.notes || appointment.Note,
    dogs: appointment.dogs || appointment.Dogs,
    // Keep original properties
    ...appointment
  };
};

// Calculate average interval between appointments
const calculateAverageInterval = (appointments: Appointment[]): number | null => {
  if (!appointments || appointments.length < 2) return null;
  
  // Get all non-null intervals
  const intervals = appointments
    .filter(app => app.daysSincePrevious !== null && app.daysSincePrevious !== undefined)
    .map(app => app.daysSincePrevious as number);
  
  if (intervals.length === 0) return null;
  
  // Calculate average
  const sum = intervals.reduce((acc, interval) => acc + interval, 0);
  return Math.round(sum / intervals.length);
};

// Helper function to check if payment was in cash
const isPaidInCash = (appointment: Appointment): boolean => {
  if (appointment.isPaidInCash === true || appointment.IsPaidInCash === true) return true;
  if (typeof appointment.IsPaidInCash === 'number' && appointment.IsPaidInCash === 1) return true;
  return false;
};

// Helper function to check if payment was by bank
const isPaidByBank = (appointment: Appointment): boolean => {
  if (appointment.isPaidInCash === false || appointment.IsPaidInCash === false) return true;
  if (typeof appointment.IsPaidInCash === 'number' && appointment.IsPaidInCash === 0) return true;
  return false;
};

// Helper function to get status display information
const getStatusInfo = (appointment: Appointment): { label: string, colorClass: string } => {
  // Default values
  let label = 'Unknown';
  let colorClass = 'bg-gray-100 text-gray-800';
  
  // Check if we have the Status object with Color property
  if (appointment.Status && appointment.Status.Color) {
    // Use the color from the API
    const statusColor = appointment.Status.Color.replace('#', '');
    label = appointment.Status.Label || 'Unknown';
    // Create dynamic color classes based on the hex color
    colorClass = `bg-[#${statusColor}] text-white`;
    return { label, colorClass };
  }
  
  // Try to get status from various properties
  const statusId = appointment.status || appointment.AppointmentStatusId || 
    (appointment.Status ? appointment.Status.Id : undefined);
  
  const statusLabel = appointment.statusLabel || 
    (appointment.Status ? appointment.Status.Label : undefined);
  
  // If we have a status label, use it
  if (statusLabel) {
    label = statusLabel;
  } else if (statusId) {
    // Map common status IDs to labels
    switch(statusId) {
      case 'inv':
        label = 'Invoice Ready';
        colorClass = 'bg-blue-100 text-blue-800';
        break;
      case 'com':
        label = 'Completed';
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'cnf':
        label = 'Confirmed';
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'can':
        label = 'Cancelled';
        colorClass = 'bg-red-100 text-red-800';
        break;
      case 'nsh':
        label = 'No Show';
        colorClass = 'bg-red-100 text-red-800';
        break;
      default:
        label = statusId;
    }
  }
  
  return { label, colorClass };
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Number(params.id);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await endpoints.customers.getById(customerId);
        console.log('Customer detail response:', response.data);
        console.log('Customer properties:', response.data ? Object.keys(response.data) : 'No properties');
        setCustomer(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchAppointments = async () => {
      try {
        const response = await endpoints.appointments.getByCustomerId(customerId);
        console.log('Customer appointments response:', response.data);
        console.log('First appointment data structure:', response.data && response.data.length > 0 ? response.data[0] : 'No appointments');
        
        // Normalize the appointment data
        const normalizedAppointments = Array.isArray(response.data) 
          ? response.data.map(normalizeAppointmentData) 
          : [];
        
        // Sort appointments by date (most recent first)
        normalizedAppointments.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA; // Descending order (newest first)
        });
        
        // Calculate days between appointments
        const appointmentsWithDiff = normalizedAppointments.map((appointment, index) => {
          if (index === normalizedAppointments.length - 1) {
            // Last appointment (oldest) has no previous appointment to compare with
            return { ...appointment, daysSincePrevious: null };
          }
          
          const currentDate = appointment.date ? new Date(appointment.date) : null;
          const nextAppointment = normalizedAppointments[index + 1];
          const nextDate = nextAppointment.date ? new Date(nextAppointment.date) : null;
          
          if (!currentDate || !nextDate) {
            return { ...appointment, daysSincePrevious: null };
          }
          
          // Calculate difference in days
          const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return { ...appointment, daysSincePrevious: diffDays };
        });
        
        setAppointments(appointmentsWithDiff);
      } catch (err) {
        console.error('Error fetching customer appointments:', err);
      }
    };

    if (customerId) {
      fetchCustomer();
      fetchAppointments();
    }
  }, [customerId]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await endpoints.customers.delete(customerId);
      router.push('/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error || 'Customer not found'}
        </div>
        <div className="mt-4">
          <Link href="/customers" className="btn btn-outline">
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {customer.Contactpersoon || ''}
        </h1>
        <div className="flex space-x-2">
          <Link href={`/appointments/new?customer_id=${customer.Id}`} className="btn btn-primary">
            Book Appointment
          </Link>
          <Link href={`/customers/${customer.Id}/edit`} className="btn btn-outline">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn bg-red-600 text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card col-span-2">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{customer.Emailadres || 'No email provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{customer.Telefoonnummer || 'No phone provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Sharing</p>
              <p className="text-gray-900">{customer.IsAllowContactShare || 'Not specified'}</p>
            </div>
            {appointments.length >= 2 && (
              <div>
                <p className="text-sm text-gray-500">Average Interval</p>
                <p className="text-gray-900">
                  {calculateAverageInterval(appointments) !== null ? (
                    <span className={`${
                      calculateAverageInterval(appointments)! > 180 ? 'text-red-600 font-medium' : 
                      calculateAverageInterval(appointments)! > 90 ? 'text-yellow-600 font-medium' : 
                      'text-green-600 font-medium'
                    }`}>
                      {calculateAverageInterval(appointments)} days
                    </span>
                  ) : (
                    'Not available'
                  )}
                </p>
              </div>
            )}
          </div>
          {customer.Notities && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-gray-900 whitespace-pre-line">{customer.Notities}</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dogs</h2>
            <Link href={`/dogs/new?customer_id=${customer.Id}`} className="text-sm text-primary-600 hover:text-primary-800">
              + Add Dog
            </Link>
          </div>
          {customer.Dogs && Array.isArray(customer.Dogs) && customer.Dogs.length > 0 ? (
            <div className="space-y-4">
              {customer.Dogs.map((dog, index) => {
                // Check if dog is a string or an object
                const isDogObject = typeof dog !== 'string';
                
                return (
                  <div key={isDogObject ? (dog as Dog).Id : index} className="block p-4 border rounded-lg">
                    <div className="font-medium text-gray-900">
                      {isDogObject ? (dog as Dog).Name : dog}
                    </div>
                    {isDogObject && (dog as Dog).DogSizeId && (
                      <div className="text-sm text-gray-600 mt-1">Size: {(dog as Dog).DogSizeId}</div>
                    )}
                    {isDogObject && (dog as Dog).Birthday && (
                      <div className="text-sm text-gray-600">
                        Birthday: {new Date(String((dog as Dog).Birthday)).toLocaleDateString()}
                      </div>
                    )}
                    {isDogObject && (
                      <div className="mt-2">
                        <Link href={`/dogs/${(dog as Dog).Id}`} className="text-primary-600 hover:text-primary-800 text-sm">
                          View Details
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No dogs added yet</p>
              <Link href={`/dogs/new?customer_id=${customer.Id}`} className="btn btn-sm btn-primary">
                Add Dog
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
        {appointments.length > 0 ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment Interval</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.daysSincePrevious !== null && appointment.daysSincePrevious !== undefined ? (
                          <span className={`${
                            appointment.daysSincePrevious > 180 ? 'text-red-600 font-medium' : 
                            appointment.daysSincePrevious > 90 ? 'text-yellow-600 font-medium' : 
                            'text-gray-900'
                          }`}>
                            {appointment.daysSincePrevious} days
                            {appointment.daysSincePrevious > 180 && ' (long gap)'}
                            {appointment.daysSincePrevious < 14 && appointment.daysSincePrevious > 0 && ' (short interval)'}
                          </span>
                        ) : (
                          <span className="text-gray-500">First visit</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.time || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const { label, colorClass } = getStatusInfo(appointment);
                          return (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isPaidInCash(appointment) ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Cash
                          </span>
                        ) : isPaidByBank(appointment) ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Bank
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link href={`/appointments/${appointment.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customer?.DaysSinceLastAppointment !== null && customer?.DaysSinceLastAppointment !== undefined && (
              <p className="text-gray-700 mt-4">
                Last appointment was{' '}
                <span className={`font-medium ${
                  customer.DaysSinceLastAppointment > 180 
                    ? 'text-red-600' 
                    : customer.DaysSinceLastAppointment > 90 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                }`}>
                  {customer.DaysSinceLastAppointment} days ago
                </span>
              </p>
            )}
            <div className="mt-4">
              <Link href={`/appointments?customer_id=${customer?.Id}`} className="text-primary-600 hover:text-primary-800">
                View all appointments
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No appointments yet</p>
            <Link href={`/appointments/new?customer_id=${customer?.Id}`} className="btn btn-primary">
              Book First Appointment
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/customers" className="text-primary-600 hover:text-primary-800">
          &larr; Back to Customers
        </Link>
      </div>
    </div>
  );
} 