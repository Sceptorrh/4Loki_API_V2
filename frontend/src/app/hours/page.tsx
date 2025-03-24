'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { format, startOfMonth, endOfMonth, parseISO, addMonths, subMonths, parse } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface Appointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  StatusLabel: string;
  ActualDuration: number;
  TravelTime: number;
  CustomerName: string;
  Dogs: string[];
  dogServices?: {
    DogId: number;
    DogName: string;
    services: {
      ServiceId: string;
      ServiceName: string;
      Price: number;
    }[];
  }[];
}

interface DaySummary {
  date: string;
  appointments: Appointment[];
  appointmentHours: number;
  travelHours: number;
  cleaningHours: number;
  totalHours: number;
  isExpanded: boolean;
}

interface HoursSummary {
  appointmentHours: number;
  travelHours: number;
  cleaningHours: number;
  totalHours: number;
}

// Function to generate a random travel time between min and max
const generateRandomTravelTime = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to get travel time, using random if not available
const getTravelTime = (appointment: Appointment, minTravelTime: number, maxTravelTime: number) => {
  return appointment.TravelTime || generateRandomTravelTime(minTravelTime, maxTravelTime);
};

// Function to format hours and minutes
const formatHoursAndMinutes = (hours: number) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

export default function HoursPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isHydrated, setIsHydrated] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([]);
  const [hoursSummary, setHoursSummary] = useState<HoursSummary>({
    appointmentHours: 0,
    travelHours: 0,
    cleaningHours: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(false);
  const [travelTimeStats, setTravelTimeStats] = useState({ min: 15, max: 45 }); // Default values

  // Load saved date from localStorage on hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDate = window.localStorage.getItem('calendarMonth');
        if (savedDate) {
          const parsedDate = parseISO(savedDate);
          if (!isNaN(parsedDate.getTime())) {
            console.log('Using saved date from localStorage:', format(parsedDate, 'MMMM yyyy'));
            setCurrentDate(parsedDate);
          }
        }
      } catch (err) {
        console.error('Error reading from localStorage:', err);
      }
      setIsHydrated(true);
    }
  }, []);

  // Fetch all appointments to calculate travel time statistics
  useEffect(() => {
    const fetchTravelTimeStats = async () => {
      try {
        const response = await endpoints.travelTimes.getStats();
        if (response.data) {
          setTravelTimeStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching travel time statistics:', error);
      }
    };

    fetchTravelTimeStats();
  }, []);

  useEffect(() => {
    if (isHydrated) {
      fetchAppointments();
    }
  }, [currentDate, isHydrated]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Fetch appointments for each day in the month
      const appointmentsPromises = [];
      let dateIterator = new Date(monthStart);
      
      while (dateIterator <= monthEnd) {
        const dateStr = format(dateIterator, 'yyyy-MM-dd');
        appointmentsPromises.push(endpoints.appointments.getByDate(dateStr));
        dateIterator.setDate(dateIterator.getDate() + 1);
      }
      
      const responses = await Promise.all(appointmentsPromises);
      const allAppointments = responses.flatMap(response => response.data || []);
      
      // Filter out cancelled appointments and sort by date and time
      const validAppointments = allAppointments
        .filter(app => app.StatusLabel !== 'Cancelled')
        .sort((a, b) => new Date(a.Date + 'T' + a.TimeStart).getTime() - new Date(b.Date + 'T' + b.TimeStart).getTime());
      
      setAppointments(validAppointments);
      calculateHours(validAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (appointments: Appointment[]) => {
    // Group appointments by date
    const appointmentsByDate = appointments.reduce((acc, app) => {
      const date = app.Date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(app);
      return acc;
    }, {} as Record<string, Appointment[]>);

    // Calculate hours for each day
    const summaries: DaySummary[] = [];
    let totalAppointmentHours = 0;
    let totalTravelHours = 0;
    let totalCleaningHours = 0;

    Object.entries(appointmentsByDate).forEach(([date, dayAppointments]) => {
      // Sort appointments by time
      const sortedAppointments = [...dayAppointments].sort((a, b) => 
        new Date(a.TimeStart).getTime() - new Date(b.TimeStart).getTime()
      );

      // Calculate appointment hours
      const appointmentHours = dayAppointments.reduce((sum, app) => 
        sum + (app.ActualDuration / 60), 0
      );

      // Calculate travel hours
      let travelHours = 0;
      if (sortedAppointments.length > 0) {
  
        // Get last appointment time
        const lastAppointment = sortedAppointments[sortedAppointments.length - 1];

        // Add travel time for first appointment (home to work)
        travelHours += getTravelTime(sortedAppointments[0], travelTimeStats.min, travelTimeStats.max) / 60;

        // Add travel time for last appointment (work to home)
        travelHours += getTravelTime(lastAppointment, travelTimeStats.min, travelTimeStats.max) / 60;
      }

      // Add 40 minutes cleaning time if there were appointments that day
      const cleaningHours = dayAppointments.length > 0 ? 40 / 60 : 0;

      const totalHours = appointmentHours + travelHours + cleaningHours;

      summaries.push({
        date,
        appointments: dayAppointments,
        appointmentHours: Number(appointmentHours.toFixed(2)),
        travelHours: Number(travelHours.toFixed(2)),
        cleaningHours: Number(cleaningHours.toFixed(2)),
        totalHours: Number(totalHours.toFixed(2)),
        isExpanded: false
      });

      totalAppointmentHours += appointmentHours;
      totalTravelHours += travelHours;
      totalCleaningHours += cleaningHours;
    });

    setDaySummaries(summaries);
    setHoursSummary({
      appointmentHours: Number(totalAppointmentHours.toFixed(2)),
      travelHours: Number(totalTravelHours.toFixed(2)),
      cleaningHours: Number(totalCleaningHours.toFixed(2)),
      totalHours: Number((totalAppointmentHours + totalTravelHours + totalCleaningHours).toFixed(2))
    });
  };

  const toggleDayExpansion = (date: string) => {
    setDaySummaries(prev => prev.map(summary => 
      summary.date === date 
        ? { ...summary, isExpanded: !summary.isExpanded }
        : summary
    ));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hours Overview</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToCurrentMonth}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {format(currentDate, 'MMMM yyyy')}
          </button>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Appointment Hours</h3>
              <p className="text-3xl font-bold text-blue-600">{formatHoursAndMinutes(hoursSummary.appointmentHours)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Travel Hours</h3>
              <p className="text-3xl font-bold text-green-600">{formatHoursAndMinutes(hoursSummary.travelHours)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Cleaning Hours</h3>
              <p className="text-3xl font-bold text-purple-600">{formatHoursAndMinutes(hoursSummary.cleaningHours)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Total Hours</h3>
              <p className="text-3xl font-bold text-gray-800">{formatHoursAndMinutes(hoursSummary.totalHours)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {daySummaries.map((summary) => (
              <div key={summary.date} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => toggleDayExpansion(summary.date)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">
                      {format(new Date(summary.date), 'EEEE, MMMM d, yyyy')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {summary.appointments.length} appointment{summary.appointments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Hours</div>
                      <div className="text-lg font-semibold">{formatHoursAndMinutes(summary.totalHours)}</div>
                    </div>
                    {summary.isExpanded ? (
                      <FaChevronUp className="w-5 h-5" />
                    ) : (
                      <FaChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {summary.isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="px-6 py-4 grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Appointment Hours</h4>
                        <p className="text-lg font-semibold text-blue-600">{formatHoursAndMinutes(summary.appointmentHours)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Travel Hours</h4>
                        <p className="text-lg font-semibold text-green-600">{formatHoursAndMinutes(summary.travelHours)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Cleaning Hours</h4>
                        <p className="text-lg font-semibold text-purple-600">{formatHoursAndMinutes(summary.cleaningHours)}</p>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="mb-4">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-500">Travel Time</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatHoursAndMinutes(summary.travelHours)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-500">Cleaning Time</span>
                          <span className="text-sm font-semibold text-purple-600">
                            {formatHoursAndMinutes(summary.cleaningHours)}
                          </span>
                        </div>
                      </div>

                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {summary.appointments.map((appointment) => (
                            <tr key={appointment.Id}>
                              <td className="px-4 py-2 text-sm">{appointment.CustomerName}</td>
                              <td className="px-4 py-2 text-sm">
                                {appointment.dogServices ? (
                                  appointment.dogServices.map(dogService => 
                                    `${dogService.DogName}: ${dogService.services.map(s => s.ServiceName).join(', ')}`
                                  ).join('; ')
                                ) : (
                                  appointment.Dogs ? appointment.Dogs.join(', ') : 'No services listed'
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">{appointment.ActualDuration} min</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 