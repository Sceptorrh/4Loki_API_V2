'use client';

import { useState, useEffect, useRef } from 'react';
import { endpoints } from '@/lib/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

interface DogSummary {
  dogId: number;
  dogName: string;
  totalAppointments: number;
  lastAppointmentDate: string;
  averageInterval: number;
  lastInterval: number;
  averagePrice: number;
  lastPrice: number;
  averageDuration: number;
  lastDuration: number;
  mostCommonServices: {
    serviceId: string;
    serviceName: string;
    count: number;
    percentage: number;
  }[];
  lastServices: {
    serviceId: string;
    serviceName: string;
    price: number;
  }[];
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
  const [dogSummaries, setDogSummaries] = useState<DogSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dogServiceStats, setDogServiceStats] = useState<Record<number, ServiceStat[]>>({});
  const [hoveredDogId, setHoveredDogId] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Fetch previous appointments when customer is selected
  useEffect(() => {
    if (customerId) {
      fetchPreviousAppointments(customerId);
    } else {
      setPreviousAppointments([]);
      setDogSummaries([]);
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

  // Calculate dog summaries from appointments
  const calculateDogSummaries = (appointments: PreviousAppointment[]) => {
    const dogStats: Record<number, DogSummary> = {};
    
    // Sort appointments by date (newest first)
    const sortedAppointments = [...appointments].sort((a, b) => {
        return new Date(b.Date).getTime() - new Date(a.Date).getTime();
      });

    // Process each appointment
    sortedAppointments.forEach((appointment, index) => {
      appointment.dogServices.forEach(dogService => {
        const dogId = dogService.DogId;
        
        if (!dogStats[dogId]) {
          dogStats[dogId] = {
            dogId,
            dogName: dogService.DogName,
            totalAppointments: 0,
            lastAppointmentDate: appointment.Date,
            averageInterval: 0,
            lastInterval: 0,
            averagePrice: 0,
            lastPrice: 0,
            averageDuration: 0,
            lastDuration: 0,
            mostCommonServices: [],
            lastServices: []
          };
        }

        const stats = dogStats[dogId];
        stats.totalAppointments++;

        // Calculate price
        const totalPrice = dogService.services.reduce((sum, service) => sum + Number(service.Price), 0);
        stats.averagePrice = ((stats.averagePrice * (stats.totalAppointments - 1)) + totalPrice) / stats.totalAppointments;
        
        // Set last price and duration only from the most recent appointment
        if (index === 0) {
          stats.lastPrice = totalPrice;
          stats.lastDuration = appointment.ActualDuration || 0;
          stats.lastServices = dogService.services.map(service => ({
            serviceId: service.ServiceId,
            serviceName: service.ServiceName,
            price: Number(service.Price)
          }));
        }

        // Calculate duration
        if (appointment.ActualDuration) {
          stats.averageDuration = ((stats.averageDuration * (stats.totalAppointments - 1)) + appointment.ActualDuration) / stats.totalAppointments;
        }

        // Calculate intervals
        if (index < sortedAppointments.length - 1) {
          const nextAppointment = sortedAppointments[index + 1];
          const currentDate = new Date(appointment.Date);
          const nextDate = new Date(nextAppointment.Date);
          const interval = Math.round((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (stats.lastInterval === 0) {
            stats.lastInterval = interval;
          }
          stats.averageInterval = ((stats.averageInterval * (stats.totalAppointments - 1)) + interval) / stats.totalAppointments;
        }
      });
    });

    // Calculate most common services for each dog
    Object.values(dogStats).forEach(stats => {
      const serviceCounts: Record<string, { count: number; name: string }> = {};
      
      sortedAppointments.forEach(appointment => {
        const dogService = appointment.dogServices.find(ds => ds.DogId === stats.dogId);
        if (dogService) {
          dogService.services.forEach(service => {
            if (!serviceCounts[service.ServiceId]) {
              serviceCounts[service.ServiceId] = { count: 0, name: service.ServiceName };
            }
            serviceCounts[service.ServiceId].count++;
          });
        }
      });

      stats.mostCommonServices = Object.entries(serviceCounts)
        .map(([serviceId, data]) => ({
          serviceId,
          serviceName: data.name,
          count: data.count,
          percentage: (data.count / stats.totalAppointments) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Get top 3 most common services
    });

    setDogSummaries(Object.values(dogStats));
  };

  // Update useEffect to calculate summaries
  useEffect(() => {
    if (customerId) {
      fetchPreviousAppointments(customerId);
    } else {
      setPreviousAppointments([]);
      setDogSummaries([]);
    }
  }, [customerId]);

  useEffect(() => {
    if (previousAppointments.length > 0) {
      calculateDogSummaries(previousAppointments);
    }
  }, [previousAppointments]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        // Add a small delay before closing to allow moving to the popover
        timeoutRef.current = setTimeout(() => {
          setHoveredDogId(null);
        }, 200);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPriceChartData = (dog: DogSummary) => {
    const sortedAppointments = [...previousAppointments]
      .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
      .filter(appointment => 
        appointment.dogServices.some(ds => ds.DogId === dog.dogId)
      );

    return {
      labels: sortedAppointments.map(app => new Date(app.Date).toLocaleDateString()),
      datasets: [{
        label: 'Price',
        data: sortedAppointments.map(app => {
          const dogService = app.dogServices.find(ds => ds.DogId === dog.dogId);
          return dogService?.services.reduce((sum, service) => sum + Number(service.Price), 0) || 0;
        }),
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1
      }]
    };
  };

  const getIntervalChartData = (dog: DogSummary) => {
    const sortedAppointments = [...previousAppointments]
      .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
      .filter(appointment => 
        appointment.dogServices.some(ds => ds.DogId === dog.dogId)
      );

    const intervals = [];
    for (let i = 1; i < sortedAppointments.length; i++) {
      const currentDate = new Date(sortedAppointments[i - 1].Date);
      const prevDate = new Date(sortedAppointments[i].Date);
      const interval = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(interval);
    }

    return {
      labels: sortedAppointments.slice(1).map(app => new Date(app.Date).toLocaleDateString()),
      datasets: [{
        label: 'Interval (days)',
        data: intervals,
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.1
      }]
    };
  };

  const getDurationChartData = (dog: DogSummary) => {
    const sortedAppointments = [...previousAppointments]
      .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
      .filter(appointment => 
        appointment.dogServices.some(ds => ds.DogId === dog.dogId)
      );

    return {
      labels: sortedAppointments.map(app => new Date(app.Date).toLocaleDateString()),
      datasets: [{
        label: 'Duration (minutes)',
        data: sortedAppointments.map(app => app.ActualDuration || 0),
        borderColor: 'rgb(245, 158, 11)',
        tension: 0.1
      }]
    };
  };

  const getDaysSinceLastVisit = (date: string) => {
    const lastVisit = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">Loading previous appointments...</p>
      </div>
    );
  }

  if (!dogSummaries || dogSummaries.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">No previous appointments found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-base font-medium text-gray-900 mb-4">Appointment History</h2>
      
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : dogSummaries.length === 0 ? (
        <div className="text-gray-500">No previous appointments found</div>
      ) : (
        <div className="space-y-3">
          {dogSummaries.map(dog => (
            <div 
              key={dog.dogId} 
              className="relative group"
              onMouseEnter={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
                setHoveredDogId(dog.dogId);
              }}
              onMouseLeave={() => {
                timeoutRef.current = setTimeout(() => {
                  setHoveredDogId(null);
                }, 200);
              }}
            >
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    {dog.dogName[0].toUpperCase()}
          </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{dog.dogName}</h3>
                    <div className="text-sm text-gray-500">
                      {getDaysSinceLastVisit(dog.lastAppointmentDate)} days ago • 
                      €{dog.lastPrice.toFixed(2)} • {formatDuration(dog.lastDuration)}
      </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {dog.totalAppointments} appointment{dog.totalAppointments !== 1 ? 's' : ''}
                </div>
              </div>
              
              {hoveredDogId === dog.dogId && (
                <div 
                  ref={popoverRef}
                  className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border p-4"
                  onMouseEnter={() => {
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    timeoutRef.current = setTimeout(() => {
                      setHoveredDogId(null);
                    }, 200);
                  }}
                >
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Last Visit Date</div>
                      <div className="font-medium">{new Date(dog.lastAppointmentDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Days Since Last Visit</div>
                      <div className="font-medium">{getDaysSinceLastVisit(dog.lastAppointmentDate)} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Average Interval</div>
                      <div className="font-medium">{Math.round(dog.averageInterval)} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Average Price</div>
                      <div className="font-medium">€{dog.averagePrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Average Duration</div>
                      <div className="font-medium">{formatDuration(Math.round(dog.averageDuration))}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Last Interval</div>
                      <div className="font-medium">{dog.lastInterval} days</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Price History</div>
                      <div className="h-32">
                        <Line 
                          data={getPriceChartData(dog)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Duration History</div>
                      <div className="h-32">
                        <Line 
                          data={getDurationChartData(dog)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Interval History</div>
                      <div className="h-32">
                        <Line 
                          data={getIntervalChartData(dog)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {dog.mostCommonServices.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Most Common Services</div>
                        <div className="flex flex-wrap gap-2">
                          {dog.mostCommonServices.map(service => (
                            <div 
                              key={service.serviceId}
                              className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                            >
                              {service.serviceName} ({Math.round(service.percentage)}%)
                    </div>
                  ))}
                        </div>
                </div>
              )}
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
    </div>
  );
} 