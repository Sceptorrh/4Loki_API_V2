'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';

interface DogService {
  ServiceId: string;
  ServiceName: string;
  Price: number;
}

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
    services: DogService[];
  }[];
  interval?: number;
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

interface AppointmentHistoryProps {
  customerId: number | null;
  appointmentDate: Date;
  onServiceStatsCalculated?: (stats: Record<number, ServiceStat[]>) => void;
}

export default function AppointmentHistory({
  customerId,
  appointmentDate,
  onServiceStatsCalculated
}: AppointmentHistoryProps) {
  const [previousAppointments, setPreviousAppointments] = useState<PreviousAppointment[]>([]);
  const [sortedAppointments, setSortedAppointments] = useState<PreviousAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dogServiceStats, setDogServiceStats] = useState<Record<number, ServiceStat[]>>({});
  const [viewAll, setViewAll] = useState<boolean>(false);

  // Fetch previous appointments when customer is selected
  useEffect(() => {
    if (customerId) {
      fetchPreviousAppointments(customerId);
    } else {
      setPreviousAppointments([]);
    }
  }, [customerId]);

  // Function to fetch previous appointments for a customer
  const fetchPreviousAppointments = async (customerId: number) => {
    try {
      setLoading(true);
      const response = await endpoints.appointments.getByCustomerId(customerId);
      console.log('Previous appointments:', response.data);
      setPreviousAppointments(response.data || []);
      
      // Process appointment data to calculate service statistics
      if (response.data && response.data.length > 0) {
        console.log(`Processing ${response.data.length} appointments for service statistics`);
        calculateServiceStatistics(response.data);
      } else {
        console.log('No previous appointments found to calculate service statistics');
        // Send empty stats if no appointments
        if (onServiceStatsCalculated) {
          console.log('Sending empty stats to parent component');
          onServiceStatsCalculated({});
        }
      }
    } catch (err) {
      console.error('Error fetching previous appointments:', err);
      // Send empty stats on error
      if (onServiceStatsCalculated) {
        console.log('Sending empty stats to parent component due to error');
        onServiceStatsCalculated({});
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate service usage statistics for each dog
  const calculateServiceStatistics = (appointments: PreviousAppointment[]) => {
    console.log('Calculating service statistics from appointments');
    const dogStats: Record<number, Record<string, ServiceStat>> = {};
    
    // Sort appointments by date (newest first)
    const sortedAppointments = [...appointments].sort((a, b) => {
      return new Date(b.Date).getTime() - new Date(a.Date).getTime();
    });
    
    console.log(`Processing ${sortedAppointments.length} sorted appointments`);
    
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
    console.log('Number of dogs with stats:', Object.keys(dogServiceStats).length);
    setDogServiceStats(dogServiceStats);
    
    // Send stats to parent component if callback is provided
    if (onServiceStatsCalculated) {
      console.log('Sending stats to parent component');
      onServiceStatsCalculated(dogServiceStats);
    }
  };

  // Sort appointments by date (newest first) and add intervals
  useEffect(() => {
    if (previousAppointments && previousAppointments.length > 0) {
      const sorted = [...previousAppointments].sort((a, b) => {
        return new Date(b.Date).getTime() - new Date(a.Date).getTime();
      });

      // Calculate intervals between appointments
      const appointmentsWithIntervals = sorted.map((appointment, index, array) => {
        let interval = undefined;
        if (index < array.length - 1) {
          const currentDate = new Date(appointment.Date);
          const prevDate = new Date(array[index + 1].Date);
          const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
          interval = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
        }
        return { ...appointment, interval };
      });

      setSortedAppointments(appointmentsWithIntervals);
    } else {
      setSortedAppointments([]);
    }
  }, [previousAppointments]);

  // Calculate days between new appointment and most recent appointment
  const daysSinceLastAppointment = sortedAppointments.length > 0
    ? Math.ceil(Math.abs(appointmentDate.getTime() - new Date(sortedAppointments[0].Date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">Loading previous appointments...</p>
      </div>
    );
  }

  if (!sortedAppointments || sortedAppointments.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">No previous appointments found</p>
      </div>
    );
  }

  // Display either all appointments or just the first 2 based on viewAll state
  const displayedAppointments = viewAll 
    ? sortedAppointments
    : sortedAppointments.slice(0, 2);

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
      <div className={`${viewAll ? 'max-h-[600px] overflow-y-auto' : ''} pr-2`}>
        {displayedAppointments.map((appointment, index) => {
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
        
        {sortedAppointments.length > 2 && (
          <div className="flex justify-center my-2">
            <button
              type="button"
              onClick={() => setViewAll(!viewAll)}
              className="text-primary-600 text-sm py-1 px-3 border border-primary-300 rounded-md hover:bg-primary-50 transition-colors"
            >
              {viewAll ? 'Show less' : `View all ${sortedAppointments.length} appointments`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 