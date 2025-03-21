'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { endpoints } from '@/lib/api';
import "react-datepicker/dist/react-datepicker.css";
import { format, setHours, setMinutes } from 'date-fns';
import CustomerModal from '@/components/CustomerModal';
import DogModal from '@/components/DogModal';
import { getEstimatedDuration, autoScheduleAppointment } from '@/lib/appointments';
import AppointmentHistory from '@/components/appointments/AppointmentHistory';
import CustomerSelection from '@/components/appointments/CustomerSelection';
import DogServiceSelection from '@/components/appointments/DogServiceSelection';
import AppointmentSchedule from '@/components/appointments/AppointmentSchedule';

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

interface DogService {
  ServiceId: string;
  Price: number;
}

interface Dog {
  Id: number;
  Name?: string;
  CustomerId?: number;
  DogId?: number;
  DogName?: string;
  customerId?: number;
  id?: number;
  name?: string;
  services?: DogService[];
}

interface Status {
  id: string;
  label: string;
  order: number;
  color: string;
}

// New interface for daily appointments
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

// Interface for service statistics
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

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const dateParam = searchParams.get('date');
  
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customerId ? parseInt(customerId) : null);
  const [selectedDogIds, setSelectedDogIds] = useState<number[]>([]);
  const [dogServices, setDogServices] = useState<Record<number, DogService[]>>({});
  const [dogNotes, setDogNotes] = useState<Record<number, string>>({});
  const [appointmentDate, setAppointmentDate] = useState<Date>(dateParam ? new Date(dateParam) : new Date());
  const [startTime, setStartTime] = useState<Date>(setHours(setMinutes(new Date(), 0), 9)); // Default to 9:00
  const [endTime, setEndTime] = useState<Date>(setHours(setMinutes(new Date(), 30), 10)); // Default to 10:30
  const [statusId, setStatusId] = useState<string>('Pln');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerDogs, setCustomerDogs] = useState<Dog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDogModal, setShowDogModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dogServiceStats, setDogServiceStats] = useState<Record<number, ServiceStat[]>>({});
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragType, setDragType] = useState<'start' | 'end' | 'both' | null>(null);
  // Add state to track if auto-scheduling has already happened
  const [hasAutoScheduled, setHasAutoScheduled] = useState<boolean>(false);

  // Fetch customers, dogs, and statuses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers from dropdown endpoint
        const customersResponse = await endpoints.customers.getDropdown();
        console.log('Customer dropdown data:', customersResponse.data);
        setCustomers(customersResponse.data || []);
        
        // Fetch dogs
        const dogsResponse = await endpoints.dogs.getAll();
        console.log('Dog data:', dogsResponse.data);
        
        // Process dogs data to ensure consistent properties (Id/id, Name/name, etc.)
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
        console.log('Services data:', servicesResponse.data);
        setServices(servicesResponse.data || []);
        
        // If customer_id is provided in URL, select that customer
        if (customerId) {
          const parsedCustomerId = parseInt(customerId);
          setSelectedCustomerId(parsedCustomerId);
          
          // Filter dogs for this customer from the processed dogs array
          const customerDogs = processedDogs.filter((dog: Dog) => 
            dog.CustomerId === parsedCustomerId || dog.customerId === parsedCustomerId
          );
          
          console.log('Initial customer dogs from URL param:', customerDogs);
          setCustomerDogs(customerDogs);
          setAvailableDogs(customerDogs);
        }
        
        // Fetch appointment statuses
        try {
          const statusesResponse = await endpoints.appointmentStatuses.getAll();
          if (!statusesResponse.data) {
            throw new Error(`Status response has no data`);
          }
          const statusesData = statusesResponse.data;
          setStatuses(statusesData || []);
          
          // Set default status if available
          if (statusesData && statusesData.length > 0) {
            // Find the "Planned" status or use the first one
            const plannedStatus = statusesData.find((status: Status) => status.id === 'Pln') || statusesData[0];
            setStatusId('Pln');
          }
        } catch (statusError) {
          console.error('Error fetching statuses:', statusError);
          // Create a default status
          const defaultStatuses = [{
            id: 'Pln',
            label: 'Planned',
            order: 1,
            color: '#3498db'
          }];
          setStatuses(defaultStatuses);
          setStatusId('Pln');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again later.');
      }
    };
    
    fetchData();
  }, [customerId]);

  // Update available dogs when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      console.log("Customer selected, filtering dogs:", selectedCustomerId);
      console.log("Available dogs before filtering:", dogs);
      
      const customerDogs = dogs.filter(dog => {
        // Check both Id/id and CustomerId/customerId to handle any inconsistency
        const dogId = dog.Id !== undefined ? dog.Id : dog.id;
        const customerId = dog.CustomerId !== undefined ? dog.CustomerId : dog.customerId;
        
        return customerId === selectedCustomerId;
      });
      
      console.log("Filtered customer dogs:", customerDogs);
      
      // If no dogs found in the main dogs list, try to get them from the customers dropdown data
      if (customerDogs.length === 0 && customers.length > 0) {
        console.log("No dogs found in dogs array, checking customers dropdown data");
        
        const selectedCustomer = customers.find(
          (customer: CustomerDropdownItem) => customer.id === selectedCustomerId
        );
        
        if (selectedCustomer && selectedCustomer.dogs && selectedCustomer.dogs.length > 0) {
          console.log("Found dogs in customers dropdown data:", selectedCustomer.dogs);
          
          // Map the dogs from the customer dropdown data to our Dog format
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
          
          // Auto-select the dog if there's only one
          if (dogsFromDropdown.length === 1) {
            setSelectedDogIds([dogsFromDropdown[0].Id]);
          }
          
          return; // Exit early since we've handled the dogs from dropdown
        }
      }
      
      // Proceed with the dogs filtered from the main dogs array
      setAvailableDogs(customerDogs);
      setCustomerDogs(customerDogs);
      
      // Auto-select the dog if there's only one
      if (customerDogs.length === 1) {
        setSelectedDogIds([customerDogs[0].Id]);
      }
    } else {
      setAvailableDogs([]);
      setCustomerDogs([]);
      setSelectedDogIds([]);
    }
  }, [selectedCustomerId, dogs, customers]);

  // Function to handle clicking outside the dropdown
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false);
    }
  }
  
  // Add event listener for clicks outside dropdown
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-select dog when a customer with only one dog is selected
  useEffect(() => {
    if (selectedCustomerId && customerDogs.length === 1 && services.length > 0) {
      console.log("Customer has only one dog, auto-selecting it");
      const dogId = customerDogs[0].Id || customerDogs[0].id || 0;
      // Only select if not already selected
      if (!selectedDogIds.includes(dogId)) {
        console.log(`Auto-selecting dog ID ${dogId}`);
        // Initialize empty services array and notes for this dog
        setDogServices(current => ({
          ...current,
          [dogId]: []
        }));
        setDogNotes(current => ({
          ...current,
          [dogId]: ""
        }));
        setSelectedDogIds(prev => [...prev, dogId]);
      }
    }
  }, [customerDogs, selectedCustomerId, selectedDogIds, services]);

  // Auto-select services when dog service stats are updated
  useEffect(() => {
    console.log("Dog service stats updated, checking if we need to auto-select services");
    
    if (Object.keys(dogServiceStats).length > 0 && services.length > 0) {
      console.log("We have service stats and services list");
      
      // Process each selected dog
      selectedDogIds.forEach(dogId => {
        // Only apply auto-selection if dog services are empty
        if (dogServices[dogId]?.length === 0) {
          console.log(`Auto-selecting services for dog ID ${dogId}`);
          const stats = dogServiceStats[dogId];
          
          if (stats && stats.length > 0) {
            console.log(`Found stats for dog ID ${dogId}:`, stats);
            // Check services with usage more than 75%
            const frequentServices = stats.filter(stat => stat.percentage >= 75);
            console.log("Frequent services (>=75%):", frequentServices);
            
            if (frequentServices.length > 0) {
              // Auto-select frequent services
              const servicesToAdd: DogService[] = [];
              
              frequentServices.forEach(stat => {
                // Find the service
                const serviceInfo = services.find(s => s.Id === stat.ServiceId);
                if (!serviceInfo) {
                  console.log(`Service ID ${stat.ServiceId} not found in services list`);
                  return;
                }
                
                console.log(`Auto-selecting service ${serviceInfo.Name} with ID ${stat.ServiceId}`);
                
                // Select the service with the latest price (first in the sorted prices array)
                const latestPrice = stat.prices.length > 0 
                  ? stat.prices[0].price  // First price is the most recent
                  : serviceInfo.StandardPrice;
                
                console.log(`Using price: ${latestPrice}`);
                
                // Add to services to be added
                servicesToAdd.push({
                  ServiceId: stat.ServiceId,
                  Price: Number(latestPrice)
                });
              });
              
              // Update dog services all at once
              if (servicesToAdd.length > 0) {
                setDogServices(current => ({
                  ...current,
                  [dogId]: servicesToAdd
                }));
              }
            } else {
              // If no frequent services, select 'trimmen' by default
              const trimService = services.find(s => s.Name.toLowerCase().includes('trimmen'));
              if (trimService) {
                console.log(`No frequent services found, selecting default 'trimmen' service: ${trimService.Id}`);
                setDogServices(current => ({
                  ...current,
                  [dogId]: [{
                    ServiceId: trimService.Id,
                    Price: Number(trimService.StandardPrice)
                  }]
                }));
              } else {
                console.log("Could not find a trimmen service for default selection");
              }
            }
          } else {
            // If no stats, select 'trimmen' by default
            const trimService = services.find(s => s.Name.toLowerCase().includes('trimmen'));
            if (trimService) {
              console.log(`No stats found for dog, selecting default 'trimmen' service: ${trimService.Id}`);
              setDogServices(current => ({
                ...current,
                [dogId]: [{
                  ServiceId: trimService.Id,
                  Price: Number(trimService.StandardPrice)
                }]
              }));
            } else {
              console.log("Could not find a trimmen service for default selection");
            }
          }
        } else {
          console.log(`Dog ID ${dogId} already has services assigned, skipping auto-selection`);
        }
      });
    }
  }, [dogServiceStats, services]);

  // Update end time when selected services change
  useEffect(() => {
    // Skip calculations during dragging
    if (isDragging) {
      console.log('Skipping service duration calculation during drag');
      return;
    }
    
    // Only update if start time is already set and we have dogs and services selected
    if (startTime && selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0)) {
      if (dailyAppointments.length > 0) {
        console.log('Calculating service duration with existing appointments');
        const result = autoScheduleAppointment(
          dailyAppointments,
          selectedDogIds,
          dogServices,
          dogServiceStats,
          services,
          startTime
        );
        
        if (result) {
          setStartTime(result.startTime);
          setEndTime(result.endTime);
        }
      } else {
        console.log('Calculating service duration without existing appointments');
        const totalDuration = getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services);
        
        console.log(`Total calculated duration from getEstimatedDuration: ${totalDuration} minutes`);
        
        const newEndTime = new Date(startTime);
        newEndTime.setMinutes(startTime.getMinutes() + totalDuration);
        
        const lastPossibleTime = new Date(startTime);
        lastPossibleTime.setHours(21, 0, 0, 0);
        
        if (newEndTime > lastPossibleTime) {
          setEndTime(lastPossibleTime);
        } else {
          setEndTime(newEndTime);
        }
        
        console.log(`Setting end time to ${format(newEndTime, 'HH:mm')} based on duration of ${totalDuration} minutes`);
      }
    }
  }, [selectedDogIds, dogServices, startTime, dailyAppointments, isDragging]);

  // Calculate total price of all services
  const calculateTotalPrice = () => {
    let total = 0;
    
    selectedDogIds.forEach(dogId => {
      const services = dogServices[dogId] || [];
      services.forEach(service => {
        total += Number(service.Price);
      });
    });
    
    return total.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }
    
    if (selectedDogIds.length === 0) {
      setError('Please select at least one dog');
      return;
    }
    
    if (!statusId) {
      setError('Please select an appointment status');
      return;
    }
    
    // Check if each dog has at least one service
    const dogsWithoutServices = selectedDogIds.filter(dogId => 
      !dogServices[dogId] || dogServices[dogId].length === 0
    );
    
    if (dogsWithoutServices.length > 0) {
      const dogNames = customerDogs.filter(dog => dogsWithoutServices.includes(dog.Id || dog.id || 0)).map(dog => dog.Name || dog.name || `Dog #${dog.Id || dog.id || 0}`).join(', ');
      
      setError(`Please select at least one service for: ${dogNames}`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format date and times
      const formattedDate = format(appointmentDate, 'yyyy-MM-dd');
      const formattedStartTime = format(startTime, 'HH:mm');
      const formattedEndTime = format(endTime, 'HH:mm');
      
      // Calculate the duration in minutes
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      // Create appointment data
      const appointmentData = {
        appointment: {
          Date: formattedDate,
          TimeStart: formattedStartTime,
          TimeEnd: formattedEndTime,
          DateEnd: formattedDate, // Assuming same day
          ActualDuration: durationMinutes, // Calculated from selected times
          CustomerId: selectedCustomerId,
          AppointmentStatusId: statusId,
          AppointmentTypeId: "Grooming", // Fixed appointment type
          Note: notes
        },
        appointmentDogs: selectedDogIds.map(dogId => {
          // Ensure services have numeric prices
          const dogServicesList = dogServices[dogId] || [];
          const formattedServices = dogServicesList.map(service => ({
            ServiceId: service.ServiceId,
            Price: Number(service.Price)
          }));
          
          return {
            DogId: dogId,
            Note: dogNotes[dogId] || "",
            services: formattedServices
          };
        })
      };
      
      console.log('Creating appointment with data:', appointmentData);
      
      // Create the appointment
      const response = await endpoints.appointments.createComplete(appointmentData);
      
      // Redirect to the appointments page on success
      router.push('/appointments');
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreated = async (newCustomerId: number, customerName: string) => {
    // Refresh the customers list
    try {
      const customersResponse = await endpoints.customers.getDropdown();
      setCustomers(customersResponse.data || []);
      
      // Update dogs data as well to ensure everything is in sync
      const dogsResponse = await endpoints.dogs.getAll();
      setDogs(dogsResponse.data || []);
      
      // Select the newly created customer
      setSelectedCustomerId(newCustomerId);
      
      // Clear selected dogs since we're switching customers
      setSelectedDogIds([]);
      setCustomerDogs([]);
      setAvailableDogs([]);
    } catch (err) {
      console.error('Error refreshing customers after creation:', err);
    }
  };

  const handleDogCreated = async (newDogId: number, dogName: string) => {
    try {
      // Refresh the customers dropdown data to get the updated dog list
      const customersResponse = await endpoints.customers.getDropdown();
      setCustomers(customersResponse.data || []);
      
      // Update available dogs list
      const dogsResponse = await endpoints.dogs.getAll();
      setDogs(dogsResponse.data || []);
      
      // Find the newly created dog in the response
      const newDog = dogsResponse.data.find((dog: Dog) => dog.Id === newDogId || dog.id === newDogId);
      
      if (newDog && selectedCustomerId) {
        // Filter dogs by customer ID - consistent with our useEffect approach
        const customerDogs = dogsResponse.data.filter((dog: Dog) => 
          dog.CustomerId === selectedCustomerId || dog.customerId === selectedCustomerId
        );
        setCustomerDogs(customerDogs);
        setAvailableDogs(customerDogs);
        
        // Select the new dog
        setSelectedDogIds(prev => [...prev, newDogId]);
        // Initialize empty services and notes
        setDogServices(current => ({
          ...current,
          [newDogId]: []
        }));
        setDogNotes(current => ({
          ...current,
          [newDogId]: ""
        }));
      }
    } catch (err) {
      console.error('Error refreshing dogs after creation:', err);
    }
  };

  // Handle service stats calculation from AppointmentHistory component
  const handleServiceStatsCalculated = (stats: Record<number, ServiceStat[]>) => {
    setDogServiceStats(stats);
    console.log("Service stats calculated, triggering auto-selection logic");
    // Call handleAppointmentsFetched to potentially auto-select services
    // We reuse the same function since the logic is identical
    handleAppointmentsFetched();
  };
  
  // Function to handle when appointments are fetched
  const handleAppointmentsFetched = () => {
    console.log("Appointments fetched, checking if we need to auto-schedule");
    
    // Only recalculate if we have dogs/services selected and we're using the default start time (9:00)
    const isDefaultTime = startTime && startTime.getHours() === 9 && startTime.getMinutes() === 0;
    
    if (dailyAppointments.length > 0 && 
        selectedDogIds.length > 0 && 
        Object.values(dogServices).some(services => services.length > 0) &&
        isDefaultTime && 
        !isDragging) {
      console.log('Auto-scheduling based on appointments being fetched');
      const result = autoScheduleAppointment(
        dailyAppointments,
        selectedDogIds,
        dogServices,
        dogServiceStats,
        services,
        startTime
      );
      
      if (result) {
        setStartTime(result.startTime);
        setEndTime(result.endTime);
      }
    }
    
    // Check if we need to auto-select services for dogs
    if (selectedDogIds.length > 0 && Object.keys(dogServiceStats).length > 0) {
      console.log("Checking if dogs need services after appointments fetched");
      
      // Find dogs that don't have services yet
      const dogsNeedingServices = selectedDogIds.filter(dogId => 
        !dogServices[dogId] || dogServices[dogId].length === 0
      );
      
      if (dogsNeedingServices.length > 0) {
        console.log("Found dogs needing services:", dogsNeedingServices);
        
        dogsNeedingServices.forEach(dogId => {
          console.log(`Auto-selecting services for dog ID ${dogId}`);
          const stats = dogServiceStats[dogId];
          
          if (stats && stats.length > 0) {
            console.log(`Found stats for dog ID ${dogId}:`, stats);
            // Check services with usage more than 75%
            const frequentServices = stats.filter(stat => stat.percentage >= 75);
            console.log("Frequent services (>=75%):", frequentServices);
            
            if (frequentServices.length > 0) {
              // Auto-select frequent services
              const servicesToAdd: DogService[] = [];
              
              frequentServices.forEach(stat => {
                // Find the service
                const serviceInfo = services.find(s => s.Id === stat.ServiceId);
                if (!serviceInfo) {
                  console.log(`Service ID ${stat.ServiceId} not found in services list`);
                  return;
                }
                
                console.log(`Auto-selecting service ${serviceInfo.Name} with ID ${stat.ServiceId}`);
                
                // Select the service with the latest price (first in the sorted prices array)
                const latestPrice = stat.prices.length > 0 
                  ? stat.prices[0].price  // First price is the most recent
                  : serviceInfo.StandardPrice;
                
                console.log(`Using price: ${latestPrice}`);
                
                // Add to services to be added
                servicesToAdd.push({
                  ServiceId: stat.ServiceId,
                  Price: Number(latestPrice)
                });
              });
              
              // Update dog services all at once
              if (servicesToAdd.length > 0) {
                setDogServices(current => ({
                  ...current,
                  [dogId]: servicesToAdd
                }));
              }
            } else {
              // If no frequent services, select 'trimmen' by default
              const trimService = services.find(s => s.Name.toLowerCase().includes('trimmen'));
              if (trimService) {
                console.log(`No frequent services found, selecting default 'trimmen' service: ${trimService.Id}`);
                setDogServices(current => ({
                  ...current,
                  [dogId]: [{
                    ServiceId: trimService.Id,
                    Price: Number(trimService.StandardPrice)
                  }]
                }));
              } else {
                console.log("Could not find a trimmen service for default selection");
              }
            }
          } else {
            // If no stats, select 'trimmen' by default
            const trimService = services.find(s => s.Name.toLowerCase().includes('trimmen'));
            if (trimService) {
              console.log(`No stats found for dog, selecting default 'trimmen' service: ${trimService.Id}`);
              setDogServices(current => ({
                ...current,
                [dogId]: [{
                  ServiceId: trimService.Id,
                  Price: Number(trimService.StandardPrice)
                }]
              }));
            } else {
              console.log("Could not find a trimmen service for default selection");
            }
          }
        });
      }
    }
  };

  // Auto-schedule based on daily appointments - only when not dragging
  useEffect(() => {
    if (isDragging) return;
    console.log('Daily appointments changed, may need to auto-schedule');
    // Skip auto-scheduling here as it's now handled in handleAppointmentsFetched
  }, [dailyAppointments, isDragging]);

  // Auto-select services for dogs when dog service stats are updated or a new dog is selected
  useEffect(() => {
    console.log('Dog service stats or selectedDogIds changed');
    // Skip auto-selection of services here as it's now handled in handleAppointmentsFetched
  }, [dogServiceStats, selectedDogIds, services]);

  // Add debugging in useEffect
  useEffect(() => {
    console.log('Main page component mounted or updated');
    
    return () => {
      console.log('Main page component unmounting, cleaning up event listeners');
    };
  }, []);

  // Function to handle customer selection
  const handleCustomerSelection = (customer: null | { id: number; dogs: Dog[] }) => {
    console.log('handleCustomerSelection', customer);
    
    // Reset dog selections when customer changes
    setSelectedDogIds([]);
    setDogServices({});
    setDogNotes({});
    
    // Clear appointment info when customer changes
    // (removed setSelectedSlot as it doesn't exist)
    
    if (customer) {
      setSelectedCustomerId(customer.id);
      setCustomerDogs(customer.dogs);
      
      // If the customer has only one dog, select it automatically
      if (customer.dogs.length === 1) {
        const dogId = customer.dogs[0].Id || customer.dogs[0].id;
        if (dogId) {
          console.log(`Customer has only one dog (ID: ${dogId}), auto-selecting it`);
          setSelectedDogIds([dogId]);
          
          // Initialize empty services array
          setDogServices(current => ({
            ...current,
            [dogId]: []
          }));
          
          // Initialize empty note
          setDogNotes(current => ({
            ...current,
            [dogId]: ""
          }));
          
          // This will trigger our auto-selection of services after service stats are loaded
        }
      }
    } else {
      setSelectedCustomerId(null);
      setCustomerDogs([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Form Column */}
        <div className="lg:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <CustomerSelection
                  selectedCustomerId={selectedCustomerId}
                  customers={customers}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setSelectedCustomerId={setSelectedCustomerId}
                  setShowCustomerModal={setShowCustomerModal}
                  onCustomerSelected={handleCustomerSelection}
                />
              </div>
              
              {/* Appointment Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center">
                  <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    Planned
                  </div>
                  <input type="hidden" value="Pln" name="statusId" />
                </div>
                <p className="text-xs text-gray-500 mt-1">New appointments are always created with "Planned" status</p>
              </div>
            </div>
            
            {/* Dog and Service Selection */}
            {selectedCustomerId !== null && selectedCustomerId > 0 && (
              <DogServiceSelection
                selectedCustomerId={selectedCustomerId}
                customerDogs={customerDogs}
                selectedDogIds={selectedDogIds}
                dogServices={dogServices}
                dogServiceStats={dogServiceStats}
                dogNotes={dogNotes}
                services={services}
                setSelectedDogIds={setSelectedDogIds}
                setDogServices={setDogServices}
                setDogNotes={setDogNotes}
                setShowDogModal={setShowDogModal}
                onDogSelectionChanged={handleAppointmentsFetched}
              />
            )}

            {/* Date and Time Selection - Only shown when dogs and services are selected */}
            {selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0) && (
              <>
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
                
                {/* Summary */}
                {selectedDogIds.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Appointment Summary</h3>
                    
                    <div className="space-y-2">
                      {selectedDogIds.map(dogId => {
                        const dog = customerDogs.find(d => (d.Id || d.id) === dogId);
                        const dogServicesList = dogServices[dogId] || [];
                        let dogTotal = 0;
                        
                        dogServicesList.forEach(service => {
                          dogTotal += Number(service.Price);
                        });
                        
                        return (
                          <div key={dogId} className="border-b border-gray-200 pb-2">
                            <div className="font-medium">{dog?.Name || dog?.name || `Dog #${dogId}`}</div>
                            {dogServicesList.length > 0 ? (
                              <div className="pl-4 text-sm">
                                {dogServicesList.map(dogService => {
                                  // Find the service info from the global services array
                                  const serviceInfo = services.find(s => s.Id === dogService.ServiceId);
                                  return (
                                    <div key={dogService.ServiceId} className="flex justify-between">
                                      <span>{serviceInfo ? serviceInfo.Name : dogService.ServiceId}</span>
                                      <span>€{Number(dogService.Price).toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="pl-4 text-sm text-red-500">No services selected</div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total</span>
                        <span>€{calculateTotalPrice()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <AppointmentSchedule
                  appointmentDate={appointmentDate}
                  setAppointmentDate={setAppointmentDate}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  dailyAppointments={dailyAppointments}
                  setDailyAppointments={setDailyAppointments}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  dragType={dragType}
                  setDragType={setDragType}
                  selectedDogIds={selectedDogIds}
                  totalDuration={getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services)}
                  onAppointmentsFetched={handleAppointmentsFetched}
                />
              </>
            )}
            
            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </form>
        </div>

        {/* Past Appointments Column */}
        <div className="lg:w-1/3 mt-6 lg:mt-0">
          {selectedCustomerId ? (
            <AppointmentHistory 
              customerId={selectedCustomerId} 
              appointmentDate={appointmentDate}
              onServiceStatsCalculated={handleServiceStatsCalculated}
            />
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <p className="text-gray-500">Select a customer to view past appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Creation Modal */}
      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCustomerCreated={handleCustomerCreated}
          preFilledName={searchTerm}
        />
      )}

      {/* Dog Creation Modal */}
      {showDogModal && selectedCustomerId && (
        <DogModal
          onClose={() => setShowDogModal(false)}
          onDogCreated={handleDogCreated}
          customerId={selectedCustomerId}
        />
      )}
    </div>
  );
} 