// Types
interface DogService {
  ServiceId: string;
  Price: number;
}

interface Service {
  Id: string;
  Name: string;
  StandardPrice: number;
  IsPriceAllowed: boolean;
  StandardDuration: number;
}

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

/**
 * Calculate the estimated duration for an appointment based on selected services and historical data
 * @param selectedDogIds Array of selected dog IDs
 * @param dogServices Record of dog services mapped by dog ID
 * @param dogServiceStats Record of service statistics mapped by dog ID
 * @param services Array of available services
 * @returns Estimated duration in minutes, rounded to nearest 15-minute interval
 */
export function getEstimatedDuration(
  selectedDogIds: number[],
  dogServices: Record<number, DogService[]>,
  dogServiceStats: Record<number, ServiceStat[]>,
  services: Service[]
): number {
  let totalDuration = 0;
  
  // Process each selected dog and their services
  selectedDogIds.forEach(dogId => {
    const selectedServices = dogServices[dogId] || [];
    
    // Sum up durations for each service
    selectedServices.forEach(service => {
      const stats = dogServiceStats[dogId]?.find(s => s.ServiceId === service.ServiceId);
      
      if (stats && stats.durations && stats.durations.length > 0) {
        // If we have historical duration data
        if (stats.durations.length >= 2) {
          // Get the two most recent durations
          const duration1 = stats.durations[0].duration;
          const duration2 = stats.durations[1].duration;
          
          // console.log(`Analyzing durations for service ${service.ServiceId}: ${duration1}min and ${duration2}min`);
          
          // Find the 15-minute intervals these durations belong to
          const interval1 = Math.round(duration1 / 15) * 15;
          const interval2 = Math.round(duration2 / 15) * 15;
          
          // Calculate average
          const avgDuration = (duration1 + duration2) / 2;
          // console.log(`Average duration: ${avgDuration}min`);
          
          // Round to nearest 15-minute interval
          const nearestInterval = Math.round(avgDuration / 15) * 15;
          // console.log(`Nearest 15-min interval: ${nearestInterval}min`);
          
          // If the average is already a 15-minute interval, use it
          if (Math.abs(avgDuration - nearestInterval) < 1) {
            // console.log(`Average ${avgDuration} is already close to 15-min interval ${nearestInterval}`);
            totalDuration += nearestInterval;
          }
          // If we have two different 15-minute intervals, use the higher one if it's closer to a more recent duration
          else if (interval1 !== interval2) {
            // Get the third duration if available
            const duration3 = stats.durations.length > 2 ? stats.durations[2].duration : null;
            const interval3 = duration3 !== null ? Math.round(duration3 / 15) * 15 : null;
            
            // If most recent appointment used a higher duration than the second most recent
            if (duration1 > duration2) {
              // console.log(`Most recent duration ${duration1} (${interval1}) > second most recent ${duration2} (${interval2})`);
              totalDuration += interval1;
            } 
            // If third appointment exists and matches either of the first two
            else if (interval3 !== null && (interval3 === interval1 || interval3 === interval2)) {
              // console.log(`Using matching interval from history: ${interval3 === interval1 ? interval1 : interval2}`);
              totalDuration += (interval3 === interval1) ? interval1 : interval2;
            }
            // Otherwise use the higher interval if the average is closer to it
            else {
              const higherInterval = Math.max(interval1, interval2);
              const lowerInterval = Math.min(interval1, interval2);
              
              // Distance from average to each interval
              const distToHigher = Math.abs(avgDuration - higherInterval);
              const distToLower = Math.abs(avgDuration - lowerInterval);
              
              if (distToHigher <= distToLower) {
                // console.log(`Average ${avgDuration} is closer to higher interval ${higherInterval}`);
                totalDuration += higherInterval;
              } else {
                // console.log(`Average ${avgDuration} is closer to lower interval ${lowerInterval}`);
                totalDuration += lowerInterval;
              }
            }
          } 
          // If both durations round to the same 15-minute interval, use that
          else {
            // console.log(`Both durations round to the same interval: ${interval1}`);
            totalDuration += interval1;
          }
        } else {
          // Only one duration available, round it to nearest 15-min
          const singleDuration = stats.durations[0].duration;
          const roundedDuration = Math.round(singleDuration / 15) * 15;
          
          totalDuration += roundedDuration;
          // console.log(`Using single available duration for service ${service.ServiceId}: ${roundedDuration}min (from ${singleDuration}min)`);
        }
      } else {
        // If no history for this specific service, use the service's standard duration if available
        const serviceInfo = services.find(s => s.Id === service.ServiceId);
        if (serviceInfo && serviceInfo.StandardDuration) {
          // Round standard duration to nearest 15-min
          const standardDuration = serviceInfo.StandardDuration;
          const roundedDuration = Math.round(standardDuration / 15) * 15;
          
          totalDuration += roundedDuration;
          // console.log(`Using standard duration for service ${service.ServiceId}: ${roundedDuration}min (from ${standardDuration}min)`);
        } else {
          // No history or standard duration, use default (30 minutes)
          totalDuration += 30;
          // console.log(`Using default duration (30 min) for service ${service.ServiceId}`);
        }
      }
    });
  });
  
  // Ensure the total duration is a multiple of 15 minutes
  const roundedDuration = Math.round(totalDuration / 15) * 15;
  if (roundedDuration !== totalDuration) {
    console.log(`Rounded total duration from ${totalDuration} to ${roundedDuration} to match 15-minute intervals`);
    totalDuration = roundedDuration;
  }
  
  // If we have no services or the calculated duration is too short, use a minimum of 60 minutes
  if (totalDuration < 60) {
    totalDuration = 60;
    console.log(`Using minimum duration of 60 minutes`);
  }
  
  console.log(`Final calculated duration: ${totalDuration} minutes`);
  return totalDuration;
}

/**
 * Snap a time to the nearest 15-minute interval
 * @param time The time to snap
 * @returns A new Date object snapped to the nearest 15-minute interval
 */
export function snapTo15Minutes(time: Date): Date {
  const minutes = time.getMinutes();
  const snappedMinutes = Math.round(minutes / 15) * 15;
  const newTime = new Date(time);
  newTime.setMinutes(snappedMinutes);
  return newTime;
}

/**
 * Generate available time slots from 08:00 to 21:00 with 15-minute intervals
 * @returns Array of Date objects representing available time slots
 */
export function generateTimeOptions(): Date[] {
  const times: Date[] = [];
  const base = new Date();
  
  // Set the base to midnight
  base.setHours(0, 0, 0, 0);
  
  // Add times from 08:00 to 21:00
  for (let hour = 8; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = new Date(base);
      time.setHours(hour, minute);
      times.push(time);
    }
  }
  
  return times;
}

/**
 * Calculate the best available time slot for a new appointment
 * @param appointments Array of existing appointments for the day
 * @param estimatedDuration Estimated duration in minutes for the new appointment
 * @returns The best available start time as a Date object
 */
export function calculateBestTimeSlot(appointments: DailyAppointment[], estimatedDuration: number = 60): Date {
  console.log('Calculating best time slot for appointments:', appointments);
  
  // Make sure estimatedDuration is a multiple of 15 minutes
  const durationRemainder = estimatedDuration % 15;
  if (durationRemainder > 0) {
    estimatedDuration = estimatedDuration - durationRemainder + 15;
  }
  
  // console.log(`Using rounded estimated duration: ${estimatedDuration} minutes`);
  
  // Default start time at 9:00 AM if no appointments exist
  if (!appointments || appointments.length === 0) {
    // console.log('No existing appointments, defaulting to 9:00 AM');
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    return defaultTime;
  }

  // Convert appointments to time ranges (in minutes from midnight)
  const timeRanges: Array<{start: number, end: number}> = appointments.map(appt => {
    const [startHours, startMinutes] = appt.TimeStart.split(':').map(Number);
    const [endHours, endMinutes] = appt.TimeEnd.split(':').map(Number);
    return {
      start: startHours * 60 + startMinutes,
      end: endHours * 60 + endMinutes
    };
  });

  // Sort by start time
  timeRanges.sort((a, b) => a.start - b.start);
  // console.log('Time ranges:', timeRanges);

  // Start of workday (8:00 AM) in minutes from midnight
  const workdayStart = 8 * 60;
  // End of workday (9:00 PM) in minutes from midnight
  const workdayEnd = 21 * 60;

  // Create a list of all available slots
  const availableSlots: Array<{ start: number, duration: number }> = [];

  // Check for a gap at the beginning of the day
  if (timeRanges.length === 0 || timeRanges[0].start > workdayStart) {
    const gapStart = workdayStart;
    const gapEnd = timeRanges.length > 0 ? timeRanges[0].start : workdayEnd;
    const gapDuration = gapEnd - gapStart;
    
    // Round gap start to nearest 15-minute interval
    const roundedStart = Math.ceil(gapStart / 15) * 15;
    
    if (gapDuration >= estimatedDuration) {
      availableSlots.push({ start: roundedStart, duration: gapDuration });
    }
  }

  // Check for gaps between appointments
  for (let i = 0; i < timeRanges.length - 1; i++) {
    const gapStart = timeRanges[i].end;
    const gapEnd = timeRanges[i + 1].start;
    const gapDuration = gapEnd - gapStart;
    
    // Round gap start to nearest 15-minute interval
    const roundedStart = Math.ceil(gapStart / 15) * 15;
    
    if (gapDuration >= estimatedDuration) {
      availableSlots.push({ start: roundedStart, duration: gapDuration });
    }
  }

  // Check for a gap at the end of the day
  if (timeRanges.length === 0 || timeRanges[timeRanges.length - 1].end < workdayEnd) {
    const gapStart = timeRanges.length > 0 ? timeRanges[timeRanges.length - 1].end : workdayStart;
    const gapEnd = workdayEnd;
    const gapDuration = gapEnd - gapStart;
    
    // Round gap start to nearest 15-minute interval
    const roundedStart = Math.ceil(gapStart / 15) * 15;
    
    if (gapDuration >= estimatedDuration) {
      availableSlots.push({ start: roundedStart, duration: gapDuration });
    }
  }

  // console.log('Available slots:', availableSlots);

  // Find the best slot
  if (availableSlots.length > 0) {
    // Sort available slots by:
    // 1. Closest fit (minimize wasted time)
    // 2. Earliest in the day
    availableSlots.sort((a, b) => {
      // First, prioritize slots that are a close fit for the duration needed
      const aWaste = a.duration - estimatedDuration;
      const bWaste = b.duration - estimatedDuration;
      
      // If the waste difference is significant
      if (Math.abs(aWaste - bWaste) > 30) {
        return aWaste - bWaste; // Prefer less waste
      }
      
      // If waste is similar, prefer earlier slots
      return a.start - b.start;
    });
    
    // Get the best slot
    const bestSlot = availableSlots[0];
    
    // Convert to Date object
    const startTime = new Date();
    startTime.setHours(Math.floor(bestSlot.start / 60), bestSlot.start % 60, 0, 0);
    // console.log('Using best available slot:', bestSlot, 'as time:', startTime.toLocaleTimeString());
    return startTime;
  }

  // If no suitable gap is found, try to place after the last appointment
  const lastEnd = timeRanges.length > 0 ? timeRanges[timeRanges.length - 1].end : workdayStart;
  
  // Round to nearest 15-minute interval
  const roundedLastEnd = Math.ceil(lastEnd / 15) * 15;
  
  if (roundedLastEnd + estimatedDuration <= workdayEnd) {
    console.log('No suitable gap, scheduling after last appointment');
    const startTime = new Date();
    startTime.setHours(Math.floor(roundedLastEnd / 60), roundedLastEnd % 60, 0, 0);
    console.log('Using start time after last appointment:', startTime.toLocaleTimeString());
    return startTime;
  }

  // Last resort: use 9:00 AM default
  console.log('No suitable slot found, defaulting to 9:00 AM');
  const defaultTime = new Date();
  defaultTime.setHours(9, 0, 0, 0);
  return defaultTime;
}

/**
 * Check if two appointments overlap
 * @param appointment1Start Start time of first appointment in minutes from midnight
 * @param appointment1End End time of first appointment in minutes from midnight
 * @param appointment2Start Start time of second appointment in minutes from midnight
 * @param appointment2End End time of second appointment in minutes from midnight
 * @returns True if appointments overlap, false otherwise
 */
export function doAppointmentsOverlap(
  appointment1Start: number,
  appointment1End: number,
  appointment2Start: number,
  appointment2End: number
): boolean {
  return appointment1Start < appointment2End && appointment1End > appointment2Start;
}

/**
 * Find overlapping appointments for a given time slot
 * @param appointments Array of existing appointments
 * @param startTime Start time of the slot to check
 * @param endTime End time of the slot to check
 * @returns Array of overlapping appointments
 */
export function findOverlappingAppointments(
  appointments: DailyAppointment[],
  startTime: Date,
  endTime: Date
): DailyAppointment[] {
  if (!startTime || !endTime || appointments.length === 0) {
    return [];
  }

  const currentStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const currentEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

  return appointments.filter(appt => {
    const [startHours, startMins] = appt.TimeStart.split(':').map(Number);
    const [endHours, endMins] = appt.TimeEnd.split(':').map(Number);
    
    const existingStartMinutes = startHours * 60 + startMins;
    const existingEndMinutes = endHours * 60 + endMins;

    return doAppointmentsOverlap(
      currentStartMinutes,
      currentEndMinutes,
      existingStartMinutes,
      existingEndMinutes
    );
  });
}

/**
 * Auto-schedule an appointment based on existing appointments and estimated duration
 * @param appointments Array of existing appointments for the day
 * @param selectedDogIds Array of selected dog IDs
 * @param dogServices Record of dog services mapped by dog ID
 * @param dogServiceStats Record of service statistics mapped by dog ID
 * @param services Array of available services
 * @param currentStartTime Current start time (to check if we should auto-schedule)
 * @returns Object containing the new start and end times, or null if auto-scheduling should not occur
 */
export function autoScheduleAppointment(
  appointments: DailyAppointment[],
  selectedDogIds: number[],
  dogServices: Record<number, DogService[]>,
  dogServiceStats: Record<number, ServiceStat[]>,
  services: Service[],
  currentStartTime: Date
): { startTime: Date; endTime: Date } | null {
  // Only auto-schedule if we have appointments data and dogs/services selected
  if (appointments.length === 0 || selectedDogIds.length === 0 || 
      !Object.values(dogServices).some(services => services.length > 0)) {
    return null;
  }

  // Only auto-schedule if current time is 9:00
  const currentHour = currentStartTime.getHours();
  const currentMinute = currentStartTime.getMinutes();
  if (currentHour !== 9 || currentMinute !== 0) {
    return null;
  }

  // Calculate estimated duration
  const estimatedDuration = getEstimatedDuration(
    selectedDogIds,
    dogServices,
    dogServiceStats,
    services
  );

  // Find best start time
  const bestStartTime = calculateBestTimeSlot(appointments, estimatedDuration);
  
  // Calculate end time
  const endTime = new Date(bestStartTime);
  endTime.setMinutes(bestStartTime.getMinutes() + estimatedDuration);
  
  // Ensure end time is within limits
  const lastPossibleTime = new Date(bestStartTime);
  lastPossibleTime.setHours(21, 0, 0, 0);
  
  if (endTime > lastPossibleTime) {
    endTime.setHours(21, 0, 0, 0);
  }

  return {
    startTime: bestStartTime,
    endTime: endTime
  };
} 