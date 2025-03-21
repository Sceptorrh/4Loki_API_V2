'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { endpoints } from '@/lib/api';
import "react-datepicker/dist/react-datepicker.css";
import { format, setHours, setMinutes, getDay } from 'date-fns';
import CustomerModal from '@/components/CustomerModal';
import DogModal from '@/components/DogModal';
import { getEstimatedDuration, calculateBestTimeSlot, generateTimeOptions, snapTo15Minutes, findOverlappingAppointments, autoScheduleAppointment } from '@/lib/appointments';
import AppointmentHistory from '@/components/appointments/AppointmentHistory';
import CustomerSelection from '@/components/appointments/CustomerSelection';
import DogSelection from '@/components/appointments/DogSelection';
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
    } catch (err) {
      console.error('Error fetching daily appointments:', err);
      setDailyAppointments([]);
    }
  };

  // Function to check if the current appointment overlaps with existing appointments
  const checkForOverlappingAppointments = () => {
    // Don't check for overlaps during dragging
    if (isDragging) {
      console.log('Skipping manual overlap check during drag');
      return;
    }
    
    if (!startTime || !endTime || dailyAppointments.length === 0) {
      setOverlappingAppointments([]);
      return;
    }

    console.log('Manually checking for overlaps');
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

  // Add debugging in useEffect
  useEffect(() => {
    console.log('Component mounted or updated');
    
    return () => {
      console.log('Component unmounting, cleaning up event listeners');
    };
  }, []);

  // Add a useEffect to update the schedule whenever the dailyAppointments change
  useEffect(() => {
    // Skip calculations during dragging
    if (isDragging) {
      console.log('Skipping daily appointments auto-scheduling during drag');
      return;
    }
    
    // Only recalculate if we have appointments data and dogs/services selected
    // and we're using the default start time (9:00)
    const isDefaultTime = startTime && startTime.getHours() === 9 && startTime.getMinutes() === 0;
    
    if (dailyAppointments.length > 0 && 
        selectedDogIds.length > 0 && 
        Object.values(dogServices).some(services => services.length > 0) &&
        isDefaultTime) {
      console.log('Auto-scheduling based on daily appointments change');
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
  }, [dailyAppointments, selectedDogIds, dogServices, startTime, services, dogServiceStats, isDragging]);

  // Check for overlaps whenever start or end time changes
  useEffect(() => {
    // Skip overlap checks during dragging to prevent unnecessary calculations
    if (isDragging) {
      console.log('Skipping overlap check during drag');
      return;
    }
    
    if (startTime && endTime && dailyAppointments.length > 0) {
      console.log('Checking for overlapping appointments');
      const overlaps = findOverlappingAppointments(dailyAppointments, startTime, endTime);
      setOverlappingAppointments(overlaps);
    } else {
      setOverlappingAppointments([]);
    }
  }, [startTime, endTime, dailyAppointments, isDragging]);

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
            
            {/* Dog Selection */}
            <DogSelection
              selectedCustomerId={selectedCustomerId}
              customerDogs={customerDogs}
              selectedDogIds={selectedDogIds}
              handleDogSelection={handleDogSelection}
              dogServices={dogServices}
              dogNotes={dogNotes}
              dogServiceStats={dogServiceStats}
              services={services}
              handleDogNoteChange={handleDogNoteChange}
              handleServiceSelection={handleServiceSelection}
              handleServicePriceChange={handleServicePriceChange}
              setShowDogModal={setShowDogModal}
            />

            {/* Date and Time Selection - Only shown when dogs and services are selected */}
            {selectedDogIds.length > 0 && Object.values(dogServices).some(services => services.length > 0) && (
              <AppointmentSchedule
                appointmentDate={appointmentDate}
                setAppointmentDate={setAppointmentDate}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                dailyAppointments={dailyAppointments}
                overlappingAppointments={overlappingAppointments}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                dragType={dragType}
                setDragType={setDragType}
                checkForOverlappingAppointments={checkForOverlappingAppointments}
                selectedDogIds={selectedDogIds}
                totalDuration={getEstimatedDuration(selectedDogIds, dogServices, dogServiceStats, services)}
              />
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
            <AppointmentHistory previousAppointments={previousAppointments} appointmentDate={appointmentDate} />
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