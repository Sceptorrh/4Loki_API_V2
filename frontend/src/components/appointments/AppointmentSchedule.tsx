'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, setHours, setMinutes, getDay } from 'date-fns';
import { generateTimeOptions, snapTo15Minutes, findOverlappingAppointments } from '@/lib/appointments';

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
  dailyAppointments: DailyAppointment[];
  overlappingAppointments: DailyAppointment[];
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  dragType: 'start' | 'end' | 'both' | null;
  setDragType: (type: 'start' | 'end' | 'both' | null) => void;
  checkForOverlappingAppointments: () => void;
  handleAppointmentMouseDown: (e: React.MouseEvent, type: 'start' | 'end' | 'both') => void;
  handleAppointmentTouchStart: (e: React.TouchEvent, type: 'start' | 'end' | 'both') => void;
  selectedDogIds: number[];
  totalDuration: number;
}

export default function AppointmentSchedule({
  appointmentDate,
  setAppointmentDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  dailyAppointments,
  overlappingAppointments,
  isDragging,
  setIsDragging,
  dragType,
  setDragType,
  checkForOverlappingAppointments,
  handleAppointmentMouseDown,
  handleAppointmentTouchStart,
  selectedDogIds,
  totalDuration
}: AppointmentScheduleProps) {
  // Function to filter out weekends
  const isWeekday = (date: Date) => {
    const day = getDay(date);
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
  };

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
    
    // Check for overlaps
    setTimeout(() => checkForOverlappingAppointments(), 0);
  };

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

        {/* Show warning if there's an overlap */}
        {overlappingAppointments.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-3">
            <div className="font-bold">Warning: Appointment Overlap Detected</div>
            <p>Your selected time slot overlaps with {overlappingAppointments.length} existing appointment(s):</p>
            <ul className="ml-5 list-disc">
              {overlappingAppointments.map(appt => (
                <li key={appt.Id}>
                  {appt.CustomerName} ({appt.TimeStart.substring(0, 5)}-{appt.TimeEnd.substring(0, 5)}) - {appt.Dogs.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

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
                className="absolute bg-blue-100 border-2 border-blue-400 rounded-sm z-20 left-[70px] right-4 current-appointment"
                style={{ 
                  top: `${currentApptInfo.startPosition * 20}px`,
                  height: `${Math.max(currentApptInfo.duration * 20, 20)}px`,
                  cursor: isDragging ? 'grabbing' : 'grab'
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
                  className="absolute top-0 left-0 right-0 h-5 bg-blue-400 cursor-ns-resize z-30 current-appointment-handle-start"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAppointmentMouseDown(e, 'start');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleAppointmentTouchStart(e, 'start');
                  }}
                  title="Drag to adjust start time"
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 h-5 bg-blue-400 cursor-ns-resize z-30 current-appointment-handle-end"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAppointmentMouseDown(e, 'end');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleAppointmentTouchStart(e, 'end');
                  }}
                  title="Drag to adjust end time"
                />
                <div className="text-xs p-1 text-blue-800 flex justify-between font-medium mt-6">
                  <span>{format(startTime, 'HH:mm')}-{format(endTime, 'HH:mm')}</span>
                  <span>{Math.floor((endTime.getTime() - startTime.getTime()) / 60000)} min</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                // Set end time based on calculated total duration
                const newEndTime = new Date(time);
                newEndTime.setMinutes(time.getMinutes() + totalDuration);
                
                // Make sure the end time is within limits
                const lastPossibleTime = new Date(time);
                lastPossibleTime.setHours(21, 0, 0, 0);
                
                if (newEndTime > lastPossibleTime) {
                  setEndTime(lastPossibleTime);
                } else {
                  setEndTime(newEndTime);
                }
              }}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="HH:mm"
              timeFormat="HH:mm"
              includeTimes={generateTimeOptions()}
              minTime={setHours(setMinutes(new Date(), 0), 8)}
              maxTime={setHours(setMinutes(new Date(), 0), 21)}
              className="w-full p-2 border border-gray-300 rounded-md"
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
              dateFormat="HH:mm"
              timeFormat="HH:mm"
              includeTimes={generateTimeOptions()}
              minTime={startTime}
              maxTime={setHours(setMinutes(new Date(), 0), 21)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={!startTime}
            />
          </div>
          <div className="col-span-2 -mt-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Duration: {Math.floor((endTime.getTime() - startTime.getTime()) / 60000)} min</span>
              <span className="text-xs text-gray-500">Estimated needed: {totalDuration} min</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Day Calendar */}
      {renderDayCalendar()}
    </div>
  );
} 