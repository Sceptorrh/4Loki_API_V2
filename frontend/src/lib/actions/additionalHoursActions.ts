import { endpoints } from '@/lib/api';
import { format, parse, parseISO } from 'date-fns';
import { AxiosResponse } from 'axios';

// Define types
interface Appointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  StatusLabel: string;
  ActualDuration: number;
  IsExported: boolean;
}

interface AdditionalHour {
  Id?: number;
  Date: string;
  HourTypeId: string;
  Duration: number;
  IsExported: boolean;
  Description?: string;
}

interface TravelTime {
  Id: number;
  ZipCode: string;
  Hour: number;
  Day: number;
  Minutes: number;
}

// Extend the endpoints with custom implementation
// Declare these functions outside of the action functions
// For TypeScript we need to use module augmentation to add these properties
declare module '@/lib/api' {
  interface TravelTimesEndpoints {
    getByDayAndHour(day: number, hour: number): Promise<AxiosResponse<TravelTime[]>>;
  }
  
  interface AppointmentsEndpoints {
    getByDateRange(startDate: string, endDate: string): Promise<AxiosResponse<Appointment[]>>;
  }
}

// Implementation of the travel times by day and hour
async function getByDayAndHour(day: number, hour: number): Promise<AxiosResponse<TravelTime[]>> {
  const response = await endpoints.travelTimes.getAll();
  const filteredTimes = response.data.filter((time: TravelTime) => 
    time.Day === day && time.Hour === hour
  );
  return { ...response, data: filteredTimes };
}

// Implementation of appointments by date range
async function getByDateRange(startDate: string, endDate: string): Promise<AxiosResponse<Appointment[]>> {
  const response = await endpoints.appointments.getAll();
  const filteredAppointments = response.data.filter((app: Appointment) => 
    app.Date >= startDate && app.Date <= endDate
  );
  return { ...response, data: filteredAppointments };
}

// Add these methods to the endpoints if they don't exist
// Using any to bypass TypeScript's strict type checking
(endpoints.travelTimes as any).getByDayAndHour = (endpoints.travelTimes as any).getByDayAndHour || getByDayAndHour;
(endpoints.appointments as any).getByDateRange = (endpoints.appointments as any).getByDateRange || getByDateRange;

/**
 * Synchronizes travel and cleaning times based on appointments.
 * - Removes travel/cleaning times for days without appointments
 * - Adds travel/cleaning times for days with appointments
 * - Only processes non-exported records
 * 
 * @param startDate - Start date for processing (YYYY-MM-DD)
 * @param endDate - End date for processing (YYYY-MM-DD)
 * @returns Summary of actions taken
 */
export async function syncTravelAndCleaningTimes(startDate: string, endDate: string) {
  try {
    console.log(`Starting sync of travel and cleaning times from ${startDate} to ${endDate}`);
    
    // Step 1: Fetch all appointments in date range
    console.log('Step 1: Fetching appointments...');
    const appointmentsByDate = await fetchAppointmentsByDateRange(startDate, endDate);
    const appointmentDates = Object.keys(appointmentsByDate);
    console.log(`Found appointments for ${appointmentDates.length} dates`);
    
    // Step 2: Fetch all existing additional hours in date range
    console.log('Step 2: Fetching existing additional hours...');
    const existingAdditionalHours = await fetchAdditionalHours(startDate, endDate);
    console.log(`Found ${existingAdditionalHours.length} existing additional hour records`);
    
    // Step 3: Process each date in the range
    console.log('Step 3: Processing dates...');
    const result = {
      travelTimesAdded: 0,
      travelTimesRemoved: 0,
      travelTimesUpdated: 0,
      cleaningTimesAdded: 0,
      cleaningTimesRemoved: 0,
      processedDates: 0,
      errors: [] as string[],
    };
    
    // Process each date with appointments
    for (const [date, appointments] of Object.entries(appointmentsByDate)) {
      try {
        console.log(`Processing date ${date} with ${appointments.length} appointments`);
        
        // Only process dates with non-exported appointments
        const nonExportedAppointments = appointments.filter(app => !app.IsExported);
        console.log(`Found ${nonExportedAppointments.length} non-exported appointments for ${date}`);
        
        if (nonExportedAppointments.length > 0) {
          // Get existing hours for this date
          const dateHours = existingAdditionalHours.filter(h => h.Date === date);
          const existingTravelHours = dateHours.filter(h => h.HourTypeId === 'Reis' && !h.IsExported);
          const existingCleaningHours = dateHours.filter(h => h.HourTypeId === 'sch' && !h.IsExported);
          
          console.log(`For ${date}: ${existingTravelHours.length} travel records, ${existingCleaningHours.length} cleaning records`);
          
          // Process travel time
          try {
            const travelTimeResult = await processTravelTime(date, nonExportedAppointments, existingTravelHours);
            result.travelTimesAdded += travelTimeResult.added;
            result.travelTimesRemoved += travelTimeResult.removed;
            result.travelTimesUpdated += travelTimeResult.updated;
            console.log(`Travel time results for ${date}: added=${travelTimeResult.added}, updated=${travelTimeResult.updated}, removed=${travelTimeResult.removed}`);
          } catch (travelError) {
            console.error(`Error processing travel time for ${date}:`, travelError);
            result.errors.push(`Error with travel time on ${date}: ${travelError instanceof Error ? travelError.message : String(travelError)}`);
          }
          
          // Process cleaning time
          try {
            const cleaningTimeResult = await processCleaningTime(date, nonExportedAppointments, existingCleaningHours);
            result.cleaningTimesAdded += cleaningTimeResult.added;
            result.cleaningTimesRemoved += cleaningTimeResult.removed;
            console.log(`Cleaning time results for ${date}: added=${cleaningTimeResult.added}, removed=${cleaningTimeResult.removed}`);
          } catch (cleaningError) {
            console.error(`Error processing cleaning time for ${date}:`, cleaningError);
            result.errors.push(`Error with cleaning time on ${date}: ${cleaningError instanceof Error ? cleaningError.message : String(cleaningError)}`);
          }
          
          result.processedDates++;
        } else {
          // If there are no non-exported appointments, remove any non-exported travel/cleaning times
          const dateHours = existingAdditionalHours.filter(h => h.Date === date);
          const hoursToRemove = dateHours.filter(
            h => !h.IsExported && (h.HourTypeId === 'Reis' || h.HourTypeId === 'sch')
          );
          
          console.log(`No non-exported appointments for ${date}, removing ${hoursToRemove.length} hour records`);
          
          // Remove unnecessary hours
          let removedCount = 0;
          for (const hour of hoursToRemove) {
            if (hour.Id) {
              try {
                await endpoints.additionalHours.delete(hour.Id);
                removedCount++;
                if (hour.HourTypeId === 'Reis') {
                  result.travelTimesRemoved++;
                } else if (hour.HourTypeId === 'sch') {
                  result.cleaningTimesRemoved++;
                }
              } catch (deleteError) {
                console.error(`Error deleting hour ${hour.Id} for ${date}:`, deleteError);
                result.errors.push(`Failed to delete hour ${hour.Id} for ${date}: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
              }
            }
          }
          
          if (hoursToRemove.length > 0) {
            console.log(`Removed ${removedCount} of ${hoursToRemove.length} hour records for ${date}`);
            result.processedDates++;
          }
        }
      } catch (error) {
        console.error(`Error processing date ${date}:`, error);
        result.errors.push(`Error processing date ${date}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Process dates with additional hours but no appointments
    const datesWithHours = [...new Set(existingAdditionalHours.map(h => h.Date))];
    const datesWithHoursOnly = datesWithHours.filter(date => !appointmentsByDate[date]);
    
    console.log(`Processing ${datesWithHoursOnly.length} dates with hours but no appointments`);
    
    for (const date of datesWithHoursOnly) {
      if (!appointmentsByDate[date]) {
        try {
          // If there are no appointments, remove any non-exported travel/cleaning times
          const dateHours = existingAdditionalHours.filter(h => h.Date === date);
          const hoursToRemove = dateHours.filter(
            h => !h.IsExported && (h.HourTypeId === 'Reis' || h.HourTypeId === 'sch')
          );
          
          console.log(`Date ${date} has no appointments, removing ${hoursToRemove.length} hour records`);
          
          // Remove unnecessary hours
          let removedCount = 0;
          for (const hour of hoursToRemove) {
            if (hour.Id) {
              try {
                await endpoints.additionalHours.delete(hour.Id);
                removedCount++;
                if (hour.HourTypeId === 'Reis') {
                  result.travelTimesRemoved++;
                } else if (hour.HourTypeId === 'sch') {
                  result.cleaningTimesRemoved++;
                }
              } catch (deleteError) {
                console.error(`Error deleting hour ${hour.Id} for ${date}:`, deleteError);
                result.errors.push(`Failed to delete hour ${hour.Id} for ${date}: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
              }
            }
          }
          
          if (hoursToRemove.length > 0) {
            console.log(`Removed ${removedCount} of ${hoursToRemove.length} hour records for ${date}`);
            result.processedDates++;
          }
        } catch (error) {
          console.error(`Error processing date ${date}:`, error);
          result.errors.push(`Error processing date ${date}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    console.log('Sync completed with results:', result);
    return result;
  } catch (error) {
    console.error('Failed to sync travel and cleaning times:', error);
    throw new Error(`Failed to sync travel and cleaning times: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches appointments for a date range and groups them by date
 */
async function fetchAppointmentsByDateRange(startDate: string, endDate: string): Promise<Record<string, Appointment[]>> {
  try {
    // Fix the URL format - it needs to be an absolute URL
    const response = await fetch(`/api/appointments/date-range?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.status} ${response.statusText}`);
    }
    
    const appointments = await response.json();
    
    // Check if the response is valid and has data
    if (!Array.isArray(appointments)) {
      console.warn('Appointments API returned non-array response:', appointments);
      return {};
    }
    
    // Group appointments by date
    return appointments.reduce((acc: Record<string, Appointment[]>, app: Appointment) => {
      if (!acc[app.Date]) {
        acc[app.Date] = [];
      }
      acc[app.Date].push(app);
      return acc;
    }, {});
  } catch (error) {
    console.error('Error in fetchAppointmentsByDateRange:', error);
    // Return empty object instead of throwing error to prevent complete failure
    return {};
  }
}

/**
 * Fetches all additional hours for a date range
 */
async function fetchAdditionalHours(startDate: string, endDate: string): Promise<AdditionalHour[]> {
  try {
    const response = await endpoints.additionalHours.getByDateRange(startDate, endDate);
    return response.data || [];
  } catch (error) {
    throw new Error(`Failed to fetch additional hours: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gets travel time from the database for a specific day and hour
 */
async function getTravelTime(dayOfWeek: number, hour: number): Promise<number> {
  try {
    // Use the dedicated API endpoint with the correct URL
    const response = await fetch(`/api/travel-times/by-day-hour?day=${dayOfWeek}&hour=${hour}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch travel time: ${response.status} ${response.statusText}`);
      return 80; // Default travel time if API fails
    }
    
    const data = await response.json();
    
    // If the travel time exists, return it
    if (data && Array.isArray(data) && data.length > 0 && typeof data[0].Minutes === 'number') {
      console.log(`Found travel time for day ${dayOfWeek}, hour ${hour}: ${data[0].Minutes} minutes`);
      return data[0].Minutes;
    }
    
    // Otherwise, return a default value of 80 minutes
    console.log(`No travel time found for day ${dayOfWeek}, hour ${hour}, using default: 80 minutes`);
    return 80;
  } catch (error) {
    console.error('Error fetching travel time:', error);
    // Return a default travel time of 80 minutes if there's an error
    return 80;
  }
}

/**
 * Processes travel time for a specific date
 */
async function processTravelTime(
  date: string, 
  appointments: Appointment[], 
  existingTravelHours: AdditionalHour[]
) {
  const result = { added: 0, removed: 0, updated: 0 };
  
  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    return new Date(`${a.Date}T${a.TimeStart}`).getTime() - new Date(`${b.Date}T${b.TimeStart}`).getTime();
  });
  
  if (sortedAppointments.length === 0) {
    // Remove existing travel hours if there are no appointments
    for (const hour of existingTravelHours) {
      if (hour.Id) {
        await endpoints.additionalHours.delete(hour.Id);
        result.removed++;
      }
    }
    return result;
  }
  
  // Get the first and last appointment for the day
  const firstAppointment = sortedAppointments[0];
  const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
  
  // Parse the date to get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const appointmentDate = parseISO(date);
  const dayOfWeek = appointmentDate.getDay();
  
  // Get the hour of the first appointment
  const firstAppointmentHour = parseInt(firstAppointment.TimeStart.split(':')[0], 10);
  
  // Calculate the travel time based on the day and hour
  const travelTime = await getTravelTime(dayOfWeek, firstAppointmentHour);
  
  // If there's an existing travel hour, update it if needed
  if (existingTravelHours.length > 0) {
    const existingHour = existingTravelHours[0];
    
    // Update if the duration is different and the ID exists
    if (existingHour.Duration !== travelTime && existingHour.Id !== undefined) {
      await endpoints.additionalHours.update(existingHour.Id, {
        ...existingHour,
        Duration: travelTime,
        Description: `Travel time for appointments on ${format(appointmentDate, 'EEEE, MMMM d')}`
      });
      result.updated++;
    }
    
    // Remove any additional travel records
    for (let i = 1; i < existingTravelHours.length; i++) {
      const hourId = existingTravelHours[i].Id;
      if (hourId !== undefined) {
        await endpoints.additionalHours.delete(hourId);
        result.removed++;
      }
    }
  } else {
    // Create new travel hour record
    await endpoints.additionalHours.create({
      Date: date,
      HourTypeId: 'Reis',
      Duration: travelTime,
      IsExported: false,
      Description: `Travel time for appointments on ${format(appointmentDate, 'EEEE, MMMM d')}`
    });
    result.added++;
  }
  
  return result;
}

/**
 * Processes cleaning time for a specific date
 */
async function processCleaningTime(
  date: string, 
  appointments: Appointment[], 
  existingCleaningHours: AdditionalHour[]
) {
  const result = { added: 0, removed: 0 };
  
  // Fixed cleaning time - 40 minutes
  const CLEANING_TIME = 40;
  
  if (appointments.length === 0) {
    // Remove existing cleaning hours if there are no appointments
    for (const hour of existingCleaningHours) {
      const hourId = hour.Id;
      if (hourId !== undefined) {
        await endpoints.additionalHours.delete(hourId);
        result.removed++;
      }
    }
    return result;
  }
  
  // If there's an existing cleaning hour record, make sure it's correct
  if (existingCleaningHours.length > 0) {
    const existingHour = existingCleaningHours[0];
    
    // Update if the duration is different and ID exists
    if (existingHour.Duration !== CLEANING_TIME && existingHour.Id !== undefined) {
      await endpoints.additionalHours.update(existingHour.Id, {
        ...existingHour,
        Duration: CLEANING_TIME,
        Description: `Cleaning time for ${format(parseISO(date), 'EEEE, MMMM d')}`
      });
    }
    
    // Remove any additional cleaning records
    for (let i = 1; i < existingCleaningHours.length; i++) {
      const hourId = existingCleaningHours[i].Id;
      if (hourId !== undefined) {
        await endpoints.additionalHours.delete(hourId);
        result.removed++;
      }
    }
  } else {
    // Create new cleaning hour record
    await endpoints.additionalHours.create({
      Date: date,
      HourTypeId: 'sch',
      Duration: CLEANING_TIME,
      IsExported: false,
      Description: `Cleaning time for ${format(parseISO(date), 'EEEE, MMMM d')}`
    });
    result.added++;
  }
  
  return result;
} 