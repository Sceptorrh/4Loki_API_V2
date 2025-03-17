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
  services?: Array<{
    ServiceId: string | number;
    Price: number;
    ServiceName?: string;
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
  CustomerId: number;
  Status: Status;
  Dogs: Dog[];
  Note?: string;
  CustomerName?: string;
}

// Add Service interface
interface Service {
  Id: string;
  Name: string;
  StandardPrice: number;
  IsPriceAllowed: boolean;
  StandardDuration: number;
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
  
  // Add state for services
  const [services, setServices] = useState<Service[]>([]);
  const [dogServicesMap, setDogServicesMap] = useState<Map<number, any[]>>(new Map());

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        
        // Fetch appointment data using getComplete instead of getById
        const appointmentResponse = await endpoints.appointments.getComplete(parseInt(appointmentId));
        const responseData = appointmentResponse.data;
        
        if (!responseData) {
          throw new Error('No appointment data received');
        }
        
        // Extract the relevant data from the complete appointment response
        const appointmentData = {
          AppointmentId: responseData.appointment.Id,
          Date: responseData.appointment.Date,
          TimeStart: responseData.appointment.TimeStart,
          TimeEnd: responseData.appointment.TimeEnd,
          CustomerId: responseData.appointment.CustomerId,
          ContactPerson: responseData.customer.Contactpersoon,
          CustomerName: responseData.customer.Naam,
          Status: responseData.status,
          Note: responseData.appointment.Note,
          Dogs: responseData.appointmentDogs.map((dog: any) => ({
            DogId: dog.DogId,
            DogName: dog.DogName,
            ServiceCount: dog.services?.length || 0,
            services: dog.services // Store the services for each dog
          }))
        };
        
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
          const statusesResponse = await endpoints.appointmentStatuses.getAll();
          const statusesData = statusesResponse.data;
          setStatuses(statusesData || []);
        } catch (statusError) {
          console.error('Error fetching statuses:', statusError);
          // Set a default status if fetch fails
          setStatuses([appointmentData.Status]);
        }
        
        // Fetch all dogs for this customer
        try {
          const customerDogsResponse = await endpoints.customers.getById(appointmentData.CustomerId);
          const customerData = customerDogsResponse.data;
          
          if (customerData && customerData.Dogs && Array.isArray(customerData.Dogs)) {
            // Format dogs to match our expected structure
            const formattedDogs = customerData.Dogs.map((dog: any) => ({
              DogId: dog.Id,
              DogName: dog.Name,
              Id: dog.Id,
              Name: dog.Name,
              CustomerId: dog.CustomerId
            }));
            setAvailableDogs(formattedDogs);
          } else {
            // Fallback to dogs from appointment
            setAvailableDogs(appointmentData.Dogs);
          }
        } catch (dogsError) {
          console.error('Error fetching customer dogs:', dogsError);
          // Use dogs from appointment if fetch fails
          setAvailableDogs(appointmentData.Dogs);
        }
        
        // Create a map of dog services from the original appointment
        const servicesMap = new Map();
        appointmentData.Dogs.forEach((dog: Dog) => {
          if (dog.services && dog.services.length > 0) {
            servicesMap.set(dog.DogId, dog.services);
          }
        });
        setDogServicesMap(servicesMap);
        
        // Fetch services
        try {
          const servicesResponse = await endpoints.services.getAll();
          setServices(servicesResponse.data || []);
        } catch (servicesError) {
          console.error('Error fetching services:', servicesError);
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

  // Add functions to handle service selection and price changes
  const handleServiceSelection = (dogId: number, serviceId: string, isSelected: boolean) => {
    setDogServicesMap(current => {
      const newMap = new Map(current);
      const dogServices = [...(newMap.get(dogId) || [])];
      
      if (isSelected) {
        // Find the service to get its standard price
        const serviceInfo = services.find(s => s.Id === serviceId);
        if (!serviceInfo) return current;
        
        // Add service with standard price
        dogServices.push({
          ServiceId: serviceId,
          Price: Number(serviceInfo.StandardPrice),
          ServiceName: serviceInfo.Name
        });
      } else {
        // Remove service
        const index = dogServices.findIndex(s => s.ServiceId === serviceId);
        if (index !== -1) {
          dogServices.splice(index, 1);
        }
      }
      
      newMap.set(dogId, dogServices);
      return newMap;
    });
  };
  
  const handleServicePriceChange = (dogId: number, serviceId: string, price: number) => {
    setDogServicesMap(current => {
      const newMap = new Map(current);
      const dogServices = [...(newMap.get(dogId) || [])];
      const index = dogServices.findIndex(s => s.ServiceId === serviceId);
      
      if (index !== -1) {
        dogServices[index] = {
          ...dogServices[index],
          Price: Number(price)
        };
      }
      
      newMap.set(dogId, dogServices);
      return newMap;
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
      
      // Create appointment data for the complete endpoint
      const appointmentData = {
        appointment: {
          Date: formattedDate,
          TimeStart: formattedStartTime,
          TimeEnd: formattedEndTime,
          DateEnd: formattedDate, // Assuming same day
          ActualDuration: 90, // Default duration in minutes
          CustomerId: appointment?.CustomerId,
          AppointmentStatusId: statusId,
          Note: notes
        },
        appointmentDogs: selectedDogIds.map(dogId => {
          // Get services for this dog from the map
          const services = dogServicesMap.get(dogId) || [];
          
          return {
            DogId: dogId,
            Note: '',
            services: services
          };
        })
      };
      
      // Update the appointment using the complete endpoint
      await endpoints.appointments.updateComplete(parseInt(appointmentId), appointmentData);
      
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
              {appointment.CustomerName ? (
                <div>
                  <div className="font-medium">{appointment.CustomerName}</div>
                  <div className="text-sm text-gray-600">{appointment.ContactPerson}</div>
                </div>
              ) : (
                appointment.ContactPerson
              )}
            </div>
          </div>
          
          {/* Appointment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center">
              {appointment && appointment.Status && (
                <div 
                  className="px-4 py-2 rounded-full text-white font-medium inline-block"
                  style={{ backgroundColor: appointment.Status.HexColor || appointment.Status.Color }}
                >
                  {appointment.Status.Label}
                </div>
              )}
            </div>
            <input type="hidden" name="statusId" value={statusId} />
            <p className="text-xs text-gray-500 mt-1">Status cannot be changed from this screen</p>
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
            <div className="grid grid-cols-1 gap-4">
              {availableDogs.map(dog => {
                const dogId = dog.Id || dog.DogId;
                // Get services for this dog from the map
                const dogServices = dogServicesMap.get(dogId) || [];
                const isSelected = selectedDogIds.includes(dogId);
                
                return (
                  <div 
                    key={dogId} 
                    className={`border rounded-md p-4 ${
                      isSelected 
                        ? 'border-primary-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDogSelection(dogId)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-900 font-medium">{dog.Name || dog.DogName}</span>
                    </div>
                    
                    {/* Services section - only show if dog is selected */}
                    {isSelected && (
                      <div className="mt-3 pl-6">
                        <h4 className="font-medium text-gray-700 mb-2">Services</h4>
                        <div className="space-y-3">
                          {services.map(service => {
                            const isServiceSelected = dogServices.some(s => s.ServiceId === service.Id);
                            const servicePrice = dogServices.find(s => s.ServiceId === service.Id)?.Price || service.StandardPrice;
                            
                            return (
                              <div key={service.Id} className="flex flex-col sm:flex-row sm:items-center">
                                <div className="flex items-center mb-2 sm:mb-0 sm:flex-1">
                                  <input
                                    type="checkbox"
                                    id={`service-${dogId}-${service.Id}`}
                                    checked={isServiceSelected}
                                    onChange={(e) => handleServiceSelection(dogId, service.Id, e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`service-${dogId}-${service.Id}`} className="ml-2 text-gray-700">
                                    {service.Name}
                                  </label>
                                </div>
                                
                                {isServiceSelected && (
                                  <div className="sm:w-32">
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-2">€</span>
                                      <input
                                        type="number"
                                        value={servicePrice}
                                        onChange={(e) => handleServicePriceChange(dogId, service.Id, parseFloat(e.target.value))}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        step="0.01"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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