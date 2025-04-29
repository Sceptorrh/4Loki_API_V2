import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { endpoints } from '@/lib/api';
import { format, setHours, setMinutes, parse, getDay } from 'date-fns';
import CustomerModal from '@/components/CustomerModal';
import DogModal from '@/components/DogModal';
import { getEstimatedDuration } from '@/lib/appointments';
import AppointmentHistory from '@/components/appointments/AppointmentHistory';
import CustomerSelection from '@/components/appointments/CustomerSelection';
import DogServiceSelection from '@/components/appointments/DogServiceSelection';
import AppointmentSchedule from '@/components/appointments/AppointmentSchedule';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Dog {
  Id: number;
  id: number;
  Name: string;
  name: string;
  DogName?: string;
  CustomerId: number;
  customerId: number;
  services: DogService[];
  ServiceNote?: string;
  serviceNote?: string;
}

interface DogService {
  ServiceId: string;
  Price: number;
  ServiceName?: string;
}

interface ServiceStat {
  ServiceId: string;
  count: number;
  prices: {
    price: number;
    date: string;
  }[];
  durations: {
    duration: number;
    date: string;
  }[];
  percentage: number;
}

interface CustomerDropdownItem {
  id: number;
  contactperson: string;
  dogs: {
    id: number;
    name: string;
  }[];
}

interface Service {
  Id: string;
  Name: string;
  StandardPrice: number;
  IsPriceAllowed: boolean;
  StandardDuration: number;
}

interface Status {
  id: string;
  label: string;
  order: number;
  color: string;
}

interface DailyAppointment {
  Id: number;
  CustomerId: number;
  CustomerName: string;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  StatusId: string;
  StatusLabel: string;
  ActualDuration: number;
  EstimatedDuration: number;
  Dogs: string[];
}

interface AppointmentFormProps {
  mode: 'new' | 'edit';
  appointmentId?: number;
  initialCustomerId?: number;
  initialDate?: Date;
  onSuccess?: () => void;
  returnTo?: string;
}

export default function AppointmentForm({ 
  mode, 
  appointmentId, 
  initialCustomerId, 
  initialDate,
  onSuccess,
  returnTo 
}: AppointmentFormProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(initialCustomerId || null);
  const [selectedDogIds, setSelectedDogIds] = useState<number[]>([]);
  const [dogServices, setDogServices] = useState<Record<number, DogService[]>>({});
  const [dogNotes, setDogNotes] = useState<Record<number, string>>({});
  const [appointmentDate, setAppointmentDate] = useState<Date>(initialDate ? new Date(initialDate) : new Date());
  const [startTime, setStartTime] = useState<Date>(setHours(setMinutes(new Date(), 0), 9));
  const [endTime, setEndTime] = useState<Date>(setHours(setMinutes(new Date(), 30), 10));
  const [statusId, setStatusId] = useState<string>('Pln');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [customerDogs, setCustomerDogs] = useState<Dog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDogModal, setShowDogModal] = useState(false);
  const [userAdjustedTime, setUserAdjustedTime] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dogServiceStats, setDogServiceStats] = useState<Record<number, ServiceStat[]>>({});
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
  const [appointmentsFetched, setAppointmentsFetched] = useState<boolean>(false);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers from dropdown endpoint
        const customersResponse = await endpoints.customers.getDropdown();
        setCustomers(customersResponse.data || []);
        
        // Fetch dogs
        const dogsResponse = await endpoints.dogs.getAll();
        const processedDogs = dogsResponse.data.map((dog: any) => ({
          Id: dog.Id || dog.id,
          id: dog.Id || dog.id,
          Name: dog.Name || dog.name,
          name: dog.Name || dog.name,
          DogName: dog.DogName,
          CustomerId: dog.CustomerId || dog.customerId,
          customerId: dog.CustomerId || dog.customerId,
          services: dog.services || [],
          ServiceNote: dog.ServiceNote || dog.serviceNote
        }));
        setDogs(processedDogs || []);
        
        // Fetch services
        const servicesResponse = await endpoints.services.getAll();
        setServices(servicesResponse.data || []);
        
        // Fetch appointment statuses
        const statusesResponse = await endpoints.appointmentStatuses.getAll();
        setStatuses(statusesResponse.data || []);
        
        // If in edit mode, fetch appointment data
        if (mode === 'edit' && appointmentId) {
          const appointmentResponse = await endpoints.appointments.getComplete(appointmentId);
          const responseData = appointmentResponse.data;
          
          if (responseData) {
            setSelectedCustomerId(responseData.appointment.CustomerId);
            setAppointmentDate(new Date(responseData.appointment.Date));
            setStartTime(parse(responseData.appointment.TimeStart, 'HH:mm:ss', new Date()));
            setEndTime(parse(responseData.appointment.TimeEnd, 'HH:mm:ss', new Date()));
            setStatusId(responseData.status.Id);
            setNotes(responseData.appointment.Note || '');
            
            // Set dogs and their services
            const dogsWithServices = responseData.appointmentDogs.map((dog: any) => ({
              DogId: dog.DogId,
              DogName: dog.DogName,
              services: dog.services || []
            }));
            
            setSelectedDogIds(dogsWithServices.map((dog: { DogId: number }) => dog.DogId));
            const servicesMap: Record<number, DogService[]> = {};
            dogsWithServices.forEach((dog: { DogId: number; services: DogService[] }) => {
              servicesMap[dog.DogId] = dog.services;
            });
            setDogServices(servicesMap);
            
            // Set warning banner for Inv status
            if (responseData.status.Id === 'Inv') {
              setWarningBanner('Warning: This appointment is already invoiced. Editing may affect your financial records.');
            }
          }
        }
        
        // If customer_id is provided, select that customer
        if (initialCustomerId) {
          const customerDogs = processedDogs.filter((dog: Dog) => 
            dog.CustomerId === initialCustomerId || dog.customerId === initialCustomerId
          );
          setCustomerDogs(customerDogs);
          setAvailableDogs(customerDogs);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again later.');
      }
    };
    
    fetchData();
  }, [mode, appointmentId, initialCustomerId]);

  // Update available dogs when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const customerDogs = dogs.filter(dog => {
        const dogId = dog.Id !== undefined ? dog.Id : dog.id;
        const customerId = dog.CustomerId !== undefined ? dog.CustomerId : dog.customerId;
        const hasValidName = dog.Name || dog.name || dog.DogName;
        return customerId === selectedCustomerId && dogId && hasValidName;
      });
      
      if (customerDogs.length === 0 && customers.length > 0) {
        const selectedCustomer = customers.find(
          (customer: CustomerDropdownItem) => customer.id === selectedCustomerId
        );
        
        if (selectedCustomer && selectedCustomer.dogs && selectedCustomer.dogs.length > 0) {
          const mappedDogs = selectedCustomer.dogs
            .filter(dog => dog && dog.id && dog.name)
            .map(dog => ({
              Id: dog.id,
              id: dog.id,
              Name: dog.name,
              name: dog.name,
              DogName: dog.DogName,
              CustomerId: selectedCustomerId,
              customerId: selectedCustomerId,
              services: [],
              ServiceNote: ''
            }));
          
          if (mappedDogs.length > 0) {
            console.log('AppointmentForm - Using dogs from dropdown:', mappedDogs);
            setAvailableDogs(mappedDogs);
            setCustomerDogs(mappedDogs);
            
            if (mappedDogs.length === 1) {
              setSelectedDogIds([mappedDogs[0].Id]);
            }
          } else {
            // No valid dogs found, set empty arrays
            console.log('AppointmentForm - No valid dogs found, setting empty lists');
            setAvailableDogs([]);
            setCustomerDogs([]);
            setSelectedDogIds([]);
          }
        } else {
          // Customer has no dogs, set empty arrays
          setAvailableDogs([]);
          setCustomerDogs([]);
          setSelectedDogIds([]);
        }
        return;
      }
      
      setAvailableDogs(customerDogs);
      setCustomerDogs(customerDogs);
    }
  }, [selectedCustomerId, dogs, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Validate required fields
      if (!selectedCustomerId) {
        setError('Please select a customer');
        setLoading(false);
        return;
      }
      
      if (!selectedDogIds.length) {
        setError('Please select at least one dog');
        setLoading(false);
        return;
      }
      
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      if (!selectedCustomer) {
        setError('Selected customer not found');
        setLoading(false);
        return;
      }

      // Ensure we have valid dates
      if (!appointmentDate || !startTime || !endTime) {
        setError('Please select valid appointment date and times');
        setLoading(false);
        return;
      }

      // Create dates with the correct appointment date
      const timeStart = new Date(appointmentDate);
      timeStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const timeEnd = new Date(appointmentDate);
      timeEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      // Format the appointment data
      const appointmentData = {
        Date: format(appointmentDate, 'yyyy-MM-dd'),
        TimeStart: format(timeStart, 'HH:mm'),
        TimeEnd: format(timeEnd, 'HH:mm'),
        DateEnd: format(appointmentDate, 'yyyy-MM-dd'),
        ActualDuration: Math.max(0, Math.round((timeEnd.getTime() - timeStart.getTime()) / 60000)),
        CustomerId: selectedCustomerId,
        AppointmentStatusId: statusId || 'Pln', // Default to 'Pln' if not set
        Note: notes || '',
        IsPaidInCash: false
      };

      // Debug logging
      console.log('Debug - Raw values:', {
        appointmentDate,
        startTime,
        endTime,
        selectedCustomerId,
        statusId
      });

      console.log('Debug - Formatted appointment data:', appointmentData);

      // Format the appointment dogs data
      const appointmentDogs = selectedDogIds.map(dogId => ({
        DogId: dogId,
        Note: dogNotes[dogId] || '',
        services: (dogServices[dogId] || []).map(service => ({
          ServiceId: service.ServiceId,
          Price: Number(service.Price)
        }))
      }));

      console.log('Debug - Request payload:', {
        appointment: appointmentData,
        appointmentDogs
      });

      let response;
      if (mode === 'new') {
        // Send the data in the format expected by the backend
        response = await endpoints.appointments.createComplete({
          appointment: {
            Date: appointmentData.Date,
            TimeStart: appointmentData.TimeStart,
            TimeEnd: appointmentData.TimeEnd,
            DateEnd: appointmentData.DateEnd,
            ActualDuration: appointmentData.ActualDuration,
            CustomerId: appointmentData.CustomerId,
            AppointmentStatusId: appointmentData.AppointmentStatusId,
            Note: appointmentData.Note,
            IsPaidInCash: appointmentData.IsPaidInCash
          },
          appointmentDogs: appointmentDogs.map(dog => ({
            DogId: dog.DogId,
            Note: dog.Note,
            services: dog.services.map(service => ({
              ServiceId: service.ServiceId,
              Price: service.Price
            }))
          }))
        });
      } else if (mode === 'edit' && appointmentId) {
        response = await endpoints.appointments.updateComplete(appointmentId, {
          appointment: {
            Date: appointmentData.Date,
            TimeStart: appointmentData.TimeStart,
            TimeEnd: appointmentData.TimeEnd,
            DateEnd: appointmentData.DateEnd,
            ActualDuration: appointmentData.ActualDuration,
            CustomerId: appointmentData.CustomerId,
            AppointmentStatusId: appointmentData.AppointmentStatusId,
            Note: appointmentData.Note,
            IsPaidInCash: appointmentData.IsPaidInCash
          },
          appointmentDogs: appointmentDogs.map(dog => ({
            DogId: dog.DogId,
            Note: dog.Note,
            services: dog.services.map(service => ({
              ServiceId: service.ServiceId,
              Price: service.Price
            }))
          }))
        });
      }

      if (response?.data) {
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        // Navigate back to the specified return path or default to appointments list
        router.push(returnTo || '/appointments');
      } else {
        setError('Failed to save appointment. Please try again.');
      }
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      console.log('Raw error response:', err.response?.data);
      
      // Handle validation errors from the backend
      if (err.response?.data) {
        try {
          // First try to get validation errors directly from the response
          let validationErrors;
          
          if (Array.isArray(err.response.data.validationErrors)) {
            validationErrors = err.response.data.validationErrors;
          } else if (err.response.data.message) {
            // Try to extract the array from the message string
            const match = err.response.data.message.match(/\[([\s\S]*)\]/);
            if (match) {
              // Clean up the string before parsing
              const cleanJson = match[1].replace(/\\n/g, '')
                                    .replace(/\\"/g, '"')
                                    .trim();
              console.log('Attempting to parse:', cleanJson);
              validationErrors = JSON.parse(`[${cleanJson}]`);
            } else {
              validationErrors = [{ field: 'general', message: err.response.data.message }];
            }
          } else {
            validationErrors = [{ field: 'general', message: 'Unknown validation error' }];
          }

          console.log('Parsed validation errors:', validationErrors);
          
          // Map field names to user-friendly labels and add debug info
          const fieldLabels: Record<string, string> = {
            Date: 'Appointment Date',
            TimeStart: 'Start Time',
            TimeEnd: 'End Time',
            DateEnd: 'End Date',
            ActualDuration: 'Duration',
            CustomerId: 'Customer',
            AppointmentStatusId: 'Status'
          };

          // Get the actual values that were sent for each field
          const fieldValues: Record<string, string> = {
            Date: format(appointmentDate, 'yyyy-MM-dd'),
            TimeStart: format(startTime, 'HH:mm'),
            TimeEnd: format(endTime, 'HH:mm'),
            DateEnd: format(appointmentDate, 'yyyy-MM-dd'),
            ActualDuration: Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000)).toString(),
            CustomerId: selectedCustomerId?.toString() || 'not set',
            AppointmentStatusId: statusId || 'not set'
          };

          console.log('Field values being sent:', fieldValues);
          
          const errorMessages = validationErrors.map((error: { field: string; message: string }) => {
            const fieldLabel = fieldLabels[error.field] || error.field;
            const actualValue = fieldValues[error.field];
            return {
              field: fieldLabel,
              message: error.message,
              value: actualValue
            };
          });
          
          setError(
            <div className="space-y-4">
              <p className="font-medium text-red-800">Please fix the following validation errors:</p>
              <div className="bg-white rounded-md shadow-sm border border-red-200 overflow-hidden">
                <table className="min-w-full divide-y divide-red-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-900">Field</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-900">Error</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-900">Current Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-200">
                    {errorMessages.map((error: { field: string; message: string; value: string }, index: number) => (
                      <tr key={index} className="text-sm hover:bg-red-50">
                        <td className="px-3 py-2 text-red-900 font-medium whitespace-nowrap">{error.field}</td>
                        <td className="px-3 py-2 text-red-700">{error.message}</td>
                        <td className="px-3 py-2 text-red-600 font-mono text-xs">
                          {error.value || <span className="text-red-400 italic">empty</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                <p className="font-medium">Debug Information:</p>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify({
                    rawData: {
                      appointmentDate: appointmentDate.toISOString(),
                      startTime: startTime.toISOString(),
                      endTime: endTime.toISOString(),
                      selectedCustomerId,
                      statusId
                    },
                    formattedData: {
                      Date: fieldValues.Date,
                      TimeStart: fieldValues.TimeStart,
                      TimeEnd: fieldValues.TimeEnd,
                      DateEnd: fieldValues.DateEnd,
                      ActualDuration: fieldValues.ActualDuration,
                      CustomerId: fieldValues.CustomerId,
                      AppointmentStatusId: fieldValues.AppointmentStatusId
                    },
                    rawError: err.response?.data
                  }, null, 2)}
                </pre>
              </div>
            </div>
          );
          return;
        } catch (parseError: any) {
          console.error('Error parsing validation errors:', parseError);
          setError(
            <div className="space-y-2">
              <p className="font-medium">An error occurred while processing the validation errors:</p>
              <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                Raw Error Response: {JSON.stringify(err.response?.data, null, 2)}
                {'\n\n'}
                Parse Error: {parseError.message}
              </pre>
            </div>
          );
        }
      } else {
        setError(
          <div className="space-y-2">
            <p>Failed to save appointment. Please try again.</p>
            <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
              {err.message || 'Unknown error'}
            </pre>
          </div>
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelection = (customer: null | { id: number; dogs: any[] }) => {
    console.log('AppointmentForm - handleCustomerSelection called with:', customer);
    
    if (customer && customer.id) {
      console.log('AppointmentForm - Setting customer ID:', customer.id);
      setSelectedCustomerId(customer.id);
      
      // Find the customer's dogs from the main dogs list
      const customerDogs = dogs.filter(dog => {
        const dogId = dog.Id !== undefined ? dog.Id : dog.id;
        const customerId = dog.CustomerId !== undefined ? dog.CustomerId : dog.customerId;
        const hasValidName = dog.Name || dog.name || dog.DogName;
        return customerId === customer.id && dogId && hasValidName;
      });
      
      console.log('AppointmentForm - Found dogs from main list:', customerDogs);
      
      // If no dogs found in the main list and customer has dogs in dropdown, use those
      if (customerDogs.length === 0 && customer.dogs && customer.dogs.length > 0) {
        const mappedDogs = customer.dogs
          .filter(dog => dog && dog.id && dog.name)
          .map(dog => ({
            Id: dog.id,
            id: dog.id,
            Name: dog.name,
            name: dog.name,
            CustomerId: customer.id,
            customerId: customer.id,
            services: [],
            ServiceNote: ''
          }));
        
        if (mappedDogs.length > 0) {
          console.log('AppointmentForm - Using dogs from dropdown:', mappedDogs);
          setAvailableDogs(mappedDogs);
          setCustomerDogs(mappedDogs);
          
          if (mappedDogs.length === 1) {
            setSelectedDogIds([mappedDogs[0].Id]);
          }
        } else {
          // No valid dogs found, set empty arrays
          console.log('AppointmentForm - No valid dogs found, setting empty lists');
          setAvailableDogs([]);
          setCustomerDogs([]);
          setSelectedDogIds([]);
        }
      } else if (customerDogs.length > 0) {
        // Only set dogs if we actually found some valid ones
        console.log('AppointmentForm - Using dogs from main list');
        setAvailableDogs(customerDogs);
        setCustomerDogs(customerDogs);
      } else {
        // No dogs found in either list, set empty arrays
        console.log('AppointmentForm - No dogs found, setting empty lists');
        setAvailableDogs([]);
        setCustomerDogs([]);
        setSelectedDogIds([]);
      }
      
      // Clear previous selections
      setSelectedDogIds([]);
      setDogServices({});
      setDogNotes({});
    } else {
      console.log('AppointmentForm - Clearing customer selection');
      // Clear everything if no customer selected
      setSelectedCustomerId(null);
      setAvailableDogs([]);
      setCustomerDogs([]);
      setSelectedDogIds([]);
      setDogServices({});
      setDogNotes({});
    }
  };

  // Add a useEffect to log state changes
  useEffect(() => {
    console.log('AppointmentForm - State updated:', {
      selectedCustomerId,
      customerDogsCount: customerDogs.length,
      availableDogsCount: availableDogs.length,
      selectedDogIds,
      customersCount: customers.length
    });
  }, [selectedCustomerId, customerDogs, availableDogs, selectedDogIds, customers]);

  const handleDogCreated = async (dogId: number, dogName: string) => {
    setShowDogModal(false);
    
    // Refresh dogs list
    const dogsResponse = await endpoints.dogs.getAll();
    const processedDogs = dogsResponse.data.map((dog: Dog) => ({
      Id: dog.Id,
      id: dog.Id,
      Name: dog.Name,
      name: dog.Name,
      DogName: dog.DogName,
      CustomerId: dog.CustomerId,
      customerId: dog.CustomerId,
      services: dog.services,
      ServiceNote: dog.ServiceNote || dog.serviceNote
    }));
    
    setDogs(processedDogs);
    
    // Update available dogs for the selected customer
    if (selectedCustomerId) {
      const customerDogs = processedDogs.filter((dog: Dog) => 
        dog.CustomerId === selectedCustomerId || dog.customerId === selectedCustomerId
      );
      setAvailableDogs(customerDogs);
      setCustomerDogs(customerDogs);
      
      // Auto-select the newly created dog
      setSelectedDogIds(prev => [...prev, dogId]);
    }
  };

  const handleCustomerCreated = async (customerId: number, customerName: string) => {
    setSelectedCustomerId(customerId);
    setShowCustomerModal(false);
    
    // Refresh customers list
    const customersResponse = await endpoints.customers.getDropdown();
    setCustomers(customersResponse.data || []);
  };

  const handleServiceStatsCalculated = (stats: Record<number, ServiceStat[]>) => {
    setDogServiceStats(stats);
  };

  const handleAppointmentsFetched = () => {
    setAppointmentsFetched(true);
  };

  const handleStartTimeChange = (time: Date) => {
    setStartTime(time);
    if (time && endTime) {
      const start = time;
      const end = endTime;
      if (end < start) {
        setEndTime(time);
      }
    }
  };

  const handleEndTimeChange = (time: Date) => {
    setEndTime(time);
  };

  const handleDogSelectionChanged = async () => {
    try {
      // Refresh dogs list
      const dogsResponse = await endpoints.dogs.getAll();
      const processedDogs = dogsResponse.data.map((dog: any) => ({
        Id: dog.Id || dog.id,
        id: dog.Id || dog.id,
        Name: dog.Name || dog.name,
        name: dog.Name || dog.name,
        DogName: dog.DogName,
        CustomerId: dog.CustomerId || dog.customerId,
        customerId: dog.CustomerId || dog.customerId,
        services: dog.services || [],
        ServiceNote: dog.ServiceNote || dog.serviceNote
      }));
      
      setDogs(processedDogs);
      
      // Update available dogs for the selected customer
      if (selectedCustomerId) {
        const customerDogs = processedDogs.filter((dog: Dog) => 
          dog.CustomerId === selectedCustomerId || dog.customerId === selectedCustomerId
        );
        setAvailableDogs(customerDogs);
        setCustomerDogs(customerDogs);
      }
    } catch (error) {
      console.error('Error refreshing dogs list:', error);
    }
  };

  // Function to filter out weekends
  const isWeekday = (date: Date) => {
    const day = getDay(date);
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'new' ? 'New Appointment' : 'Edit Appointment'}
          </h1>
          <div className="flex space-x-4">
            <Link href="/appointments" className="text-primary-600 hover:text-primary-900">
              Cancel
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
            {error}
          </div>
        )}

        {warningBanner && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mt-4">
            {warningBanner}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Left Column - Customer and Dog Selection */}
          <div className="lg:col-span-3 flex flex-col min-h-0 overflow-auto">
            <div className="space-y-4">
              <CustomerSelection
                selectedCustomerId={selectedCustomerId}
                customers={customers}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setSelectedCustomerId={setSelectedCustomerId}
                setShowCustomerModal={setShowCustomerModal}
                onCustomerSelected={handleCustomerSelection}
              />

              {/* Date Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Date
                </label>
                <div className="w-full">
                  <DatePicker
                    selected={appointmentDate}
                    onChange={(date: Date) => setAppointmentDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                    filterDate={isWeekday}
                    placeholderText="Select date"
                  />
                </div>
              </div>
              
              {selectedCustomerId && (
                <DogServiceSelection
                  selectedCustomerId={selectedCustomerId}
                  customerDogs={customerDogs}
                  selectedDogIds={selectedDogIds}
                  setSelectedDogIds={setSelectedDogIds}
                  dogServices={dogServices}
                  setDogServices={setDogServices}
                  dogNotes={dogNotes}
                  setDogNotes={setDogNotes}
                  dogServiceStats={dogServiceStats}
                  services={services}
                  setShowDogModal={setShowDogModal}
                  onDogSelectionChanged={handleDogSelectionChanged}
                />
              )}
            </div>
          </div>

          {/* Middle Column - Schedule */}
          <div className="lg:col-span-5 flex flex-col min-h-0">
            {selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0) && (
              <AppointmentSchedule
                appointmentDate={appointmentDate}
                setAppointmentDate={setAppointmentDate}
                startTime={startTime}
                setStartTime={handleStartTimeChange}
                endTime={endTime}
                setEndTime={handleEndTimeChange}
                dailyAppointments={dailyAppointments}
                setDailyAppointments={setDailyAppointments}
                selectedDogIds={selectedDogIds}
                totalDuration={getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services)}
                onAppointmentsFetched={handleAppointmentsFetched}
              />
            )}
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
            {selectedCustomerId && (
              <AppointmentHistory
                customerId={selectedCustomerId}
                appointmentDate={appointmentDate}
                onServiceStatsCalculated={handleServiceStatsCalculated}
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="py-4 flex justify-end border-t mt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (mode === 'new' ? 'Creating...' : 'Saving...') : (mode === 'new' ? 'Create Appointment' : 'Save Changes')}
          </button>
        </div>
      </form>

      {/* Modals */}
      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
      
      {showDogModal && selectedCustomerId && (
        <DogModal
          customerId={selectedCustomerId}
          onClose={() => setShowDogModal(false)}
          onDogCreated={handleDogCreated}
        />
      )}
    </div>
  );
} 