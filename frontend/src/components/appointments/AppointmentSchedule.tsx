'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getDay, addMinutes } from 'date-fns';
import { endpoints } from '@/lib/api';
import AppointmentCalendar from './AppointmentCalendar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Format duration from minutes to hours and minutes
const formatDuration = (minutes: number): string => {
  // Handle negative durations by converting to positive
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const remainingMinutes = absMinutes % 60;
  
  // Create the formatted string with sign if negative
  const sign = minutes < 0 ? '-' : '';
  
  if (hours === 0) {
    return `${sign}${remainingMinutes}m`;
  }
  
  return `${sign}${hours}h ${remainingMinutes}m`;
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
  selectedDogIds: number[];
  totalDuration: number;
  onAppointmentsFetched?: () => void;
  appointmentData?: any;
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
  selectedDogIds,
  totalDuration,
  onAppointmentsFetched,
  appointmentData
}: AppointmentScheduleProps) {
  // Important: This component should not auto-adjust or snap durations based on estimated time
  // All time selection is managed by the calendar component and should respect user input exactly
  
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
      
      // Process the response data to format it correctly for our UI
      const processedAppointments = response.data.map((appointment: any) => {
        // Extract dog names from dogServices
        const dogNames = appointment.dogServices?.map((dog: any) => dog.DogName) || [];
        
        // Ensure time format is correct (HH:MM)
        let timeStart = appointment.TimeStart;
        let timeEnd = appointment.TimeEnd;
        
        // Validate time format
        if (timeStart && typeof timeStart === 'string') {
          // Make sure it's in HH:MM format
          if (!timeStart.includes(':')) {
            console.warn(`Invalid TimeStart format detected: ${timeStart}`);
            // Try to fix by parsing as a number of minutes since midnight
            const minutes = parseInt(timeStart);
            if (!isNaN(minutes)) {
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              timeStart = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
              console.log(`Converted TimeStart to: ${timeStart}`);
            }
          }
        }
        
        if (timeEnd && typeof timeEnd === 'string') {
          // Make sure it's in HH:MM format
          if (!timeEnd.includes(':')) {
            console.warn(`Invalid TimeEnd format detected: ${timeEnd}`);
            // Try to fix by parsing as a number of minutes since midnight
            const minutes = parseInt(timeEnd);
            if (!isNaN(minutes)) {
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              timeEnd = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
              console.log(`Converted TimeEnd to: ${timeEnd}`);
            }
          }
        }
        
        return {
          Id: appointment.Id,
          CustomerId: appointment.CustomerId,
          CustomerName: appointment.CustomerName || "Unknown Customer",
          Date: appointment.Date,
          TimeStart: timeStart,
          TimeEnd: timeEnd,
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">
            Schedule Appointment
          </h2>
          <div className="w-48">
            <DatePicker
              selected={appointmentDate}
              onChange={(date: Date) => setAppointmentDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 focus:ring-primary-500 focus:border-primary-500"
              filterDate={isWeekday}
              placeholderText="Select date"
            />
          </div>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <AppointmentCalendar
          appointmentDate={appointmentDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          dailyAppointments={dailyAppointments}
          totalDuration={totalDuration}
        />
      </div>
      
      {/* Appointment Details Input Section */}
      {appointmentData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-base font-medium text-gray-800 mb-2">Appointment Details</h3>
          {/* You can add your appointment form fields here */}
        </div>
      )}
    </div>
  );
} 