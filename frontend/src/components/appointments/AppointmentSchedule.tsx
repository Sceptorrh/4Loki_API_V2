'use client';

import { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, setHours, setMinutes, getDay } from 'date-fns';
import { generateTimeOptions, snapTo15Minutes } from '@/lib/appointments';
import { endpoints } from '@/lib/api';

// Format duration from minutes to hours and minutes
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

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

interface AppointmentScheduleProps {
  appointmentDate: Date;
  setAppointmentDate: (date: Date) => void;
  startTime: Date;
  setStartTime: (time: Date) => void;
  endTime: Date;
  setEndTime: (time: Date) => void;
  setDailyAppointments: (appointments: DailyAppointment[]) => void;
  dailyAppointments: DailyAppointment[];
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  dragType: 'start' | 'end' | 'both' | null;
  setDragType: (type: 'start' | 'end' | 'both' | null) => void;
  selectedDogIds: number[];
  totalDuration: number;
  onAppointmentsFetched?: () => void;
}

export default function AppointmentSchedule({
  appointmentDate,
  setAppointmentDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  setDailyAppointments,
  dailyAppointments,
  isDragging,
  setIsDragging,
  dragType,
  setDragType,
  selectedDogIds,
  totalDuration,
  onAppointmentsFetched
}: AppointmentScheduleProps) {
  // Function to filter out weekends
  const isWeekday = (date: Date) => {
    const day = getDay(date);
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
  };

  // Fetch appointments for the selected date
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
      
      // Notify parent component that appointments were fetched
      if (onAppointmentsFetched) {
        console.log('Notifying parent that appointments were fetched');
        onAppointmentsFetched();
      }
    } catch (err) {
      console.error('Error fetching daily appointments:', err);
      setDailyAppointments([]);
      
      // Even on error, notify the parent that the fetch operation completed
      if (onAppointmentsFetched) {
        console.log('Notifying parent that appointments fetch completed (with error)');
        onAppointmentsFetched();
      }
    }
  };

  // Update appointments when date changes
  useEffect(() => {
    if (appointmentDate) {
      fetchDailyAppointments(appointmentDate);
    }
  }, [appointmentDate]);

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
      
      // Store positions in drag state but DO NOT update React state
      // This is crucial to prevent re-renders during dragging
      dragState._tempStartTime = newStartTime;
      dragState._tempEndTime = newEndTime;
    }
    
    function onMouseUp() {
      const dragState = (window as any).currentDragState;
      if (!dragState) return;
      
      console.log('Drag ended, finalizing position');
      
      // Use the temporarily stored times from dragging
      const startTimeToUse = dragState._tempStartTime || startTime;
      const endTimeToUse = dragState._tempEndTime || endTime;
      
      // Snap times to 15-minute intervals
      const snappedStartTime = snapTo15Minutes(startTimeToUse);
      const snappedEndTime = snapTo15Minutes(endTimeToUse);
      
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
      
      // Wait until all drag state is reset before updating React state
      // This prevents the infinite loop of state updates
      setTimeout(() => {
        console.log('Updating state after drag with final position');
        setStartTime(snappedStartTime);
        setEndTime(snappedEndTime);
        
      }, 10);
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
      
      // Store the times in the drag state object for use when drag ends
      // Don't update React state during dragging to prevent re-renders
      dragState._tempStartTime = newStartTime;
      dragState._tempEndTime = newEndTime;
    }
    
    function onTouchEnd() {
      const dragState = (window as any).currentTouchDragState;
      if (!dragState) return;
      
      console.log('Touch drag ended, finalizing position');
      
      // Use the temporarily stored times from dragging
      const startTimeToUse = dragState._tempStartTime || startTime;
      const endTimeToUse = dragState._tempEndTime || endTime;
      
      // Snap times to 15-minute intervals
      const snappedStartTime = snapTo15Minutes(startTimeToUse);
      const snappedEndTime = snapTo15Minutes(endTimeToUse);
      
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
      
      // Wait until all drag state is reset before updating React state
      // This prevents the infinite loop of state updates
      setTimeout(() => {
        console.log('Updating state after touch drag with final position');
        setStartTime(snappedStartTime);
        setEndTime(snappedEndTime);
        
      }, 10);
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

  // Function to render the day-view calendar
  const renderDayCalendar = () => {
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
      if (!appointment.ActualDuration || !appointment.EstimatedDuration) {
        return 'bg-gray-100 border-gray-300';
      }
      
      const ratio = appointment.ActualDuration / appointment.EstimatedDuration;
      
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
                className="absolute border-2 rounded-sm z-20 left-[70px] right-4 current-appointment"
                style={{ 
                  top: `${currentApptInfo.startPosition * 20}px`,
                  height: `${Math.max(currentApptInfo.duration * 20, 30)}px`, /* Increased minimum height */
                  cursor: isDragging ? 'grabbing' : 'grab',
                  backgroundColor: (() => {
                    const actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
                    const ratio = actualDuration / totalDuration;
                    
                    if (ratio >= 1.2) return 'rgba(220, 252, 231, 0.8)'; // green-100
                    if (ratio >= 0.95) return 'rgba(243, 244, 246, 0.8)'; // gray-100
                    if (ratio >= 0.8) return 'rgba(254, 240, 215, 0.8)'; // orange-100
                    return 'rgba(254, 226, 226, 0.8)'; // red-100
                  })(),
                  borderColor: (() => {
                    const actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
                    const ratio = actualDuration / totalDuration;
                    
                    if (ratio >= 1.2) return '#86efac'; // green-300
                    if (ratio >= 0.95) return '#d1d5db'; // gray-300
                    if (ratio >= 0.8) return '#fdba74'; // orange-300
                    return '#fca5a5'; // red-300
                  })()
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
                  className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize z-30 current-appointment-handle-start"
                  style={{
                    backgroundColor: (() => {
                      const actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
                      const ratio = actualDuration / totalDuration;
                      
                      if (ratio >= 1.2) return '#86efac'; // green-300
                      if (ratio >= 0.95) return '#d1d5db'; // gray-300
                      if (ratio >= 0.8) return '#fdba74'; // orange-300
                      return '#fca5a5'; // red-300
                    })()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAppointmentMouseDown(e, 'start');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleAppointmentTouchStart(e, 'start');
                  }}
                  title="Drag to adjust start time"
                >
                  <div className="w-full flex justify-center">
                    <svg className="h-2 w-6 text-white opacity-70" viewBox="0 0 24 8" fill="currentColor">
                      <rect x="0" y="0" width="24" height="2" rx="1" />
                      <rect x="0" y="3" width="24" height="2" rx="1" />
                      <rect x="0" y="6" width="24" height="2" rx="1" />
                    </svg>
                  </div>
                </div>
                <div 
                  className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize z-30 current-appointment-handle-end"
                  style={{
                    backgroundColor: (() => {
                      const actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
                      const ratio = actualDuration / totalDuration;
                      
                      if (ratio >= 1.2) return '#86efac'; // green-300
                      if (ratio >= 0.95) return '#d1d5db'; // gray-300
                      if (ratio >= 0.8) return '#fdba74'; // orange-300
                      return '#fca5a5'; // red-300
                    })()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAppointmentMouseDown(e, 'end');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleAppointmentTouchStart(e, 'end');
                  }}
                  title="Drag to adjust end time"
                >
                  <div className="w-full flex justify-center">
                    <svg className="h-2 w-6 text-white opacity-70" viewBox="0 0 24 8" fill="currentColor">
                      <rect x="0" y="0" width="24" height="2" rx="1" />
                      <rect x="0" y="3" width="24" height="2" rx="1" />
                      <rect x="0" y="6" width="24" height="2" rx="1" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs p-1 flex flex-col font-medium mt-5 mb-5">
                  <div className="flex justify-between">
                    <span className="font-bold">{format(startTime, 'HH:mm')}-{format(endTime, 'HH:mm')}</span>
                    <span className="font-bold">{formatDuration(Math.floor((endTime.getTime() - startTime.getTime()) / 60000))}</span>
                  </div>
                  {totalDuration > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span>Needed: {formatDuration(totalDuration)}</span>
                      {(() => {
                        const actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
                        const ratio = actualDuration / totalDuration;
                        
                        let label = '';
                        let badgeClass = '';
                        
                        if (ratio >= 1.2) {
                          label = 'Comfortable';
                          badgeClass = 'bg-green-200 text-green-800 border border-green-300';
                        } else if (ratio >= 0.95) {
                          label = 'Realistic';
                          badgeClass = 'bg-gray-200 text-gray-800 border border-gray-300';
                        } else if (ratio >= 0.8) {
                          label = 'Tight';
                          badgeClass = 'bg-orange-200 text-orange-800 border border-orange-300';
                        } else {
                          label = 'Unrealistic';
                          badgeClass = 'bg-red-200 text-red-800 border border-red-300';
                        }
                        
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                  )}
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

  // Add some CSS for the calendar styling
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

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
      <div className="grid grid-cols-1 gap-6">
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
      </div>
      
      {/* Day Calendar */}
      {renderDayCalendar()}
    </div>
  );
} 