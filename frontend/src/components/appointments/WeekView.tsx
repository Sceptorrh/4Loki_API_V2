'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, getDay, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { FaCalendarCheck, FaCalendarTimes, FaCalendarDay, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

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
  startPosition?: number;
  endPosition?: number;
  duration?: number;
}

interface CalendarAppointment {
  AppointmentId: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  ContactPerson: string;
  Status: {
    Id: string;
    Label: string;
    Color: string;
    HexColor?: string;
  };
  Dogs: {
    DogId: number;
    DogName: string;
    ServiceCount: number;
  }[];
}

interface WeekViewProps {
  currentDate: Date;
  appointments: CalendarAppointment[];
}

export default function WeekView({ currentDate, appointments }: WeekViewProps) {
  const [weekAppointments, setWeekAppointments] = useState<DailyAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get start and end of the week for the current date (Monday to Friday)
    let startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
    const endDate = addDays(startDate, 4); // End on Friday (5 days total)
    
    console.log('WeekView - Current date:', format(currentDate, 'yyyy-MM-dd'));
    console.log('WeekView - Week range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('WeekView - Appointments from parent:', appointments?.length || 0);
    
    const fetchWeekAppointments = async () => {
      try {
        setLoading(true);
        const appointments: DailyAppointment[] = [];
        
        // Fetch appointments for each day in the week
        for (let i = 0; i < 5; i++) {
          const date = addDays(startDate, i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          console.log(`WeekView - Fetching appointments for date: ${formattedDate}`);
          const response = await endpoints.appointments.getByDate(formattedDate);
          console.log(`WeekView - API response for ${formattedDate}:`, response.data);
          
          // Process the response data
          const dailyAppointments = response.data.map((appt: any) => {
            // Map calendar appointment to daily appointment format
            return {
              Id: appt.Id,
              CustomerId: appt.CustomerId,
              CustomerName: appt.CustomerName || appt.ContactPerson,
              Date: appt.Date,
              TimeStart: appt.TimeStart,
              TimeEnd: appt.TimeEnd,
              StatusId: appt.StatusId || appt.Status?.Id,
              StatusLabel: appt.StatusLabel || appt.Status?.Label,
              ActualDuration: appt.ActualDuration || 60,
              EstimatedDuration: appt.EstimatedDuration || 60,
              Dogs: appt.Dogs?.map((dog: any) => dog.DogName) || []
            };
          });
          
          console.log(`WeekView - Processed appointments for ${formattedDate}:`, dailyAppointments);
          appointments.push(...dailyAppointments);
        }
        
        console.log('WeekView - All fetched appointments:', appointments);
        setWeekAppointments(appointments);
        setError(null);
      } catch (err) {
        console.error('Error fetching week appointments:', err);
        setError('Failed to load appointments for the week.');
      } finally {
        setLoading(false);
      }
    };
    
    // If we already have appointments data from the parent, use that instead
    if (appointments && appointments.length > 0) {
      // Filter and convert appointments for the current week
      const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endOfWeekDate = addDays(startOfWeekDate, 4);
      
      console.log('WeekView - Using parent appointments, filtering for week:', 
        format(startOfWeekDate, 'yyyy-MM-dd'), 'to', format(endOfWeekDate, 'yyyy-MM-dd'));
      console.log('WeekView - Parent appointments before filtering:', appointments);
      
      const filteredAppointments = appointments
        .filter(appt => {
          const apptDate = parseISO(appt.Date);
          const inRange = apptDate >= startOfWeekDate && apptDate <= endOfWeekDate;
          if (inRange) {
            console.log('WeekView - In range appointment:', appt);
          }
          return inRange;
        })
        .map(appt => {
          console.log('WeekView - Mapping appointment:', appt);
          return {
            Id: appt.AppointmentId,
            CustomerId: 0, // Not needed for display
            CustomerName: appt.ContactPerson,
            Date: appt.Date,
            TimeStart: appt.TimeStart,
            TimeEnd: appt.TimeEnd,
            StatusId: appt.Status.Id,
            StatusLabel: appt.Status.Label,
            ActualDuration: 60, // Default if not available
            EstimatedDuration: 60, // Default if not available
            Dogs: appt.Dogs.map(dog => dog.DogName)
          };
        });
      
      console.log('WeekView - Filtered appointments from parent:', filteredAppointments);
      setWeekAppointments(filteredAppointments);
    } else {
      console.log('WeekView - No parent appointments, fetching directly from API');
      fetchWeekAppointments();
    }
  }, [currentDate, appointments]);

  // Configure time slots (8:00 to 21:00 in 30-minute intervals)
  const timeSlots = [];
  for (let hour = 8; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 21 && minute > 0) continue; // Don't go past 21:00
      
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      timeSlots.push(time);
    }
  }

  // Get weekdays starting from the current week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = Array.from({ length: 5 }).map((_, index) => addDays(weekStart, index));

  // Function to get appointment display color based on status
  const getAppointmentColor = (appointment: DailyAppointment) => {
    // Status-based coloring
    const statusColors: Record<string, string> = {
      'Can': 'bg-red-100 border-red-300',
      'Exp': 'bg-green-100 border-green-300',
      'Inv': 'bg-blue-100 border-blue-300',
      'NotExp': 'bg-yellow-100 border-yellow-300',
      'Pln': 'bg-purple-100 border-purple-300'
    };
    
    return statusColors[appointment.StatusId] || 'bg-gray-100 border-gray-300';
  };

  // Preprocess appointments to calculate positions
  const processAppointmentsForDay = (day: Date, appointments: DailyAppointment[]) => {
    return appointments
      .filter(appointment => isSameDay(parseISO(appointment.Date), day))
      .map(appointment => {
        // Parse start and end times - strip seconds if present
        const startTimeNoSeconds = appointment.TimeStart.substring(0, 5);
        const endTimeNoSeconds = appointment.TimeEnd.substring(0, 5);
        
        const [startHours, startMinutes] = startTimeNoSeconds.split(':').map(Number);
        const [endHours, endMinutes] = endTimeNoSeconds.split(':').map(Number);
        
        // Convert to minutes from 8:00 AM for calculation
        const startMinutesFromMidnight = startHours * 60 + startMinutes;
        const endMinutesFromMidnight = endHours * 60 + endMinutes;
        
        // Calculate grid positions
        const startPosition = (startMinutesFromMidnight - 8 * 60) / 30; // Each position is 30 minutes
        const endPosition = (endMinutesFromMidnight - 8 * 60) / 30;
        const duration = (endMinutesFromMidnight - startMinutesFromMidnight) / 30; // In 30-min slots
        
        return {
          ...appointment,
          startPosition,
          endPosition,
          duration
        };
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading week view...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-6 gap-0.5 mb-0.5">
        <div className="text-center py-2 bg-gray-100 text-sm font-medium">Hour</div>
        {weekDays.map((day, index) => {
          const dayAppts = processAppointmentsForDay(day, weekAppointments);
          console.log(`WeekView - Appointments for ${format(day, 'yyyy-MM-dd')}:`, dayAppts.length);
          return (
            <div 
              key={index} 
              className={`text-center py-2 ${isSameDay(day, new Date()) ? 'bg-blue-100' : 'bg-gray-100'} text-sm font-medium`}
            >
              {format(day, 'EEE')}<br/>
              {format(day, 'd MMM')}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-6 gap-0.5 flex-grow border rounded-md overflow-hidden">
        {/* Time slots */}
        {timeSlots.map((timeSlot, slotIndex) => (
          <React.Fragment key={`timeslot-${slotIndex}`}>
            {/* Time column */}
            <div className={`p-1 border-b border-r bg-gray-50 text-xs font-medium text-gray-700 ${timeSlot.getMinutes() === 0 ? 'font-bold' : ''}`}>
              {format(timeSlot, 'HH:mm')}
            </div>
            
            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = processAppointmentsForDay(day, weekAppointments);
              const isCurrentTimeSlot = (appointment: DailyAppointment) => {
                const slotTime = format(timeSlot, 'HH:mm');
                const [slotHour, slotMinute] = slotTime.split(':').map(Number);
                const slotMinutesFromMidnight = slotHour * 60 + slotMinute;
                
                // Trim seconds from time strings
                const startTimeNoSeconds = appointment.TimeStart.substring(0, 5);
                const endTimeNoSeconds = appointment.TimeEnd.substring(0, 5);
                
                const [startHour, startMinute] = startTimeNoSeconds.split(':').map(Number);
                const [endHour, endMinute] = endTimeNoSeconds.split(':').map(Number);
                
                const startMinutesFromMidnight = startHour * 60 + startMinute;
                const endMinutesFromMidnight = endHour * 60 + endMinute;
                
                return slotMinutesFromMidnight >= startMinutesFromMidnight && 
                       slotMinutesFromMidnight < endMinutesFromMidnight;
              };
              
              const currentAppointments = dayAppointments.filter(isCurrentTimeSlot);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={`day-${dayIndex}-slot-${slotIndex}`}
                  className={`border-b relative min-h-[40px] ${
                    isToday ? 'bg-blue-50' : timeSlot.getMinutes() === 0 ? 'bg-gray-50' : ''
                  }`}
                >
                  {currentAppointments.map((appointment, index) => {
                    const color = getAppointmentColor(appointment);
                    
                    // Get the time without seconds for comparison
                    const appointmentStartTime = appointment.TimeStart.substring(0, 5);
                    const slotTime = format(timeSlot, 'HH:mm');
                    const isStartSlot = appointmentStartTime === slotTime;
                    
                    // Only render at start slot
                    if (!isStartSlot) return null;
                    
                    console.log(`Rendering appointment at ${slotTime}:`, appointment);
                    
                    return (
                      <Link 
                        href={`/appointments/${appointment.Id}`}
                        key={`appt-${appointment.Id}`}
                        className={`${color} border rounded-sm text-xs absolute inset-x-0.5 p-1 z-10`}
                        style={{ 
                          top: '2px',
                          height: `calc(${Math.max(appointment.duration || 1, 1) * 40}px - 4px)`,
                          zIndex: 10
                        }}
                      >
                        <div className="font-medium truncate">{appointment.CustomerName}</div>
                        <div className="flex justify-between">
                          <span className="truncate">{appointment.Dogs.join(', ')}</span>
                          <span className="whitespace-nowrap">
                            {appointment.TimeStart.substring(0, 5)}-{appointment.TimeEnd.substring(0, 5)}
                          </span>
                        </div>
                        <div className="absolute top-0 left-0 w-1 h-full" style={{
                          backgroundColor: appointment.StatusId === 'Can' ? '#ef4444' :
                                          appointment.StatusId === 'Exp' ? '#22c55e' :
                                          appointment.StatusId === 'Inv' ? '#3b82f6' :
                                          appointment.StatusId === 'NotExp' ? '#eab308' :
                                          appointment.StatusId === 'Pln' ? '#8b5cf6' : '#9ca3af'
                        }}></div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 