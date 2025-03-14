'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Dog {
  DogId: number;
  DogName: string;
  ServiceCount: number;
}

interface Status {
  Id: string;
  Label: string;
  Color: string;
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

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Create a grid with 7 columns (days of the week)
    const dayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const emptyDays = Array(dayOfWeek).fill(null);
    const calendarDays = [...emptyDays, ...days];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center font-semibold py-2 bg-gray-100">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-40 bg-gray-50"></div>;
          }

          // Find appointments for this day
          const dayAppointments = appointments.filter(appointment => 
            isSameDay(new Date(appointment.Date), day)
          );

          return (
            <div key={index} className="h-40 border border-gray-200 p-1">
              <div className="text-right text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              
              {dayAppointments.map(appointment => (
                <Link 
                  href={`/appointments/${appointment.AppointmentId}`}
                  key={appointment.AppointmentId} 
                  className="block mb-1 text-xs p-1.5 rounded hover:bg-opacity-90 transition-colors"
                  style={{ backgroundColor: `${appointment.Status.Color}20`, borderLeft: `3px solid ${appointment.Status.Color}` }}
                >
                  <div className="font-semibold">
                    {format(new Date(`${appointment.Date}T${appointment.TimeStart}`), 'h:mm a')} - {format(new Date(`${appointment.Date}T${appointment.TimeEnd}`), 'h:mm a')}
                  </div>
                  <div className="truncate">{appointment.ContactPerson}</div>
                  <div className="truncate text-gray-600">
                    {appointment.Dogs.map(dog => dog.DogName).join(', ')}
                  </div>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <Link href="/appointments/new" className="btn btn-primary">
          New Appointment
        </Link>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={goToPreviousMonth} 
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          <FaChevronLeft />
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={goToNextMonth} 
          className="p-2 rounded-full hover:bg-gray-100"
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
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No appointments found for {format(currentDate, 'MMMM yyyy')}</p>
          <Link href="/appointments/new" className="btn btn-primary">
            Schedule an appointment
          </Link>
        </div>
      ) : (
        renderCalendar()
      )}
    </div>
  );
} 