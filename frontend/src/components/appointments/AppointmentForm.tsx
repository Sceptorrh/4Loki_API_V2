import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { endpoints } from '@/lib/api';
import { format, setHours, setMinutes, parse } from 'date-fns';
import CustomerModal from '@/components/CustomerModal';
import DogModal from '@/components/DogModal';
import { getEstimatedDuration } from '@/lib/appointments';
import AppointmentHistory from '@/components/appointments/AppointmentHistory';
import CustomerSelection from '@/components/appointments/CustomerSelection';
import DogServiceSelection from '@/components/appointments/DogServiceSelection';
import AppointmentSchedule from '@/components/appointments/AppointmentSchedule';

interface Dog {
  Id: number;
  id: number;
  Name: string;
  name: string;
  CustomerId: number;
  customerId: number;
  services: DogService[];
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
}

export default function AppointmentForm({ 
  mode, 
  appointmentId, 
  initialCustomerId, 
  initialDate,
  onSuccess 
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
          CustomerId: dog.CustomerId || dog.customerId,
          customerId: dog.CustomerId || dog.customerId,
          services: dog.services || []
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
        return customerId === selectedCustomerId;
      });
      
      if (customerDogs.length === 0 && customers.length > 0) {
        const selectedCustomer = customers.find(
          (customer: CustomerDropdownItem) => customer.id === selectedCustomerId
        );
        
        if (selectedCustomer && selectedCustomer.dogs && selectedCustomer.dogs.length > 0) {
          const dogsFromDropdown = selectedCustomer.dogs.map((dog: {id: number, name: string}) => ({
            Id: dog.id,
            id: dog.id,
            Name: dog.name,
            name: dog.name,
            CustomerId: selectedCustomerId,
            customerId: selectedCustomerId,
            services: []
          }));
          
          setAvailableDogs(dogsFromDropdown);
          setCustomerDogs(dogsFromDropdown);
          
          if (dogsFromDropdown.length === 1) {
            setSelectedDogIds([dogsFromDropdown[0].Id]);
          }
          return;
        }
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
        return;
      }
      
      if (!selectedDogIds.length) {
        setError('Please select at least one dog');
        return;
      }
      
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      if (!selectedCustomer) {
        setError('Selected customer not found');
        return;
      }

      // Format the appointment data
      const appointmentData = {
        Date: format(appointmentDate, 'yyyy-MM-dd'),
        TimeStart: format(startTime, 'HH:mm'),
        TimeEnd: format(endTime, 'HH:mm'),
        DateEnd: format(appointmentDate, 'yyyy-MM-dd'),
        ActualDuration: Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000)),
        CustomerId: Number(selectedCustomerId),
        AppointmentStatusId: statusId,
        Note: notes || '',
        IsPaidInCash: false
      };

      // Format the appointment dogs data
      const appointmentDogs = selectedDogIds.map(dogId => ({
        DogId: Number(dogId),
        Note: dogNotes[dogId] || '',
        services: (dogServices[dogId] || []).map(service => ({
          ServiceId: service.ServiceId,
          Price: Number(service.Price)
        }))
      }));

      let response;
      if (mode === 'new') {
        response = await endpoints.appointments.create({
          appointment: appointmentData,
          appointmentDogs
        });
      } else if (mode === 'edit' && appointmentId) {
        response = await endpoints.appointments.updateComplete(appointmentId, {
          appointment: appointmentData,
          appointmentDogs
        });
      }

      if (response?.data) {
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        // Navigate back to appointments list
        router.push('/appointments');
      } else {
        setError('Failed to save appointment. Please try again.');
      }
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      
      // Handle validation errors from the backend
      if (err.response?.data?.message?.includes('Validation failed')) {
        try {
          // Extract validation errors from the message
          const validationErrorsMatch = err.response.data.message.match(/\[(.*?)\]/);
          if (validationErrorsMatch) {
            const validationErrors = JSON.parse(validationErrorsMatch[1]);
            const errorMessages = validationErrors.map((error: { field: string; message: string }) => {
              // Map field names to user-friendly labels
              const fieldLabels: Record<string, string> = {
                Date: 'Appointment Date',
                TimeStart: 'Start Time',
                TimeEnd: 'End Time',
                DateEnd: 'End Date',
                ActualDuration: 'Duration',
                CustomerId: 'Customer',
                AppointmentStatusId: 'Status'
              };
              
              return `${fieldLabels[error.field] || error.field}: ${error.message}`;
            });
            
            setError(
              <div>
                <p className="font-medium mb-2">Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errorMessages.map((message: string, index: number) => (
                    <li key={index} className="text-sm">{message}</li>
                  ))}
                </ul>
              </div>
            );
            return;
          }
        } catch (parseError) {
          console.error('Error parsing validation errors:', parseError);
        }
      }
      
      setError('Failed to save appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelection = (customer: null | { id: number; dogs: Dog[] }) => {
    setSelectedCustomerId(customer?.id || null);
    setSelectedDogIds([]);
    setDogServices({});
    setDogNotes({});
    
    if (customer) {
      setAvailableDogs(customer.dogs);
      setCustomerDogs(customer.dogs);
    } else {
      setAvailableDogs([]);
      setCustomerDogs([]);
    }
  };

  const handleDogCreated = async (dogId: number, dogName: string) => {
    setShowDogModal(false);
    
    // Refresh dogs list
    const dogsResponse = await endpoints.dogs.getAll();
    const processedDogs = dogsResponse.data.map((dog: Dog) => ({
      Id: dog.Id,
      id: dog.Id,
      Name: dog.Name,
      name: dog.Name,
      CustomerId: dog.CustomerId,
      customerId: dog.CustomerId,
      services: dog.services
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

  const handleDogSelectionChanged = () => {
    // Implementation of handleDogSelectionChanged
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {warningBanner && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-6">
          {warningBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer and Dog Selection */}
          <div className="lg:col-span-1 space-y-6">
            <CustomerSelection
              selectedCustomerId={selectedCustomerId}
              customers={customers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setSelectedCustomerId={setSelectedCustomerId}
              setShowCustomerModal={setShowCustomerModal}
              onCustomerSelected={handleCustomerSelection}
            />
            
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

          {/* Right Column - Schedule and History */}
          <div className="lg:col-span-2">
            {selectedCustomerId && (
              <AppointmentHistory
                customerId={selectedCustomerId}
                appointmentDate={appointmentDate}
                onServiceStatsCalculated={handleServiceStatsCalculated}
              />
            )}

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
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
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