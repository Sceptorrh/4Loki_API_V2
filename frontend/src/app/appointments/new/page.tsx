'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addHours, setHours, setMinutes, getDay } from 'date-fns';
import CustomerModal from '@/components/CustomerModal';
import DogModal from '@/components/DogModal';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { getEstimatedDuration, calculateBestTimeSlot, generateTimeOptions, snapTo15Minutes, findOverlappingAppointments } from '@/lib/appointments';

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

// Interface for previous appointment data
interface PreviousAppointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  CustomerId: number;
  StatusLabel: string;
  ActualDuration: number;
  dogServices: {
    DogId: number;
    DogName: string;
    services: {
      ServiceId: string;
      ServiceName: string;
      Price: number;
    }[];
  }[];
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
  const [previousAppointments, setPreviousAppointments] = useState<PreviousAppointment[]>([]);
  const [dogServiceStats, setDogServiceStats] = useState<Record<number, ServiceStat[]>>({});
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
  const [overlappingAppointments, setOverlappingAppointments] = useState<DailyAppointment[]>([]);
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
        setDogs(dogsResponse.data || []);
        
        // Fetch services
        const servicesResponse = await endpoints.services.getAll();
        console.log('Services data:', servicesResponse.data);
        setServices(servicesResponse.data || []);
        
        // Convert dropdown dogs to the format needed for the app
        const allDogs: Dog[] = [];
        customersResponse.data.forEach((customer: CustomerDropdownItem) => {
          // Process each dog with explicit typing
          for (const dog of customer.dogs as {id: number, name: string}[]) {
            allDogs.push({
              Id: dog.id,
              id: dog.id,
              Name: dog.name,
              name: dog.name,
              CustomerId: customer.id,
              customerId: customer.id,
              services: []
            });
          }
        });
        setAvailableDogs(allDogs);
        
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
        
        // If customer_id is provided in URL, select that customer
        if (customerId) {
          const parsedCustomerId = parseInt(customerId);
          setSelectedCustomerId(parsedCustomerId);
          
          // Find customer in dropdown data
          const selectedCustomer = customersResponse.data.find(
            (customer: CustomerDropdownItem) => customer.id === parsedCustomerId
          );
          
          if (selectedCustomer) {
            // Use dogs from the dropdown data
            const customerDogs = selectedCustomer.dogs.map((dog: {id: number, name: string}) => ({
              Id: dog.id,
              id: dog.id,
              Name: dog.name,
              name: dog.name,
              CustomerId: parsedCustomerId,
              customerId: parsedCustomerId
            }));
            setCustomerDogs(customerDogs);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again later.');
      }
    };
    
    fetchData();
  }, [customerId]);

  // Fetch previous appointments when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      fetchPreviousAppointments(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Function to fetch previous appointments for a customer
  const fetchPreviousAppointments = async (customerId: number) => {
    try {
      const response = await endpoints.appointments.getByCustomerId(customerId);
      console.log('Previous appointments:', response.data);
      setPreviousAppointments(response.data || []);
      
      // Process appointment data to calculate service statistics
      if (response.data && response.data.length > 0) {
        calculateServiceStatistics(response.data);
      }
    } catch (err) {
      console.error('Error fetching previous appointments:', err);
    }
  };

  // Calculate service usage statistics for each dog
  const calculateServiceStatistics = (appointments: PreviousAppointment[]) => {
    const dogStats: Record<number, Record<string, ServiceStat>> = {};
    
    // Sort appointments by date (newest first)
    const sortedAppointments = [...appointments].sort((a, b) => {
      return new Date(b.Date).getTime() - new Date(a.Date).getTime();
    });
    
    // Process appointments
    sortedAppointments.forEach(appointment => {
      // Check if dogServices is available in the appointment data
      if (!appointment.dogServices || !Array.isArray(appointment.dogServices)) {
        console.warn(`Appointment ${appointment.Id} has no dogServices data`);
        return;
      }
      
      appointment.dogServices.forEach(dogService => {
        const dogId = dogService.DogId;
        
        // Initialize dog stats if not exists
        if (!dogStats[dogId]) {
          dogStats[dogId] = {};
        }
        
        // Check if services array exists and is not empty
        if (!dogService.services || !Array.isArray(dogService.services) || dogService.services.length === 0) {
          return;
        }
        
        // Count services
        dogService.services.forEach(service => {
          const serviceId = service.ServiceId;
          
          if (!dogStats[dogId][serviceId]) {
            dogStats[dogId][serviceId] = {
              ServiceId: serviceId,
              count: 0,
              prices: [],
              durations: [],
              percentage: 0
            };
          }
          
          // Increment service count
          dogStats[dogId][serviceId].count++;
          
          // Add price to history with date
          dogStats[dogId][serviceId].prices.push({
            price: Number(service.Price),
            date: appointment.Date
          });
          
          // Add duration to history with date if available
          if (appointment.ActualDuration) {
            dogStats[dogId][serviceId].durations.push({
              duration: Number(appointment.ActualDuration),
              date: appointment.Date
            });
          }
        });
      });
    });
    
    // Calculate percentages and ensure prices and durations are sorted by date (newest first)
    const dogServiceStats: Record<number, ServiceStat[]> = {};
    
    Object.entries(dogStats).forEach(([dogId, services]) => {
      const dogIdNum = parseInt(dogId);
      
      // Count all appointments for this dog
      let dogAppointmentCount = 0;
      appointments.forEach(appointment => {
        if (appointment.dogServices?.some(ds => ds.DogId === dogIdNum)) {
          dogAppointmentCount++;
        }
      });
      
      const serviceStats: ServiceStat[] = [];
      
      Object.values(services).forEach(stat => {
        // Ensure prices are sorted by date (newest first)
        stat.prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Ensure durations are sorted by date (newest first)
        stat.durations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Calculate percentage of appointments with this service for this dog
        stat.percentage = (stat.count / dogAppointmentCount) * 100;
        serviceStats.push(stat);
      });
      
      // Sort by percentage (highest first)
      serviceStats.sort((a, b) => b.percentage - a.percentage);
      
      dogServiceStats[dogIdNum] = serviceStats;
    });
    
    console.log('Dog service statistics:', dogServiceStats);
    setDogServiceStats(dogServiceStats);
  };

  // Update customer dogs when selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      // Find the selected customer in the dropdown data
      const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId);
      
      if (selectedCustomer) {
        // Use dogs from the dropdown data
        const customerDogs = selectedCustomer.dogs.map(dog => ({
          Id: dog.id,
          id: dog.id,
          Name: dog.name,
          name: dog.name,
          CustomerId: selectedCustomerId,
          customerId: selectedCustomerId
        }));
        setCustomerDogs(customerDogs);
      } else {
        // Fallback to filtering available dogs
        const filteredDogs = availableDogs.filter(dog => 
          dog.CustomerId === selectedCustomerId || 
          dog.customerId === selectedCustomerId
        );
        setCustomerDogs(filteredDogs);
      }
      
      setSelectedDogIds([]); // Reset selected dogs when customer changes
    } else {
      setCustomerDogs([]);
    }
  }, [selectedCustomerId, customers, availableDogs]);

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

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setDropdownOpen(false);
  };

  const handleDogSelection = (dogId: number) => {
    setSelectedDogIds(prev => {
      if (prev.includes(dogId)) {
        // Remove dog and its services
        setDogServices(current => {
          const updated = { ...current };
          delete updated[dogId];
          return updated;
        });
        // Remove dog notes
        setDogNotes(current => {
          const updated = { ...current };
          delete updated[dogId];
          return updated;
        });
        return prev.filter(id => id !== dogId);
      } else {
        // Add dog and initialize empty services array
        setDogServices(current => ({
          ...current,
          [dogId]: []
        }));
        // Initialize empty note
        setDogNotes(current => ({
          ...current,
          [dogId]: ""
        }));
        return [...prev, dogId];
      }
    });
  };

  const handleDogNoteChange = (dogId: number, note: string) => {
    setDogNotes(current => ({
      ...current,
      [dogId]: note
    }));
  };

  const handleServiceSelection = (dogId: number, serviceId: string, isSelected: boolean) => {
    setDogServices(current => {
      const dogServicesCopy = [...(current[dogId] || [])];
      
      if (isSelected) {
        // Find the service to get its standard price
        const serviceInfo = services.find(s => s.Id === serviceId);
        if (!serviceInfo) return current;
        
        // Add service with standard price
        dogServicesCopy.push({
          ServiceId: serviceId,
          Price: Number(serviceInfo.StandardPrice)
        });
        
        console.log(`Added service ${serviceId} with price ${serviceInfo.StandardPrice}`);
      } else {
        // Remove service
        const index = dogServicesCopy.findIndex(s => s.ServiceId === serviceId);
        if (index !== -1) {
          dogServicesCopy.splice(index, 1);
        }
      }
      
      return {
        ...current,
        [dogId]: dogServicesCopy
      };
    });
  };

  const handleServicePriceChange = (dogId: number, serviceId: string, price: number) => {
    console.log(`Updating price for dog ${dogId}, service ${serviceId} to ${price}`);
    
    setDogServices(current => {
      const dogServicesCopy = [...(current[dogId] || [])];
      const index = dogServicesCopy.findIndex(s => s.ServiceId === serviceId);
      
      if (index !== -1) {
        console.log(`Found service at index ${index}, current price: ${dogServicesCopy[index].Price}`);
        dogServicesCopy[index] = {
          ...dogServicesCopy[index],
          Price: Number(price)
        };
        console.log(`Updated price to: ${dogServicesCopy[index].Price}`);
      } else {
        console.log(`Service not found in dog's services`);
      }
      
      return {
        ...current,
        [dogId]: dogServicesCopy
      };
    });
  };

  // Auto-select dog and services when selected customer changes
  useEffect(() => {
    if (selectedCustomerId && customerDogs.length > 0 && services.length > 0) {
      // Auto-select if customer has only one dog
      if (customerDogs.length === 1) {
        const dogId = customerDogs[0].Id || customerDogs[0].id || 0;
        // Only select if not already selected
        if (!selectedDogIds.includes(dogId)) {
          handleDogSelection(dogId);
        }
      }
    }
  }, [customerDogs, selectedCustomerId, selectedDogIds, services]);

  // Auto-select services based on previous appointments
  useEffect(() => {
    if (selectedDogIds.length > 0 && Object.keys(dogServiceStats).length > 0 && services.length > 0) {
      selectedDogIds.forEach(dogId => {
        // Only apply auto-selection if dog services are empty
        if (dogServices[dogId]?.length === 0) {
          const stats = dogServiceStats[dogId];
          
          if (stats && stats.length > 0) {
            // Check services with usage more than 75%
            const frequentServices = stats.filter(stat => stat.percentage >= 75);
            
            if (frequentServices.length > 0) {
              // Auto-select frequent services
              frequentServices.forEach(stat => {
                // Find the service
                const serviceInfo = services.find(s => s.Id === stat.ServiceId);
                if (!serviceInfo) return;
                
                // Select the service with the latest price (first in the sorted prices array)
                const latestPrice = stat.prices.length > 0 
                  ? stat.prices[0].price  // First price is the most recent
                  : serviceInfo.StandardPrice;
                
                // Update dog services
                handleServiceSelection(dogId, stat.ServiceId, true);
                
                // Update price to the latest used price
                handleServicePriceChange(dogId, stat.ServiceId, latestPrice);
              });
            } else {
              // If no frequent services, select 'trimmen' by default
              const trimService = services.find(s => s.Name.toLowerCase().includes('trimmen'));
              if (trimService) {
                handleServiceSelection(dogId, trimService.Id, true);
              }
            }
          } else {
            // If no stats, select 'trimmen' by default
            const trimService = services.find(s => s.Name.toLowerCase().includes('trimmen'));
            if (trimService) {
              handleServiceSelection(dogId, trimService.Id, true);
            }
          }
        }
      });
    }
  }, [dogServiceStats, selectedDogIds, services, dogServices]);

  // Update end time when selected services change
  useEffect(() => {
    // Only update if start time is already set and we have dogs and services selected
    if (startTime && selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0)) {
      if (dailyAppointments.length > 0) {
        findBestTimeSlot();
      } else {
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
  }, [selectedDogIds, dogServices, startTime, dailyAppointments]);

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

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    
    // Check if customer name or contactperson matches search
    if (customer.contactperson.toLowerCase().includes(search)) return true;
    
    // Check if any dog name matches search
    return customer.dogs.some((dog: {id: number, name: string}) => 
      dog.name.toLowerCase().includes(search)
    );
  });

  // Function to filter out weekends
  const isWeekday = (date: Date) => {
    const day = getDay(date);
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
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
      
      // Select the newly created customer
      setSelectedCustomerId(newCustomerId);
      
      // Clear selected dogs since we're switching customers
      setSelectedDogIds([]);
      setCustomerDogs([]);
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
      
      if (newDog) {
        // Instead of adding to customer dogs directly, refresh the customer dogs list from updated customers data
        const selectedCustomer = customersResponse.data.find((customer: CustomerDropdownItem) => customer.id === selectedCustomerId);
        if (selectedCustomer) {
          const updatedCustomerDogs = selectedCustomer.dogs.map((dog: {id: number, name: string}) => ({
            Id: dog.id,
            id: dog.id,
            Name: dog.name,
            name: dog.name,
            CustomerId: selectedCustomerId as number,
            customerId: selectedCustomerId as number
          }));
          
          setCustomerDogs(updatedCustomerDogs);
        }
        
        // Select the new dog
        handleDogSelection(newDogId);
      }
    } catch (err) {
      console.error('Error refreshing dogs after creation:', err);
    }
  };

  // Modify the service rendering section to show percentage, price history, and duration history
  const renderServiceSelection = (dogId: number, service: Service) => {
    const isServiceSelected = dogServices[dogId]?.some(s => s.ServiceId === service.Id) || false;
    const servicePrice = dogServices[dogId]?.find(s => s.ServiceId === service.Id)?.Price || service.StandardPrice;
    
    // Get service statistics
    const stats = dogServiceStats[dogId]?.find(s => s.ServiceId === service.Id);
    const usagePercentage = stats ? Math.round(stats.percentage) : 0;
    const priceHistory = stats?.prices || [];
    const hasPriceHistory = priceHistory.length > 0;
    const averagePrice = hasPriceHistory 
      ? (priceHistory.reduce((sum, entry) => sum + entry.price, 0) / priceHistory.length).toFixed(2)
      : null;
    
    // The most recent price is the first in the sorted array
    const mostRecentPrice = hasPriceHistory ? priceHistory[0].price : null;
    const mostRecentDate = hasPriceHistory ? new Date(priceHistory[0].date).toLocaleDateString() : null;
    
    // Duration history
    const durationHistory = stats?.durations || [];
    const hasDurationHistory = durationHistory.length > 0;
    const averageDuration = hasDurationHistory 
      ? Math.round(durationHistory.reduce((sum, entry) => sum + entry.duration, 0) / durationHistory.length)
      : null;
    
    // The most recent duration is the first in the sorted array
    const mostRecentDuration = hasDurationHistory ? durationHistory[0].duration : null;
    
    return (
      <div key={service.Id} className="flex flex-col sm:flex-row sm:items-center mb-3">
        <div className="flex items-center mb-2 sm:mb-0 sm:flex-1">
          <input
            type="checkbox"
            id={`service-${dogId}-${service.Id}`}
            checked={isServiceSelected}
            onChange={(e) => handleServiceSelection(dogId, service.Id, e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor={`service-${dogId}-${service.Id}`} className="ml-2 text-gray-700 flex items-center">
            {service.Name}
            {usagePercentage > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                usagePercentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {usagePercentage}%
              </span>
            )}
          </label>
        </div>
        
        {isServiceSelected && (
          <div className="sm:w-40 flex items-center relative group">
            <span className="text-gray-500 mr-2">€</span>
            <div className="relative flex-grow">
              <input
                type="number"
                value={isNaN(Number(servicePrice)) ? 0 : Number(servicePrice)}
                onChange={(e) => {
                  const newPrice = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  handleServicePriceChange(dogId, service.Id, newPrice);
                }}
                className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                  hasPriceHistory || hasDurationHistory ? 'pr-7' : ''
                }`}
                step="0.01"
                min="0"
              />
              {(hasPriceHistory || hasDurationHistory) && (
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            {(hasPriceHistory || hasDurationHistory) && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white shadow-md border border-gray-200 rounded-md p-2 text-xs z-10 hidden group-hover:block">
                {hasPriceHistory && (
                  <div>
                    <div className="font-medium mb-1 text-sm border-b pb-1">Price History</div>
                    <div className="mb-1">
                      <span className="font-medium">Most recent:</span> €{mostRecentPrice !== null ? mostRecentPrice.toFixed(2) : '0.00'}
                      {mostRecentDate && <span className="text-gray-500 ml-1">({mostRecentDate})</span>}
                    </div>
                    {averagePrice && (
                      <div>
                        <span className="font-medium">Average:</span> €{averagePrice}
                      </div>
                    )}
                    {priceHistory.length > 1 && (
                      <div className="mt-1">
                        <span className="font-medium">Range:</span> €
                        {Math.min(...priceHistory.map(p => p.price)).toFixed(2)} - €
                        {Math.max(...priceHistory.map(p => p.price)).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                
                {hasDurationHistory && (
                  <div className={hasPriceHistory ? "mt-3" : ""}>
                    <div className="font-medium mb-1 text-sm border-b pb-1">Duration History</div>
                    <div className="mb-1">
                      <span className="font-medium">Most recent:</span> {mostRecentDuration !== null ? 
                        `${Math.floor(mostRecentDuration / 60)}h ${mostRecentDuration % 60}m` : 
                        'Not available'}
                    </div>
                    {averageDuration && (
                      <div>
                        <span className="font-medium">Average:</span> {Math.floor(averageDuration / 60)}h {averageDuration % 60}m
                      </div>
                    )}
                    {durationHistory.length > 1 && (
                      <div className="mt-1">
                        <span className="font-medium">Range:</span> {Math.floor(Math.min(...durationHistory.map(d => d.duration)) / 60)}h {Math.min(...durationHistory.map(d => d.duration)) % 60}m - 
                        {Math.floor(Math.max(...durationHistory.map(d => d.duration)) / 60)}h {Math.max(...durationHistory.map(d => d.duration)) % 60}m
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Function to render past appointments
  const renderPastAppointmentHistory = () => {
    if (!previousAppointments || previousAppointments.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No previous appointments found</p>
        </div>
      );
    }

    // Sort appointments by date (newest first)
    const sortedAppointments = [...previousAppointments].sort((a, b) => {
      return new Date(b.Date).getTime() - new Date(a.Date).getTime();
    });

    // Calculate days between new appointment and most recent appointment
    let daysSinceLastAppointment = null;
    if (sortedAppointments.length > 0) {
      const lastAppointmentDate = new Date(sortedAppointments[0].Date);
      const newAppointmentDate = appointmentDate;
      const diffTime = Math.abs(newAppointmentDate.getTime() - lastAppointmentDate.getTime());
      daysSinceLastAppointment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate intervals between appointments
    const appointmentsWithIntervals = sortedAppointments.map((appointment, index, array) => {
      let interval = null;
      if (index < array.length - 1) {
        const currentDate = new Date(appointment.Date);
        const prevDate = new Date(array[index + 1].Date);
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        interval = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
      }
      return { ...appointment, interval };
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Past Appointments</h3>
          {daysSinceLastAppointment !== null && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{daysSinceLastAppointment} days</span> since last visit
            </div>
          )}
        </div>
        <div className="max-h-[600px] overflow-y-auto pr-2">
          {appointmentsWithIntervals.map((appointment, index) => {
            // Calculate total price for this appointment
            let totalPrice = 0;
            
            appointment.dogServices?.forEach(dogService => {
              dogService.services?.forEach(service => {
                totalPrice += Number(service.Price || 0);
              });
            });

            // Format date and time
            const appointmentDate = new Date(appointment.Date);
            const formattedDate = appointmentDate.toLocaleDateString();
            
            return (
              <div key={appointment.Id} className="bg-white shadow-sm border rounded-md p-3 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{formattedDate}</div>
                  <div className="text-right">
                    <div className="font-medium text-primary-600">€{totalPrice.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {appointment.ActualDuration ? (
                        <>
                          {Math.floor(appointment.ActualDuration / 60)}h {appointment.ActualDuration % 60}m
                        </>
                      ) : (
                        'Duration not available'
                      )}
                    </div>
                  </div>
                </div>
                
                {appointment.dogServices && appointment.dogServices.length > 0 && (
                  <div className="mb-3">
                    {appointment.dogServices.map(dogService => (
                      <div key={dogService.DogId} className="ml-2 mb-2">
                        <div className="font-medium text-sm">{dogService.DogName}</div>
                        {dogService.services && dogService.services.length > 0 ? (
                          <ul className="pl-4 text-xs space-y-1">
                            {dogService.services.map(service => (
                              <li key={service.ServiceId} className="flex justify-between">
                                <span>{service.ServiceName}</span>
                                <span>€{Number(service.Price).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-gray-500 ml-4">No services</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {appointment.interval && (
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <span className="font-medium">Interval to previous:</span> {appointment.interval} days
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to calculate duration between two times in hours and minutes
  const calculateDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / 60000); // Convert to minutes
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Function to determine the feasibility of the appointment duration
  const getDurationFeasibility = (actualMinutes: number, estimatedMinutes: number): { color: string, label: string } => {
    const ratio = actualMinutes / estimatedMinutes;
    
    if (ratio >= 1.2) {
      // More than 20% extra time
      return { color: 'text-green-600', label: 'Comfortable' };
    } else if (ratio >= 0.95) {
      // Within 5% of estimated time
      return { color: 'text-gray-600', label: 'Realistic' };
    } else if (ratio >= 0.8) {
      // Within 20% under estimated time
      return { color: 'text-orange-500', label: 'Tight' };
    } else {
      // Less than 80% of estimated time
      return { color: 'text-red-600', label: 'Unrealistic' };
    }
  };

  // Update to fetch daily appointments when the date changes
  useEffect(() => {
    if (appointmentDate) {
      fetchDailyAppointments(appointmentDate);
    }
  }, [appointmentDate]);

  // Function to fetch appointments for the selected date
  const fetchDailyAppointments = async (date: Date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Fetching appointments for date:', formattedDate);
      const response = await endpoints.appointments.getByDate(formattedDate);
      console.log('Daily appointments API response:', response);
      
      // Process the response data to format it correctly for our UI
      const processedAppointments = response.data.map((appointment: any) => {
        // Extract dog names from dogServices
        console.log('Processing appointment:', appointment);
        const dogNames = appointment.dogServices?.map((dog: any) => dog.DogName) || [];
        
        return {
          Id: appointment.Id,
          CustomerId: appointment.CustomerId,
          CustomerName: appointment.CustomerName || "Unknown Customer",
          Date: appointment.Date,
          TimeStart: appointment.TimeStart,
          TimeEnd: appointment.TimeEnd,
          StatusId: appointment.StatusId,
          StatusLabel: appointment.StatusLabel,
          ActualDuration: appointment.ActualDuration || 0,
          EstimatedDuration: appointment.EstimatedDuration || appointment.ActualDuration || 60,
          Dogs: dogNames
        };
      });
      
      console.log('Processed appointments for UI:', processedAppointments);
      setDailyAppointments(processedAppointments || []);
      
      // Only auto-schedule if:
      // 1. It hasn't been done before
      // 2. We're not currently dragging
      // 3. The current time is the default time (9:00)
      if (!hasAutoScheduled && !isDragging) {
        const currentHour = startTime.getHours();
        const currentMinute = startTime.getMinutes();
        
        // Only auto-schedule if we're at the default time (9:00)
        if (currentHour === 9 && currentMinute === 0) {
          // Auto-schedule if we have services selected
          if (selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0)) {
            findBestTimeSlot(processedAppointments);
            setHasAutoScheduled(true);
          }
          // Otherwise only schedule if it's the default time
          else {
            // Set a default of 60 minutes since no services are selected
            const defaultTime = calculateBestTimeSlot(processedAppointments, 60);
            setStartTime(defaultTime);
            
            // Set default end time 60 minutes later
            const defaultEndTime = new Date(defaultTime);
            defaultEndTime.setMinutes(defaultTime.getMinutes() + 60);
            
            // Make sure the end time is within limits
            const lastPossibleTime = new Date(defaultTime);
            lastPossibleTime.setHours(21, 0, 0, 0);
            
            if (defaultEndTime > lastPossibleTime) {
              setEndTime(lastPossibleTime);
            } else {
              setEndTime(defaultEndTime);
            }
            setHasAutoScheduled(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching daily appointments:', err);
      setDailyAppointments([]);
    }
  };

  // Add a useEffect to update the schedule whenever the dailyAppointments change
  useEffect(() => {
    // Only recalculate if:
    // 1. We have appointments data
    // 2. We have dogs/services selected
    // 3. We're not currently dragging
    // 4. We're at the default time (9:00)
    if (dailyAppointments.length > 0 && 
        selectedDogIds.length > 0 && 
        Object.values(dogServices).some(services => services.length > 0) &&
        !isDragging) {
      const currentHour = startTime.getHours();
      const currentMinute = startTime.getMinutes();
      
      if (currentHour === 9 && currentMinute === 0) {
        findBestTimeSlot();
      }
    }
  }, [dailyAppointments]);

  // Function to calculate the best time slot for a new appointment
  const findBestTimeSlot = (appointments = dailyAppointments, force = false) => {
    console.log('Finding best time slot based on existing appointments, dragging:', isDragging);
    
    // Don't auto-schedule if we're dragging, unless forced
    if (isDragging && !force) {
      console.log('Skipping auto-scheduling while dragging');
      return;
    }
    
    // Calculate estimated duration based on selected services
    const estimatedDuration = selectedDogIds.length > 0 ? getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services) : 60;
    
    // Find best start time
    const bestStartTime = calculateBestTimeSlot(appointments, estimatedDuration);
    console.log(`Best start time found: ${format(bestStartTime, 'HH:mm')}`);
    
    // Update start time
    setStartTime(bestStartTime);
    
    // Update end time based on the new start time
    const newEndTime = new Date(bestStartTime);
    newEndTime.setMinutes(bestStartTime.getMinutes() + estimatedDuration);
    
    // Make sure the end time is within limits
    const lastPossibleTime = new Date(bestStartTime);
    lastPossibleTime.setHours(21, 0, 0, 0);
    
    if (newEndTime > lastPossibleTime) {
      setEndTime(lastPossibleTime);
    } else {
      setEndTime(newEndTime);
    }
    
    console.log(`Setting times to ${format(bestStartTime, 'HH:mm')} - ${format(newEndTime, 'HH:mm')} based on estimated duration of ${estimatedDuration} minutes`);
    
    // Check for overlaps
    const overlaps = findOverlappingAppointments(appointments, bestStartTime, newEndTime);
    setOverlappingAppointments(overlaps);
  };

  // Function to render the day-view calendar
  const renderDayCalendar = () => {
    console.log('Rendering day calendar with appointments:', dailyAppointments);
    // Set up time slots from 8:00 to 21:00 in 15-minute intervals
    const timeSlots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 21 && minute > 0) continue; // Don't go past 21:00
        
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        timeSlots.push(time);
      }
    }

    // Function to get appointment display color based on duration feasibility
    const getAppointmentColor = (appointment: DailyAppointment) => {
      console.log('Getting color for appointment:', appointment.Id, 'ActualDuration:', appointment.ActualDuration, 'EstimatedDuration:', appointment.EstimatedDuration);
      
      if (!appointment.ActualDuration || !appointment.EstimatedDuration) {
        return 'bg-gray-100 border-gray-300';
      }
      
      const ratio = appointment.ActualDuration / appointment.EstimatedDuration;
      console.log('Duration ratio:', ratio);
      
      if (ratio >= 1.2) {
        return 'bg-green-100 border-green-300';
      } 
      if (ratio >= 0.95) {
        return 'bg-gray-100 border-gray-300';
      } 
      if (ratio >= 0.8) {
        return 'bg-orange-100 border-orange-300';
      }
      return 'bg-red-100 border-red-300';
    };
    
    // Preprocess appointments to calculate positions
    const processedAppointments = dailyAppointments.map(appointment => {
      // Parse start and end times
      const [startHours, startMinutes] = appointment.TimeStart.split(':').map(Number);
      const [endHours, endMinutes] = appointment.TimeEnd.split(':').map(Number);
      
      // Convert to minutes from 8:00 AM for calculation
      const startMinutesFromMidnight = startHours * 60 + startMinutes;
      const endMinutesFromMidnight = endHours * 60 + endMinutes;
      
      // Calculate grid positions
      const startPosition = (startMinutesFromMidnight - 8 * 60) / 15; // Each position is 15 minutes
      const endPosition = (endMinutesFromMidnight - 8 * 60) / 15;
      const duration = (endMinutesFromMidnight - startMinutesFromMidnight) / 15; // In 15-min slots
      
      return {
        ...appointment,
        startPosition,
        endPosition,
        duration
      };
    });

    // Calculate current appointment position for highlight
    let currentApptInfo: { startPosition: number; endPosition: number; duration: number } | null = null;
    if (startTime && endTime) {
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      
      const startMinutesFromMidnight = startHour * 60 + startMinute;
      const endMinutesFromMidnight = endHour * 60 + endMinute;
      
      const startPosition = (startMinutesFromMidnight - 8 * 60) / 15;
      const endPosition = (endMinutesFromMidnight - 8 * 60) / 15;
      const duration = (endMinutesFromMidnight - startMinutesFromMidnight) / 15;
      
      currentApptInfo = {
        startPosition,
        endPosition,
        duration
      };
    }
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Appointments for {format(appointmentDate, 'EEEE, MMMM d, yyyy')}
          {dailyAppointments.length > 0 && 
            <span className="text-sm text-gray-500 ml-2">({dailyAppointments.length} appointments)</span>
          }
        </h3>

        {/* Show warning if there's an overlap */}
        {overlappingAppointments.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-3">
            <div className="font-bold">Warning: Appointment Overlap Detected</div>
            <p>Your selected time slot overlaps with {overlappingAppointments.length} existing appointment(s):</p>
            <ul className="ml-5 list-disc">
              {overlappingAppointments.map(appt => (
                <li key={appt.Id}>
                  {appt.CustomerName} ({appt.TimeStart.substring(0, 5)}-{appt.TimeEnd.substring(0, 5)}) - {appt.Dogs.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {dailyAppointments.length === 0 && !currentApptInfo ? (
          <p className="text-gray-500 text-center py-4 border rounded-md">No appointments scheduled for this date</p>
        ) : (
          <div 
            id="calendar-container"
            className="border rounded-md overflow-hidden calendar-container relative" 
            style={{ minHeight: `${timeSlots.length * 20}px` }}
            onClick={(e) => {
              // Only handle clicks directly on the calendar background, not appointments
              if (e.currentTarget === e.target || 
                  (e.target as HTMLElement).classList.contains('time-slot-area')) {
                handleTimeSlotClick(e);
              }
            }}
          >
            {/* Time slots background */}
            {timeSlots.map((timeSlot, index) => {
              const formattedTime = format(timeSlot, 'HH:mm');
              const isLastSlot = index === timeSlots.length - 1;
              const show30MinLabel = timeSlot.getMinutes() === 0 || timeSlot.getMinutes() === 30;
              
              return (
                <div 
                  key={index} 
                  className={`flex border-b last:border-b-0 relative h-[20px] ${
                    timeSlot.getMinutes() === 0 ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`w-16 ${show30MinLabel ? 'p-1 border-r bg-gray-50 text-xs font-medium text-gray-700' : 'border-r'}`}>
                    {show30MinLabel ? formattedTime : ''}
                  </div>
                  <div 
                    className="flex-grow relative time-slot-area"
                  ></div>
                </div>
              );
            })}
            
            {/* Add absolute positioned appointments */}
            {processedAppointments.map(appointment => {
              const color = getAppointmentColor(appointment);
              const topPosition = appointment.startPosition * 20; // Each slot is 20px high
              const height = Math.max(appointment.duration * 20, 20); // Minimum height of 20px
              
              return (
                <div 
                  key={appointment.Id}
                  className={`${color} border rounded-sm text-xs absolute left-[70px] right-4 p-1 z-10 existing-appointment`}
                  style={{ 
                    top: `${topPosition}px`,
                    height: `${height}px`,
                    pointerEvents: 'all'
                  }}
                >
                  <div className="font-medium truncate">{appointment.CustomerName}</div>
                  <div className="flex justify-between">
                    <span className="truncate">{appointment.Dogs.join(', ')}</span>
                    <span>{appointment.TimeStart.substring(0, 5)}-{appointment.TimeEnd.substring(0, 5)}</span>
                  </div>
                </div>
              );
            })}
            
            {/* Current appointment selection */}
            {currentApptInfo && (
              <div 
                className="absolute bg-blue-100 border-2 border-blue-400 rounded-sm z-20 left-[70px] right-4 current-appointment"
                style={{ 
                  top: `${currentApptInfo.startPosition * 20}px`,
                  height: `${Math.max(currentApptInfo.duration * 20, 20)}px`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => {
                  // Don't handle if clicked on one of the handles
                  if ((e.target as HTMLElement).classList.contains('current-appointment-handle-start') ||
                      (e.target as HTMLElement).classList.contains('current-appointment-handle-end')) {
                    return;
                  }
                  handleAppointmentMouseDown(e, 'both');
                }}
                onTouchStart={(e) => {
                  // Don't handle if touched on one of the handles
                  if ((e.target as HTMLElement).classList.contains('current-appointment-handle-start') ||
                      (e.target as HTMLElement).classList.contains('current-appointment-handle-end')) {
                    return;
                  }
                  handleAppointmentTouchStart(e, 'both');
                }}
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-5 bg-blue-400 cursor-ns-resize z-30 current-appointment-handle-start"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAppointmentMouseDown(e, 'start');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleAppointmentTouchStart(e, 'start');
                  }}
                  title="Drag to adjust start time"
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 h-5 bg-blue-400 cursor-ns-resize z-30 current-appointment-handle-end"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAppointmentMouseDown(e, 'end');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleAppointmentTouchStart(e, 'end');
                  }}
                  title="Drag to adjust end time"
                />
                <div className="text-xs p-1 text-blue-800 flex justify-between font-medium mt-6">
                  <span>{format(startTime, 'HH:mm')}-{format(endTime, 'HH:mm')}</span>
                  <span>{Math.floor((endTime.getTime() - startTime.getTime()) / 60000)} min</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center justify-end text-xs space-x-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded-sm mr-1"></span>
            <span>Comfortable</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-gray-100 border border-gray-300 rounded-sm mr-1"></span>
            <span>Realistic</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-orange-100 border border-orange-300 rounded-sm mr-1"></span>
            <span>Tight</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded-sm mr-1"></span>
            <span>Unrealistic</span>
          </div>
        </div>
      </div>
    );
  };

  // Function to check if an appointment overlaps with a time slot
  const getAppointmentsForTimeSlot = (timeSlot: Date) => {
    const timeSlotEnd = new Date(timeSlot);
    timeSlotEnd.setMinutes(timeSlotEnd.getMinutes() + 15); // Changed from 30 to 15 to match new interval
    
    return dailyAppointments.filter(appointment => {
      if (!appointment.TimeStart || !appointment.TimeEnd) {
        return false;
      }
      
      // Parse TimeStart properly
      const [startHours, startMinutes] = appointment.TimeStart.split(':').map(Number);
      // Parse TimeEnd properly
      const [endHours, endMinutes] = appointment.TimeEnd.split(':').map(Number);
      
      const apptDate = appointmentDate.toDateString();
      const apptStart = new Date(apptDate);
      apptStart.setHours(startHours, startMinutes, 0, 0);
      
      const apptEnd = new Date(apptDate);
      apptEnd.setHours(endHours, endMinutes, 0, 0);
      
      const isOverlapping = (apptStart < timeSlotEnd && apptEnd > timeSlot);
      const startsAtTimeSlot = format(apptStart, 'HH:mm') === format(timeSlot, 'HH:mm');
      
      return isOverlapping || startsAtTimeSlot;
    });
  };

  // Check for overlaps whenever start or end time changes
  useEffect(() => {
    if (startTime && endTime && dailyAppointments.length > 0) {
      const overlaps = findOverlappingAppointments(dailyAppointments, startTime, endTime);
      setOverlappingAppointments(overlaps);
    } else {
      setOverlappingAppointments([]);
    }
  }, [startTime, endTime, dailyAppointments]);

  // Function to check if the current appointment overlaps with existing appointments
  const checkForOverlappingAppointments = () => {
    if (!startTime || !endTime || dailyAppointments.length === 0) {
      setOverlappingAppointments([]);
      return;
    }

    const currentStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const currentEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const overlaps = dailyAppointments.filter(appt => {
      const [startHours, startMins] = appt.TimeStart.split(':').map(Number);
      const [endHours, endMins] = appt.TimeEnd.split(':').map(Number);
      
      const existingStartMinutes = startHours * 60 + startMins;
      const existingEndMinutes = endHours * 60 + endMins;

      // Check for overlap: Current start is before existing end AND current end is after existing start
      return (currentStartMinutes < existingEndMinutes && currentEndMinutes > existingStartMinutes);
    });

    setOverlappingAppointments(overlaps);
  };

  // Function to snap a time to the nearest 15-minute interval
  const snapTo15Minutes = (time: Date): Date => {
    const minutes = time.getMinutes();
    const snappedMinutes = Math.round(minutes / 15) * 15;
    const newTime = new Date(time);
    newTime.setMinutes(snappedMinutes);
    return newTime;
  };

  // Function to handle clicking on a time slot
  const handleTimeSlotClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get the calendar container
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    
    // Get calendar bounds
    const rect = calendarContainer.getBoundingClientRect();
    
    // Calculate relative position within calendar
    const relativeY = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 1));
    
    // Calculate which time slot this corresponds to (15 min slots, 20px height each)
    const slotIndex = Math.floor(relativeY / 20);
    
    // Convert to time (starting from 8:00 AM)
    const hours = Math.floor(slotIndex / 4) + 8;
    const minutes = (slotIndex % 4) * 15;
    
    // Create a new date object for the time
    const newTime = new Date(appointmentDate);
    newTime.setHours(hours, minutes, 0, 0);
    
    // Don't allow times outside 8:00-21:00
    if (hours < 8 || hours > 21 || (hours === 21 && minutes > 0)) {
      return;
    }
    
    // Capture the current appointment duration
    const durationMs = endTime.getTime() - startTime.getTime();
    
    // Set the start time to this slot
    setStartTime(newTime);
    
    // Set the end time based on the duration
    const newEndTime = new Date(newTime.getTime() + durationMs);
    
    // Ensure end time is within limits
    const lastPossibleTime = new Date(appointmentDate);
    lastPossibleTime.setHours(21, 0, 0, 0);
    
    if (newEndTime > lastPossibleTime) {
      setEndTime(lastPossibleTime);
    } else {
      setEndTime(newEndTime);
    }
    
    // Check for overlaps
    setTimeout(() => checkForOverlappingAppointments(), 0);
  };

  // Completely reworked mouse handler for appointment dragging
  const handleAppointmentMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'both') => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Mouse down event triggered');
    
    // Set dragging state
    setIsDragging(true);
    setDragType(type);
    
    // Store initial mouse position
    const initialMouseY = e.clientY;
    
    // Store initial appointment times
    const initialStartTime = new Date(startTime);
    const initialEndTime = new Date(endTime);
    
    // Calculate initial position and height
    const initialStartMinutes = initialStartTime.getHours() * 60 + initialStartTime.getMinutes();
    const initialEndMinutes = initialEndTime.getHours() * 60 + initialEndTime.getMinutes();
    
    // Add a global drag state to the window object to ensure we maintain context
    const dragState = {
      initialMouseY,
      initialStartTime: new Date(initialStartTime),
      initialEndTime: new Date(initialEndTime),
      dragging: true,
      type
    };
    
    (window as any).currentDragState = dragState;
    
    // Create and show ghost element
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    
    // Remove any existing ghost
    const existingGhost = document.getElementById('appointment-ghost');
    if (existingGhost) {
      existingGhost.remove();
    }
    
    // Create ghost element
    const ghost = document.createElement('div');
    ghost.id = 'appointment-ghost';
    ghost.style.position = 'absolute';
    ghost.style.left = '70px';
    ghost.style.right = '4px';
    ghost.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    ghost.style.border = '3px solid red';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.padding = '5px';
    ghost.style.color = 'white';
    ghost.style.fontWeight = 'bold';
    ghost.style.fontSize = '14px';
    ghost.style.textAlign = 'center';
    ghost.style.boxShadow = '0 0 15px red';
    
    // Initial position
    const startPos = (initialStartMinutes - 8 * 60) / 15 * 20;
    const endPos = (initialEndMinutes - 8 * 60) / 15 * 20;
    ghost.style.top = startPos + 'px';
    ghost.style.height = (endPos - startPos) + 'px';
    ghost.innerHTML = `${format(initialStartTime, 'HH:mm')} - ${format(initialEndTime, 'HH:mm')}`;
    
    calendarContainer.appendChild(ghost);
    
    function onMouseMove(moveEvent: MouseEvent) {
      const dragState = (window as any).currentDragState;
      if (!dragState || !dragState.dragging) return;
      
      const deltaY = moveEvent.clientY - dragState.initialMouseY;
      const timeSlotsMoved = Math.round(deltaY / 20);
      const minutesMoved = timeSlotsMoved * 15;
      
      let newStartTime = new Date(dragState.initialStartTime);
      let newEndTime = new Date(dragState.initialEndTime);
      
      if (dragState.type === 'start') {
        newStartTime.setMinutes(dragState.initialStartTime.getMinutes() + minutesMoved);
        if (newStartTime.getHours() < 8) newStartTime.setHours(8, 0, 0, 0);
        if (newStartTime >= newEndTime) newStartTime = new Date(newEndTime.getTime() - 15 * 60000);
      } else if (dragState.type === 'end') {
        newEndTime.setMinutes(dragState.initialEndTime.getMinutes() + minutesMoved);
        if (newEndTime.getHours() >= 21) newEndTime.setHours(21, 0, 0, 0);
        if (newEndTime <= newStartTime) newEndTime = new Date(newStartTime.getTime() + 15 * 60000);
      } else {
        newStartTime.setMinutes(dragState.initialStartTime.getMinutes() + minutesMoved);
        newEndTime.setMinutes(dragState.initialEndTime.getMinutes() + minutesMoved);
        
        if (newStartTime.getHours() < 8) {
          const diff = 8 * 60 - (newStartTime.getHours() * 60 + newStartTime.getMinutes());
          newStartTime.setHours(8, 0, 0, 0);
          newEndTime.setMinutes(newEndTime.getMinutes() + diff);
        }
        
        if (newEndTime.getHours() >= 21) {
          const diff = (newEndTime.getHours() * 60 + newEndTime.getMinutes()) - 21 * 60;
          newEndTime.setHours(21, 0, 0, 0);
          newStartTime.setMinutes(newStartTime.getMinutes() - diff);
        }
      }
      
      const newStartMinutes = newStartTime.getHours() * 60 + newStartTime.getMinutes();
      const newEndMinutes = newEndTime.getHours() * 60 + newEndTime.getMinutes();
      
      const newStartPos = (newStartMinutes - 8 * 60) / 15 * 20;
      const newEndPos = (newEndMinutes - 8 * 60) / 15 * 20;
      
      const ghost = document.getElementById('appointment-ghost');
      if (ghost) {
        ghost.style.top = newStartPos + 'px';
        ghost.style.height = (newEndPos - newStartPos) + 'px';
        ghost.style.display = 'block';
        ghost.innerHTML = `${format(newStartTime, 'HH:mm')} - ${format(newEndTime, 'HH:mm')}`;
      }
      
      setStartTime(newStartTime);
      setEndTime(newEndTime);
    }
    
    function onMouseUp() {
      const dragState = (window as any).currentDragState;
      if (!dragState) return;
      
      // Get the current times from state
      const currentStartTime = new Date(startTime);
      const currentEndTime = new Date(endTime);
      
      // Snap both times to 15-minute intervals
      const snappedStartTime = snapTo15Minutes(currentStartTime);
      const snappedEndTime = snapTo15Minutes(currentEndTime);
      
      // Ensure times are within bounds
      if (snappedStartTime.getHours() < 8) {
        snappedStartTime.setHours(8, 0, 0, 0);
      }
      if (snappedEndTime.getHours() >= 21) {
        snappedEndTime.setHours(21, 0, 0, 0);
      }
      
      // Ensure minimum 15-minute duration
      if (snappedEndTime.getTime() - snappedStartTime.getTime() < 15 * 60000) {
        snappedEndTime.setTime(snappedStartTime.getTime() + 15 * 60000);
      }
      
      // Update state with snapped times
      setStartTime(snappedStartTime);
      setEndTime(snappedEndTime);
      
      // Reset drag state
      (window as any).currentDragState = null;
      setIsDragging(false);
      setDragType(null);
      
      // Remove ghost
      const ghost = document.getElementById('appointment-ghost');
      if (ghost) {
        ghost.remove();
      }
      
      // Remove event listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Check for overlaps without triggering auto-scheduling
      setTimeout(() => checkForOverlappingAppointments(), 0);
    }
    
    (window as any).appointmentDragHandlers = {
      onMouseMove,
      onMouseUp
    };
    
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseup', onMouseUp, true);
  };

  // Fix touch handler too
  const handleAppointmentTouchStart = (e: React.TouchEvent, type: 'start' | 'end' | 'both') => {
    e.stopPropagation();
    
    if (e.cancelable) {
      e.preventDefault();
    }
    
    console.log('Touch start event triggered');
    
    setIsDragging(true);
    setDragType(type);
    
    const touch = e.touches[0];
    const initialTouchY = touch.clientY;
    
    const initialStartTime = new Date(startTime);
    const initialEndTime = new Date(endTime);
    
    const dragState = {
      initialTouchY,
      initialStartTime: new Date(initialStartTime),
      initialEndTime: new Date(initialEndTime),
      dragging: true,
      type
    };
    
    (window as any).currentTouchDragState = dragState;
    
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    
    const existingGhost = document.getElementById('appointment-ghost');
    if (existingGhost) {
      existingGhost.remove();
    }
    
    const ghost = document.createElement('div');
    ghost.id = 'appointment-ghost';
    ghost.style.position = 'absolute';
    ghost.style.left = '70px';
    ghost.style.right = '4px';
    ghost.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    ghost.style.border = '3px solid red';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.padding = '5px';
    ghost.style.color = 'white';
    ghost.style.fontWeight = 'bold';
    ghost.style.fontSize = '14px';
    ghost.style.textAlign = 'center';
    ghost.style.boxShadow = '0 0 15px red';
    
    const initialStartMinutes = initialStartTime.getHours() * 60 + initialStartTime.getMinutes();
    const initialEndMinutes = initialEndTime.getHours() * 60 + initialEndTime.getMinutes();
    const startPos = (initialStartMinutes - 8 * 60) / 15 * 20;
    const endPos = (initialEndMinutes - 8 * 60) / 15 * 20;
    ghost.style.top = startPos + 'px';
    ghost.style.height = (endPos - startPos) + 'px';
    ghost.style.display = 'block';
    ghost.innerHTML = `${format(initialStartTime, 'HH:mm')} - ${format(initialEndTime, 'HH:mm')}`;
    
    calendarContainer.appendChild(ghost);
    
    function onTouchMove(moveEvent: TouchEvent) {
      const dragState = (window as any).currentTouchDragState;
      if (!dragState || !dragState.dragging) return;
      
      moveEvent.preventDefault();
      
      const touch = moveEvent.touches[0];
      const deltaY = touch.clientY - dragState.initialTouchY;
      const timeSlotsMoved = Math.round(deltaY / 20);
      const minutesMoved = timeSlotsMoved * 15;
      
      let newStartTime = new Date(dragState.initialStartTime);
      let newEndTime = new Date(dragState.initialEndTime);
      
      if (dragState.type === 'start') {
        newStartTime.setMinutes(dragState.initialStartTime.getMinutes() + minutesMoved);
        if (newStartTime.getHours() < 8) newStartTime.setHours(8, 0, 0, 0);
        if (newStartTime >= newEndTime) newStartTime = new Date(newEndTime.getTime() - 15 * 60000);
      } else if (dragState.type === 'end') {
        newEndTime.setMinutes(dragState.initialEndTime.getMinutes() + minutesMoved);
        if (newEndTime.getHours() >= 21) newEndTime.setHours(21, 0, 0, 0);
        if (newEndTime <= newStartTime) newEndTime = new Date(newStartTime.getTime() + 15 * 60000);
      } else {
        newStartTime.setMinutes(dragState.initialStartTime.getMinutes() + minutesMoved);
        newEndTime.setMinutes(dragState.initialEndTime.getMinutes() + minutesMoved);
        
        if (newStartTime.getHours() < 8) {
          const diff = 8 * 60 - (newStartTime.getHours() * 60 + newStartTime.getMinutes());
          newStartTime.setHours(8, 0, 0, 0);
          newEndTime.setMinutes(newEndTime.getMinutes() + diff);
        }
        
        if (newEndTime.getHours() >= 21) {
          const diff = (newEndTime.getHours() * 60 + newEndTime.getMinutes()) - 21 * 60;
          newEndTime.setHours(21, 0, 0, 0);
          newStartTime.setMinutes(newStartTime.getMinutes() - diff);
        }
      }
      
      const newStartMinutes = newStartTime.getHours() * 60 + newStartTime.getMinutes();
      const newEndMinutes = newEndTime.getHours() * 60 + newEndTime.getMinutes();
      
      const newStartPos = (newStartMinutes - 8 * 60) / 15 * 20;
      const newEndPos = (newEndMinutes - 8 * 60) / 15 * 20;
      
      const ghost = document.getElementById('appointment-ghost');
      if (ghost) {
        ghost.style.top = newStartPos + 'px';
        ghost.style.height = (newEndPos - newStartPos) + 'px';
        ghost.style.display = 'block';
        ghost.innerHTML = `${format(newStartTime, 'HH:mm')} - ${format(newEndTime, 'HH:mm')}`;
      }
      
      setStartTime(newStartTime);
      setEndTime(newEndTime);
    }
    
    function onTouchEnd() {
      const dragState = (window as any).currentTouchDragState;
      if (!dragState) return;
      
      // Get the current times from state
      const currentStartTime = new Date(startTime);
      const currentEndTime = new Date(endTime);
      
      // Snap both times to 15-minute intervals
      const snappedStartTime = snapTo15Minutes(currentStartTime);
      const snappedEndTime = snapTo15Minutes(currentEndTime);
      
      // Ensure times are within bounds
      if (snappedStartTime.getHours() < 8) {
        snappedStartTime.setHours(8, 0, 0, 0);
      }
      if (snappedEndTime.getHours() >= 21) {
        snappedEndTime.setHours(21, 0, 0, 0);
      }
      
      // Ensure minimum 15-minute duration
      if (snappedEndTime.getTime() - snappedStartTime.getTime() < 15 * 60000) {
        snappedEndTime.setTime(snappedStartTime.getTime() + 15 * 60000);
      }
      
      // Update state with snapped times
      setStartTime(snappedStartTime);
      setEndTime(snappedEndTime);
      
      // Reset drag state
      (window as any).currentTouchDragState = null;
      setIsDragging(false);
      setDragType(null);
      
      // Remove ghost
      const ghost = document.getElementById('appointment-ghost');
      if (ghost) {
        ghost.remove();
      }
      
      // Remove event listeners
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      
      // Check for overlaps without triggering auto-scheduling
      setTimeout(() => checkForOverlappingAppointments(), 0);
    }
    
    (window as any).appointmentTouchDragHandlers = {
      onTouchMove,
      onTouchEnd
    };
    
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { capture: true });
  };

  // Add debugging in useEffect
  useEffect(() => {
    console.log('Component mounted or updated');
    
    // Debugging events
    const debugMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        console.log('Global mouse move detected while dragging');
      }
    };
    
    document.addEventListener('mousemove', debugMouseMove);
    
    return () => {
      console.log('Component unmounting, cleaning up event listeners');
      document.removeEventListener('mousemove', debugMouseMove);
      
      // Clean up any lingering handlers when unmounting
      const ghost = document.getElementById('appointment-ghost');
      if (ghost) ghost.remove();
      
      // Clean up any global handlers
      if ((window as any).appointmentDragHandlers) {
        const { onMouseMove, onMouseUp } = (window as any).appointmentDragHandlers;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      
      if ((window as any).appointmentTouchDragHandlers) {
        const { onTouchMove, onTouchEnd } = (window as any).appointmentTouchDragHandlers;
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [isDragging]); // Added isDragging as a dependency to update debug listeners

  // Validate start time to ensure it's within bounds and doesn't overlap with end time
  const validateStartTime = (newStart: Date, diffForEndTime: number = 0): Date | null => {
    // Don't allow times outside 8:00-21:00
    if (newStart.getHours() < 8 || newStart.getHours() >= 21) {
      return null;
    }
    
    // Don't allow start time to be after end time or less than 15 min before end time
    let currentEnd = new Date(endTime);
    if (diffForEndTime !== 0) {
      currentEnd = new Date(currentEnd);
      currentEnd.setMinutes(currentEnd.getMinutes() + diffForEndTime);
    }
    
    const minDiff = 15; // Minimum 15 minutes between start and end
    const endMinusMin = new Date(currentEnd);
    endMinusMin.setMinutes(currentEnd.getMinutes() - minDiff);
    
    if (newStart >= endMinusMin) {
      return null;
    }
    
    return newStart;
  };

  // Validate end time to ensure it's within bounds and doesn't overlap with start time
  const validateEndTime = (newEnd: Date, diffForStartTime: number = 0): Date | null => {
    // Don't allow times outside 8:00-21:00
    if (newEnd.getHours() > 21 || (newEnd.getHours() === 21 && newEnd.getMinutes() > 0)) {
      const maxEnd = new Date(appointmentDate);
      maxEnd.setHours(21, 0, 0, 0);
      return maxEnd;
    }
    
    // Don't allow end time to be before start time or less than 15 min after start time
    let currentStart = new Date(startTime);
    if (diffForStartTime !== 0) {
      currentStart = new Date(currentStart);
      currentStart.setMinutes(currentStart.getMinutes() + diffForStartTime);
    }
    
    const minDiff = 15; // Minimum 15 minutes between start and end
    const startPlusMin = new Date(currentStart);
    startPlusMin.setMinutes(currentStart.getMinutes() + minDiff);
    
    if (newEnd <= startPlusMin) {
      return null;
    }
    
    return newEnd;
  };

  // Update the style in the useEffect to make the ghost preview more visible
  useEffect(() => {
    // Add CSS styles for drag animation and interaction
    const style = document.createElement('style');
    style.innerHTML = `
      .calendar-container {
        position: relative;
        user-select: none;
      }
      .existing-appointment {
        transition: none;
        user-select: none;
      }
      .current-appointment {
        user-select: none;
        cursor: grab;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: box-shadow 0.2s;
        touch-action: none;
      }
      .current-appointment:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      .current-appointment.dragging {
        cursor: grabbing;
        box-shadow: 0 6px 12px rgba(0,0,0,0.2);
        opacity: 0.6;
      }
      .current-appointment-handle-start, 
      .current-appointment-handle-end {
        opacity: 0.8;
        transition: opacity 0.1s, background-color 0.2s;
        touch-action: none;
      }
      .current-appointment-handle-start:hover, 
      .current-appointment-handle-end:hover {
        opacity: 1;
        background-color: #2563eb;
      }
      .time-slot-area {
        z-index: 5; 
        height: 100%;
      }
      .appointment-ghost-preview {
        position: absolute;
        left: 70px;
        right: 4px;
        background-color: rgba(59, 130, 246, 0.5);
        border: 2px dashed #3b82f6;
        border-radius: 4px;
        z-index: 50;
        pointer-events: none;
        display: none;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      }
      .ghost-time-label {
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 3px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: calc(50% - 10px);
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 51;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add a useEffect to update the schedule whenever the dailyAppointments change
  useEffect(() => {
    // Only recalculate if we have appointments data and dogs/services selected
    if (dailyAppointments.length > 0 && selectedDogIds.length > 0 && 
        Object.values(dogServices).some(services => services.length > 0)) {
      findBestTimeSlot();
    }
  }, [dailyAppointments]);

  // Add a reset function to re-enable auto-scheduling if needed
  const resetAutoScheduling = () => {
    setHasAutoScheduled(false);
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
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        id="customer"
                        className="input pr-10 w-full"
                        placeholder="Search customer..."
                        value={selectedCustomerId 
                          ? customers.find(c => c.id === selectedCustomerId)?.contactperson || ''
                          : searchTerm
                        }
                        onChange={(e) => {
                          if (selectedCustomerId) return; // Don't allow changes when customer is selected
                          setSearchTerm(e.target.value);
                          setDropdownOpen(true);
                        }}
                        onFocus={() => {
                          if (!selectedCustomerId) setDropdownOpen(true);
                        }}
                        readOnly={selectedCustomerId !== null}
                      />
                      {selectedCustomerId && (
                        <button 
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            setSelectedCustomerId(null);
                            setSearchTerm('');
                            setSelectedDogIds([]);
                            setCustomerDogs([]);
                          }}
                        >
                          <FaTimes size={16} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ml-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                      onClick={() => setShowCustomerModal(true)}
                    >
                      <FaPlus className="mr-1" size={14} /> New
                    </button>
                  </div>
                  
                  {dropdownOpen && !selectedCustomerId && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-gray-500">No customers found</div>
                      ) : (
                        filteredCustomers.map(customer => (
                          <div 
                            key={customer.id}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedCustomerId === customer.id ? 'bg-primary-50' : ''}`}
                            onClick={() => handleCustomerChange(customer.id)}
                          >
                            <div className="font-medium">{customer.contactperson}</div>
                            {customer.dogs.length > 0 && (
                              <div className="text-sm text-gray-600">
                                Dogs: {customer.dogs.map((d: {id: number, name: string}) => d.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
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
            
            {/* Dog Selection */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Dogs *
                </label>
                {selectedCustomerId && (
                  <button
                    type="button"
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                    onClick={() => setShowDogModal(true)}
                  >
                    <FaPlus className="mr-1" size={12} /> Add New Dog
                  </button>
                )}
              </div>
              {customerDogs.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center">
                  <p className="text-gray-500 text-sm mb-2">
                    {selectedCustomerId 
                      ? "No dogs found for this customer." 
                      : "Please select a customer to see their dogs."}
                  </p>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm inline-flex items-center"
                      onClick={() => setShowDogModal(true)}
                    >
                      <FaPlus className="mr-1" size={12} /> Add First Dog
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {customerDogs.map((dog: Dog) => {
                    const dogId = dog.Id || dog.id || 0;
                    const isSelected = selectedDogIds.includes(dogId);
                    const dogStats = dogServiceStats[dogId];
                    const hasAutoSelectedServices = dogStats && dogStats.some(stat => stat.percentage >= 75);
                    
                    return (
                      <div 
                        key={dogId} 
                        className={`border rounded-md p-4 ${
                          isSelected 
                            ? 'border-primary-500' 
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleDogSelection(dogId)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            id={`dog-${dogId}`}
                          />
                          <label htmlFor={`dog-${dogId}`} className="ml-2 text-lg font-medium text-gray-900">
                            {dog.Name || dog.name || dog.DogName || 'Unnamed Dog'}
                            {dogStats && dogStats.length > 0 && (
                              <span className="ml-2 text-xs text-gray-500 font-normal">
                                {hasAutoSelectedServices 
                                  ? '(Has common services)' 
                                  : '(Service history available)'}
                              </span>
                            )}
                          </label>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 pl-6">
                            <h4 className="font-medium text-gray-700 mb-2">Services</h4>
                            <div className="space-y-3">
                              {services.map(service => renderServiceSelection(dogId, service))}
                            </div>
                            
                            <div className="mt-4">
                              <label htmlFor={`dog-note-${dogId}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Notes for this dog
                              </label>
                              <textarea
                                id={`dog-note-${dogId}`}
                                value={dogNotes[dogId] || ""}
                                onChange={(e) => handleDogNoteChange(dogId, e.target.value)}
                                rows={2}
                                placeholder="E.g., Prefers gentle brushing"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date and Time Selection - Only shown when dogs and services are selected */}
            {selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0) && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      filterDate={isWeekday}
                      placeholderText="Select a weekday"
                    />
                    <p className="text-xs text-gray-500 mt-1">Weekends are not available for appointments</p>
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
                        onChange={(time: Date) => {
                          setStartTime(time);
                          
                          // Calculate total duration
                          const totalDuration = selectedDogIds.length > 0 ? getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services) : 60;
                          
                          console.log(`Total calculated duration after start time change: ${totalDuration} minutes`);
                          
                          // Set end time based on calculated total duration
                          const newEndTime = new Date(time);
                          newEndTime.setMinutes(time.getMinutes() + totalDuration);
                          
                          // Make sure the end time is within limits
                          const lastPossibleTime = new Date(time);
                          lastPossibleTime.setHours(21, 0, 0, 0);
                          
                          if (newEndTime > lastPossibleTime) {
                            setEndTime(lastPossibleTime);
                          } else {
                            setEndTime(newEndTime);
                          }
                          
                          console.log(`Setting end time to ${format(newEndTime, 'HH:mm')} after start time change`);
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        includeTimes={generateTimeOptions()}
                        minTime={setHours(setMinutes(new Date(), 0), 8)}
                        maxTime={setHours(setMinutes(new Date(), 0), 21)}
                        className="w-full p-2 border border-gray-300 rounded-md"
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
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        includeTimes={generateTimeOptions()}
                        minTime={startTime}
                        maxTime={setHours(setMinutes(new Date(), 0), 21)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        required
                        disabled={!startTime}
                      />
                    </div>
                    <div className="col-span-2 -mt-1">
                      <div className="text-sm text-gray-600 flex items-center">
                        <span className="font-medium">Duration:</span> 
                        <span className="ml-1">{calculateDuration(startTime, endTime)}</span>
                        
                        {/* Duration estimate indicator */}
                        {startTime && endTime && (
                          <>
                            {(() => {
                              const actualMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                              const estimatedMinutes = selectedDogIds.length > 0 ? getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services) : 60;
                              const { color, label } = getDurationFeasibility(actualMinutes, estimatedMinutes);
                              
                              return (
                                <div className="ml-2 flex items-center relative group">
                                  <span className={`inline-block w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} mr-1`}></span>
                                  <span className={`text-xs ${color}`}>
                                    ({label})
                                  </span>
                                  
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
                                    <div className="font-bold mb-1">Duration Estimate</div>
                                    <div>Scheduled: {Math.floor(actualMinutes / 60)}h {actualMinutes % 60}m</div>
                                    <div>Estimated: {Math.floor(estimatedMinutes / 60)}h {estimatedMinutes % 60}m</div>
                                    <div className={`mt-1 ${color}`}>
                                      {label}: {(actualMinutes / estimatedMinutes * 100).toFixed(0)}% of estimated time
                                    </div>
                                    <div className="text-gray-300 text-xs mt-1">
                                      Based on past appointments for these services
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Day Calendar */}
                {renderDayCalendar()}
              </div>
            )}
            
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
            renderPastAppointmentHistory()
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