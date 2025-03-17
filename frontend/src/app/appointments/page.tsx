'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface Dog {
  DogId: number;
  DogName: string;
  ServiceCount: number;
}

interface Status {
  Id: string;
  Label: string;
  Color: string;
  HexColor?: string;
}

interface CalendarAppointment {
  AppointmentId: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  ContactPerson: string;
  Status: Status;
  Dogs: Dog[];
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  const fetchAppointmentsByMonth = async (year: number, month: number) => {
    try {
      setLoading(true);
      const response = await endpoints.appointments.getByYearMonth(year, month);
      setAppointments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    fetchAppointmentsByMonth(year, month);
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    // Check if the day is a weekday (not Saturday or Sunday)
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend day - don't allow appointment creation
      return;
    }
    
    // Format the date as YYYY-MM-DD for the URL
    const formattedDate = format(day, 'yyyy-MM-dd');
    router.push(`/appointments/new?date=${formattedDate}`);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Filter out weekends (Saturday = 6, Sunday = 0)
    const weekdaysOnly = days.filter(day => {
      const dayNum = getDay(day);
      return dayNum !== 0 && dayNum !== 6; // Exclude Sunday (0) and Saturday (6)
    });
    
    // Group days by week for better layout control
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    
    // Initialize with empty days for the first week if needed
    if (weekdaysOnly.length > 0) {
      const firstDay = weekdaysOnly[0];
      const firstDayOfWeek = getDay(firstDay);
      
      // If first day is not Monday (1), add empty slots
      // Convert Sunday (0) to 5 (after Friday), and shift others to 0-based for Monday
      const emptyDaysAtStart = firstDayOfWeek === 0 ? 0 : firstDayOfWeek - 1;
      
      for (let i = 0; i < emptyDaysAtStart; i++) {
        currentWeek.push(null);
      }
    }
    
    // Add all weekdays to the appropriate week
    weekdaysOnly.forEach((day, index) => {
      const dayOfWeek = getDay(day);
      
      // Add the day to the current week
      currentWeek.push(day);
      
      // If it's Friday (5) or the last day of the month, start a new week
      if (dayOfWeek === 5 || index === weekdaysOnly.length - 1) {
        // If this week doesn't have 5 days yet, add empty cells to fill the row
        while (currentWeek.length < 5) {
          currentWeek.push(null);
        }
        
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    // If there are any remaining days in the current week, add them
    if (currentWeek.length > 0) {
      // Fill the rest of the week with empty cells
      while (currentWeek.length < 5) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="flex flex-col h-full">
        {/* Day headers - weekdays only */}
        <div className="grid grid-cols-5 gap-0.5 mb-0.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
            <div key={index} className="text-center font-semibold py-1 bg-gray-100 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="grid grid-rows-[repeat(auto-fill,1fr)] gap-0.5 flex-grow">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid grid-cols-5 gap-0.5 h-full">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="bg-gray-50 h-full"></div>;
                }

                // Find appointments for this day
                const dayAppointments = appointments.filter(appointment => 
                  isSameDay(new Date(appointment.Date), day)
                );

                // Check if it's today
                const isToday = isSameDay(day, new Date());

                // Always show up to 5 appointments
                const maxAppointments = 5;

                return (
                  <div 
                    key={`day-${weekIndex}-${dayIndex}`} 
                    className={`border border-gray-200 p-0.5 overflow-hidden cursor-pointer transition-colors relative h-full
                      ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className={`text-right text-xs font-medium mb-0.5 py-0.5 px-1
                      ${isToday ? 'bg-blue-100' : 'bg-gray-50'}`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, maxAppointments).map(appointment => {
                        // Format dog names for display and tooltip
                        const dogNames = appointment.Dogs.map(dog => dog.DogName).join(', ');
                        // Get first name of customer for shorter display
                        const customerFirstName = appointment.ContactPerson.split(' ')[0];
                        
                        return (
                          <Link 
                            href={`/appointments/${appointment.AppointmentId}`}
                            key={appointment.AppointmentId} 
                            className="block text-xs py-0.5 px-1 rounded hover:bg-opacity-90 transition-colors"
                            style={{ backgroundColor: `${appointment.Status.HexColor || appointment.Status.Color}15`, borderLeft: `2px solid ${appointment.Status.HexColor || appointment.Status.Color}` }}
                            onClick={(e) => e.stopPropagation()} // Prevent day click when clicking on appointment
                            title={`${format(new Date(`${appointment.Date}T${appointment.TimeStart}`), 'HH:mm')} - ${dogNames} - ${appointment.ContactPerson}`}
                          >
                            <div className="flex items-center">
                              <span className="w-8 flex-shrink-0 font-medium text-xs">
                                {format(new Date(`${appointment.Date}T${appointment.TimeStart}`), 'HH:mm')}
                              </span>
                              <span className="flex-grow font-medium text-xs truncate mx-1">
                                {dogNames}
                              </span>
                              <span className="flex-shrink-0 text-xs text-gray-500 truncate">
                                {customerFirstName}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                      {dayAppointments.length > maxAppointments && (
                        <div 
                          className="text-xs text-center text-gray-500 mt-0.5 bg-gray-50 py-0.5 rounded"
                          onClick={(e) => e.stopPropagation()} // Prevent day click when clicking on "more" indicator
                        >
                          +{dayAppointments.length - maxAppointments} more
                        </div>
                      )}
                      {dayAppointments.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-xs text-gray-400 bg-white bg-opacity-80 px-2 py-1 rounded">
                            Click to add
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col px-1 py-1">
      <div className="flex justify-center items-center mb-1">
        <button 
          onClick={goToPreviousMonth} 
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          <FaChevronLeft />
        </button>
        <h2 
          className="text-lg font-semibold mx-4 cursor-pointer hover:text-primary-600 transition-colors"
          onClick={goToCurrentMonth}
          title="Click to return to current month"
        >
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={goToNextMonth} 
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          <FaChevronRight />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex-grow flex flex-col bg-gray-50 rounded-lg">
          <div className="p-4 text-center">
            <p className="text-gray-500 mb-2">No appointments found for {format(currentDate, 'MMMM yyyy')}</p>
            <p className="text-gray-500 text-sm mb-4">Click on a day to schedule an appointment</p>
            <button 
              onClick={() => {
                // Create a date in the middle of the current month
                const middleOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
                // Find the next weekday if the 15th is a weekend
                let dateToUse = middleOfMonth;
                const dayOfWeek = getDay(middleOfMonth);
                if (dayOfWeek === 0) { // Sunday
                  dateToUse = new Date(middleOfMonth.setDate(middleOfMonth.getDate() + 1)); // Move to Monday
                } else if (dayOfWeek === 6) { // Saturday
                  dateToUse = new Date(middleOfMonth.setDate(middleOfMonth.getDate() + 2)); // Move to Monday
                }
                const formattedDate = format(dateToUse, 'yyyy-MM-dd');
                router.push(`/appointments/new?date=${formattedDate}`);
              }}
              className="btn btn-primary"
            >
              Create Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-grow overflow-hidden flex flex-col">
          {renderCalendar()}
        </div>
      )}
    </div>
  );
} 