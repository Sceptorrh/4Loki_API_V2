'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addHours, setHours, setMinutes } from 'date-fns';

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
  Id: string;
  Label: string;
  Color: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customerId ? parseInt(customerId) : null);
  const [selectedDogIds, setSelectedDogIds] = useState<number[]>([]);
  const [dogServices, setDogServices] = useState<Record<number, DogService[]>>({});
  const [dogNotes, setDogNotes] = useState<Record<number, string>>({});
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(setHours(setMinutes(new Date(), 0), 9)); // Default to 9:00 AM
  const [endTime, setEndTime] = useState<Date>(setHours(setMinutes(new Date(), 30), 10)); // Default to 10:30 AM
  const [statusId, setStatusId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerDogs, setCustomerDogs] = useState<Dog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          const statusesResponse = await fetch('/api/v1/static/appointment-statuses');
          if (!statusesResponse.ok) {
            throw new Error(`Status response not OK: ${statusesResponse.status}`);
          }
          const statusesData = await statusesResponse.json();
          setStatuses(statusesData || []);
          
          // Set default status if available
          if (statusesData && statusesData.length > 0) {
            // Find the "Planned" status or use the first one
            const plannedStatus = statusesData.find((status: Status) => status.Id === 'Pln') || statusesData[0];
            setStatusId(plannedStatus.Id);
          }
        } catch (statusError) {
          console.error('Error fetching statuses:', statusError);
          // Create a default status
          const defaultStatuses = [{
            Id: 'Pln',
            Label: 'Planned',
            Color: '#3498db'
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    const searchLower = searchTerm.toLowerCase();
    
    // Search in contact person name
    if (customer.contactperson.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in dog names
    return customer.dogs.some((dog: {id: number, name: string}) => 
      dog.name.toLowerCase().includes(searchLower)
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
      const dogNames = dogsWithoutServices.map(dogId => {
        const dog = customerDogs.find(d => (d.Id || d.id) === dogId);
        return dog?.Name || dog?.name || `Dog #${dogId}`;
      }).join(', ');
      
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
      
      // Create appointment data
      const appointmentData = {
        appointment: {
          Date: formattedDate,
          TimeStart: formattedStartTime,
          TimeEnd: formattedEndTime,
          DateEnd: formattedDate, // Assuming same day
          ActualDuration: 90, // Default duration in minutes
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
        <Link href="/appointments" className="text-primary-600 hover:text-primary-900">
          Back to Appointments
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div>
            <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                id="customerSearch"
                type="text"
                placeholder="Search customers or dogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required={selectedCustomerId === null}
              />
              
              {selectedCustomerId !== null && (
                <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {customers.find(c => c.id === selectedCustomerId)?.contactperson || 'Selected Customer'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setSelectedCustomerId(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {dropdownOpen && (
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
              Status *
            </label>
            <select
              id="status"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select a status</option>
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
                onChange={(time: Date) => {
                  setStartTime(time);
                  // Automatically set end time to 90 minutes later
                  setEndTime(addHours(time, 1.5));
                }}
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
          {customerDogs.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {selectedCustomerId 
                ? "No dogs found for this customer. Please add a dog first." 
                : "Please select a customer to see their dogs."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {customerDogs.map((dog: Dog) => {
                const dogId = dog.Id || dog.id || 0;
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
                      </label>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-3 pl-6">
                        <h4 className="font-medium text-gray-700 mb-2">Services</h4>
                        <div className="space-y-3">
                          {services.map(service => {
                            const isServiceSelected = dogServices[dogId]?.some(s => s.ServiceId === service.Id) || false;
                            const servicePrice = dogServices[dogId]?.find(s => s.ServiceId === service.Id)?.Price || service.StandardPrice;
                            
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
                                  <div className="sm:w-32 flex items-center">
                                    <span className="text-gray-500 mr-2">€</span>
                                    <input
                                      type="number"
                                      value={isNaN(Number(servicePrice)) ? 0 : Number(servicePrice)}
                                      onChange={(e) => {
                                        const newPrice = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        handleServicePriceChange(dogId, service.Id, newPrice);
                                      }}
                                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
  );
} 