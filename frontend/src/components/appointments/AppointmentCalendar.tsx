'use client';

import { useState, useCallback, useEffect } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from 'moment';
import { format, addMinutes, differenceInMinutes } from 'date-fns';

// Configure the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

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

interface AppointmentCalendarProps {
  appointmentDate: Date;
  startTime: Date;
  setStartTime: (time: Date) => void;
  endTime: Date;
  setEndTime: (time: Date) => void;
  dailyAppointments: DailyAppointment[];
}

// Helper function to safely parse time and convert to Date
function parseTimeToDate(timeString: string | null | undefined, baseDate: Date): Date {
  if (!timeString) return baseDate;
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  } catch (error) {
    console.error("Error parsing time:", error);
    return baseDate;
  }
}

// Helper function to format duration in minutes to hours and minutes
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${mins} min`;
  }
}

export default function AppointmentCalendar({
  appointmentDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  dailyAppointments
}: AppointmentCalendarProps) {
  
  // Convert dailyAppointments to events for the calendar
  const calendarEvents = dailyAppointments.map(appointment => {
    const appointmentDate = new Date(appointment.Date);
    const start = parseTimeToDate(appointment.TimeStart, appointmentDate);
    const end = parseTimeToDate(appointment.TimeEnd, appointmentDate);
    
    // Calculate ratio for color coding
    let colorClass = 'bg-gray-100 border-gray-300';
    
    if (appointment.ActualDuration && appointment.EstimatedDuration) {
      const ratio = appointment.ActualDuration / appointment.EstimatedDuration;
      
      if (ratio >= 1.2) {
        colorClass = 'bg-green-100 border-green-300';
      } else if (ratio >= 0.95) {
        colorClass = 'bg-gray-100 border-gray-300';
      } else if (ratio >= 0.8) {
        colorClass = 'bg-orange-100 border-orange-300';
      } else {
        colorClass = 'bg-red-100 border-red-300';
      }
    }
    
    return {
      id: appointment.Id,
      title: `${appointment.CustomerName} - ${appointment.Dogs.join(', ')}`,
      start,
      end,
      colorClass,
      resource: appointment
    };
  });
  
  // Add current appointment selection as an event
  const currentAppointment = {
    id: 'current',
    title: 'Current Selection',
    start: startTime,
    end: endTime,
    colorClass: 'bg-blue-100 border-blue-500 border-dashed',
    resource: { 
      CustomerName: 'Current Selection',
      Dogs: []
    }
  };
  
  const allEvents = [...calendarEvents, currentAppointment];
  
  // Add custom CSS for React Big Calendar
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .rbc-time-view {
        border-radius: 0.375rem;
        overflow: hidden;
      }
      .rbc-time-header {
        background-color: #f9fafb;
        min-height: 25px;
      }
      .rbc-timeslot-group {
        min-height: 30px;
      }
      .rbc-time-slot {
        min-height: 8px;
      }
      .rbc-time-gutter {
        font-size: 0.7rem;
        color: #4b5563;
        background-color: #f9fafb;
        border-right: 1px solid #e5e7eb;
        padding: 0 4px;
      }
      .rbc-day-slot .rbc-events-container {
        margin-right: 1px;
      }
      .rbc-current-time-indicator {
        background-color: #3b82f6;
        height: 1px;
      }
      .rbc-label {
        font-size: 0.7rem;
        font-weight: 500;
        padding: 2px;
      }
      .rbc-day-slot .rbc-time-slot {
        border-top: 1px solid #f3f4f6;
      }
      .rbc-label.rbc-time-header-gutter {
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
        padding: 2px;
      }
      .rbc-event {
        background-color: transparent;
        color: #111827;
        border: none;
        border-radius: 0.25rem;
        box-shadow: none;
        padding: 0;
      }
      .rbc-day-slot .rbc-event {
        border: none;
        padding: 0;
        overflow: hidden;
      }
      .rbc-day-slot .rbc-background-event {
        opacity: 1;
      }
      .rbc-event-label {
        display: none;
      }
      .current-selection-event {
        position: relative;
      }
      .current-selection-event:after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        border: 2px dashed #3b82f6;
        pointer-events: none;
      }
      .rbc-day-slot .rbc-selecting {
        background-color: rgba(59, 130, 246, 0.1);
      }
      .rbc-slot-selection {
        background-color: rgba(59, 130, 246, 0.2);
        border: 1px solid #3b82f6;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Handle slot selection in the calendar
  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
    // Ensure the selected time is on the appointment date
    const newStartTime = new Date(appointmentDate);
    newStartTime.setHours(start.getHours(), start.getMinutes(), 0, 0);
    
    const newEndTime = new Date(appointmentDate);
    newEndTime.setHours(end.getHours(), end.getMinutes(), 0, 0);
    
    // Log the original selection for debugging
    console.log('Raw calendar selection:', {
      start: format(start, 'HH:mm'),
      end: format(end, 'HH:mm'),
      durationMinutes: differenceInMinutes(end, start)
    });
    
    // Check if new start time is within working hours
    const minStartTime = new Date(appointmentDate);
    minStartTime.setHours(8, 0, 0, 0);
    
    const maxEndTime = new Date(appointmentDate);
    maxEndTime.setHours(21, 0, 0, 0);
    
    // Constrain within working hours
    if (newStartTime < minStartTime) {
      console.log('Start time before working hours, adjusting to 8:00 AM');
      newStartTime.setHours(8, 0, 0, 0);
    }
    
    if (newEndTime > maxEndTime) {
      console.log('End time after working hours, adjusting to 9:00 PM');
      newEndTime.setHours(21, 0, 0, 0);
    }
    
    // Only apply a minimum duration constraint of 15 minutes
    // but strictly respect user's selection otherwise
    const minDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
    const selectedDuration = newEndTime.getTime() - newStartTime.getTime();
    
    console.log('User selected duration:', {
      startTime: format(newStartTime, 'HH:mm'),
      endTime: format(newEndTime, 'HH:mm'),
      durationMinutes: selectedDuration / 60000,
      durationFormatted: formatDuration(Math.round(selectedDuration / 60000))
    });
    
    if (selectedDuration < minDuration) {
      console.log('Selection too short, extending to minimum 15 minutes');
      // Only if less than minimum duration, extend to 15 minutes
      newEndTime.setTime(newStartTime.getTime() + minDuration);
      
      // If extending pushes beyond max hours, adjust start time instead
      if (newEndTime > maxEndTime) {
        console.log('Extended end time exceeds working hours, adjusting start time instead');
        newEndTime.setTime(maxEndTime.getTime());
        newStartTime.setTime(newEndTime.getTime() - minDuration);
      }
      
      console.log('Adjusted to minimum duration:', {
        startTime: format(newStartTime, 'HH:mm'),
        endTime: format(newEndTime, 'HH:mm'),
        durationMinutes: (newEndTime.getTime() - newStartTime.getTime()) / 60000
      });
    } else {
      // For any selection >= 15 minutes, use EXACTLY what the user selected
      // No rounding, no snapping to other durations
      console.log('Using exact user selection (>= 15 min):', {
        startTime: format(newStartTime, 'HH:mm'),
        endTime: format(newEndTime, 'HH:mm'),
        durationMinutes: (newEndTime.getTime() - newStartTime.getTime()) / 60000,
        durationFormatted: formatDuration(Math.round((newEndTime.getTime() - newStartTime.getTime()) / 60000))
      });
    }
    
    // Important: we're using the exact time selection made by the user
    // There is NO adjustment to match estimated duration
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  }, [appointmentDate, setStartTime, setEndTime]);

  // Custom event component
  const EventComponent = ({ event }: { event: any }) => {
    const { colorClass, resource, id } = event;
    const isCurrentSelection = id === 'current';
    
    return (
      <div 
        className={`${colorClass} h-full border-l-2 px-0.5 py-0.5 text-[10px] overflow-hidden shadow-sm ${isCurrentSelection ? 'current-selection-event' : ''}`}
      >
        <div className="font-medium truncate leading-tight">{resource.CustomerName}</div>
        {resource.Dogs && resource.Dogs.length > 0 && (
          <div className="truncate text-[9px] text-gray-600 leading-tight">
            {resource.Dogs.join(', ')}
          </div>
        )}
      </div>
    );
  };

  const minTime = new Date(new Date(appointmentDate).setHours(8, 0, 0, 0));
  const maxTime = new Date(new Date(appointmentDate).setHours(21, 0, 0, 0));

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={allEvents}
        defaultView={Views.DAY}
        views={[Views.DAY]}
        step={15}
        timeslots={1}
        date={appointmentDate}
        min={minTime}
        max={maxTime}
        selectable
        onSelectSlot={handleSelectSlot}
        components={{
          event: EventComponent
        }}
        formats={{
          timeGutterFormat: (date: Date) => {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour = hours % 12 || 12;
            return minutes === 0 ? `${hour} ${ampm}` : `${hour}:${minutes.toString().padStart(2, '0')}`;
          }
        }}
        className="h-full"
        tooltipAccessor={null}
      />
    </div>
  );
} 