'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from 'date-fns';

interface Dog {
  DogId: number;
  DogName: string;
  ServiceCount: number;
  Selected?: boolean;
  Id?: number;
  Name?: string;
  CustomerId?: number;
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
  CustomerId: number;
  Status: Status;
  Dogs: Dog[];
  Note?: string;
}

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  
  // Form state
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [statusId, setStatusId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedDogIds, setSelectedDogIds] = useState<number[]>([]);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        
        // Fetch appointment data
        const appointmentResponse = await endpoints.appointments.getById(parseInt(appointmentId));
        const appointmentData = appointmentResponse.data;
        
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
        
        // Set form values
        setAppointmentDate(new Date(appointmentData.Date));
        
        try {
          // Handle potential time format issues
          setStartTime(parse(appointmentData.TimeStart, 'HH:mm:ss', new Date()));
          setEndTime(parse(appointmentData.TimeEnd, 'HH:mm:ss', new Date()));
        } catch (timeError) {
          console.error('Error parsing time:', timeError);
          // Fallback to current time if parsing fails
          setStartTime(new Date());
          setEndTime(new Date(new Date().getTime() + 90 * 60000)); // 90 minutes later
        }
        
        setStatusId(appointmentData.Status.Id);
        setNotes(appointmentData.Note || '');
        setSelectedDogIds(appointmentData.Dogs.map((dog: Dog) => dog.DogId));
        
        // Fetch statuses
        try {
          const statusesResponse = await fetch('/api/v1/static/appointment-statuses');
          const statusesData = await statusesResponse.json();
          setStatuses(statusesData || []);
        } catch (statusError) {
          console.error('Error fetching statuses:', statusError);
          // Set a default status if fetch fails
          setStatuses([appointmentData.Status]);
        }
        
        // Fetch all dogs for this customer
        try {
          const dogsResponse = await endpoints.dogs.getAll();
          const allDogs = dogsResponse.data as any[];
          const customerDogs = allDogs.filter(
            (dog: any) => dog.CustomerId === appointmentData.CustomerId
          );
          setAvailableDogs(customerDogs);
        } catch (dogsError) {
          console.error('Error fetching dogs:', dogsError);
          // Use dogs from appointment if fetch fails
          setAvailableDogs(appointmentData.Dogs);
        }
        
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

  const handleDogSelection = (dogId: number) => {
    setSelectedDogIds(prev => {
      if (prev.includes(dogId)) {
        return prev.filter(id => id !== dogId);
      } else {
        return [...prev, dogId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentDate || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (selectedDogIds.length === 0) {
      setError('Please select at least one dog');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Format date and times
      const formattedDate = format(appointmentDate, 'yyyy-MM-dd');
      const formattedStartTime = format(startTime, 'HH:mm');
      const formattedEndTime = format(endTime, 'HH:mm');
      
      // Create appointment data
      const appointmentData = {
        Date: formattedDate,
        TimeStart: formattedStartTime,
        TimeEnd: formattedEndTime,
        DateEnd: formattedDate, // Assuming same day
        ActualDuration: 90, // Default duration in minutes
        CustomerId: appointment?.CustomerId,
        AppointmentStatusId: statusId,
        Note: notes,
        Dogs: selectedDogIds.map(dogId => ({
          DogId: dogId,
          Services: [] // Add services if needed
        }))
      };
      
      // Update the appointment
      await endpoints.appointments.update(parseInt(appointmentId), appointmentData);
      
      // Redirect to the appointment detail page
      router.push(`/appointments/${appointmentId}`);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment. Please try again.');
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
            <p className="mt-4 text-gray-600">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Appointment</h1>
        <div className="flex space-x-4">
          <Link href={`/appointments/${appointmentId}`} className="text-primary-600 hover:text-primary-900">
            Cancel
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
              {appointment.ContactPerson}
            </div>
          </div>
          
          {/* Appointment Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {statuses.map(status => (
                <option key={status.Id} value={status.Id}>
                  {status.Label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Selection */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <DatePicker
              id="date"
              selected={appointmentDate}
              onChange={(date: Date) => setAppointmentDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <DatePicker
                id="startTime"
                selected={startTime}
                onChange={(time: Date) => setStartTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <DatePicker
                id="endTime"
                selected={endTime}
                onChange={(time: Date) => setEndTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Dog Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Dogs *
          </label>
          {availableDogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No dogs found for this customer</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableDogs.map(dog => (
                <div 
                  key={dog.DogId} 
                  className={`border rounded-md p-3 cursor-pointer ${
                    selectedDogIds.includes(dog.DogId) 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleDogSelection(dog.DogId)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDogIds.includes(dog.DogId)}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-900">{dog.DogName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Notes */}
        <div className="mt-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
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
  );
} 