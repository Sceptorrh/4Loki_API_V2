"use client";

import { useState, useEffect, useRef } from "react";
import { endpoints } from "@/lib/api";
import {
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
  addMonths,
  subMonths,
  parse,
} from "date-fns";
import {
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaTrash,
} from "react-icons/fa";

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
  adminHours: number;
  otherHours: number;
  totalHours: number;
  isExpanded: boolean;
  hasWarning: boolean;
  warningMessage: string;
}

interface HoursSummary {
  appointmentHours: number;
  travelHours: number;
  cleaningHours: number;
  adminHours: number;
  otherHours: number;
  totalHours: number;
}

interface AdditionalHour {
  Date: string;
  HourTypeId: string;
  Duration: number;
  Id: number;
  Description?: string;
}

// Function to generate a random travel time between min and max
const generateRandomTravelTime = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to get travel time, using random if not available
const getTravelTime = (
  appointment: Appointment,
  minTravelTime: number,
  maxTravelTime: number,
) => {
  return (
    appointment.TravelTime ||
    generateRandomTravelTime(minTravelTime, maxTravelTime)
  );
};

// Function to format hours and minutes
const formatHoursAndMinutes = (hours: number) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

// Tooltip component for better user experience
interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

const Tooltip = ({ children, text }: TooltipProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip && (
        <div
          className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm 
          tooltip dark:bg-gray-700 w-max max-w-xs left-1/2 transform -translate-x-1/2 -bottom-2 mb-10"
        >
          {text}
          <div
            className="tooltip-arrow absolute left-1/2 transform -translate-x-1/2 -bottom-1 
            border-t-4 border-l-4 border-r-4 border-transparent border-t-gray-900"
          ></div>
        </div>
      )}
    </div>
  );
};

export default function HoursPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 1));
  const [isHydrated, setIsHydrated] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([]);
  const [hoursSummary, setHoursSummary] = useState<HoursSummary>({
    appointmentHours: 0,
    travelHours: 0,
    cleaningHours: 0,
    adminHours: 0,
    otherHours: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [additionalHours, setAdditionalHours] = useState<
    Record<
      string,
      {
        travelHours: number;
        cleaningHours: number;
        adminHours: number;
        otherHours: number;
        travelRecordsCount: number;
        hourDetails: AdditionalHour[];
      }
    >
  >({});
  const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>(
    {},
  );
  const [deletingHourId, setDeletingHourId] = useState<number | null>(null);

  // Toggle hours detail expansion
  const toggleHoursExpansion = (date: string, type: string) => {
    const key = `${date}-${type}`;
    setExpandedHours((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Load saved date from localStorage on hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedDate = window.localStorage.getItem("calendarMonth");
        if (savedDate) {
          const parsedDate = parseISO(savedDate);
          if (!isNaN(parsedDate.getTime())) {
            console.log(
              "Using saved date from localStorage:",
              format(parsedDate, "MMMM yyyy"),
            );
            setCurrentDate(parsedDate);
          } else {
            console.log("Using default date (February 2025) for testing");
            // Keep the default date (February 2025)
          }
        } else {
          console.log(
            "No saved date, using default date (February 2025) for testing",
          );
          // Keep the default date (February 2025)
        }
      } catch (err) {
        console.error("Error reading from localStorage:", err);
      }
      setIsHydrated(true);
    }
  }, []);

  // Fetch additional hours
  useEffect(() => {
    const fetchAdditionalHours = async () => {
      try {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        console.log(
          "Fetching additional hours for:",
          format(monthStart, "yyyy-MM-dd"),
          "to",
          format(monthEnd, "yyyy-MM-dd"),
        );

        const response = await endpoints.additionalHours.getByDateRange(
          format(monthStart, "yyyy-MM-dd"),
          format(monthEnd, "yyyy-MM-dd"),
        );

        console.log("Additional hours data received:", response.data);

        // Always set additionalHours, even if empty (to trigger the next useEffect)
        if (response.data && response.data.length > 0) {
          // Group additional hours by date and type
          const groupedHours = response.data.reduce(
            (
              acc: Record<
                string,
                {
                  travelHours: number;
                  cleaningHours: number;
                  adminHours: number;
                  otherHours: number;
                  travelRecordsCount: number;
                  hourDetails: AdditionalHour[];
                }
              >,
              hour: AdditionalHour,
            ) => {
              const date = hour.Date;
              if (!acc[date]) {
                acc[date] = {
                  travelHours: 0,
                  cleaningHours: 0,
                  adminHours: 0,
                  otherHours: 0,
                  travelRecordsCount: 0,
                  hourDetails: [],
                };
              }

              // Store the complete hour record
              acc[date].hourDetails.push(hour);

              const duration = hour.Duration / 60; // Convert minutes to hours
              if (hour.HourTypeId === "Reis") {
                acc[date].travelHours += duration;
                acc[date].travelRecordsCount += 1; // Count travel records
              } else if (hour.HourTypeId === "sch") {
                acc[date].cleaningHours += duration;
              } else if (hour.HourTypeId === "Adm") {
                acc[date].adminHours += duration;
              } else {
                acc[date].otherHours += duration;
              }

              return acc;
            },
            {},
          );

          console.log("Grouped hours by date:", groupedHours);
          setAdditionalHours(groupedHours);
        } else {
          // Reset additional hours state when no data is found
          // This empty object will still trigger the dependent useEffect
          setAdditionalHours({});
        }
      } catch (error) {
        console.error("Error fetching additional hours:", error);
        // Set empty object to trigger the dependent useEffect
        setAdditionalHours({});
      }
    };

    if (isHydrated) {
      fetchAdditionalHours();
    }
  }, [currentDate, isHydrated]);

  // Restore the useEffect that depends on additionalHours
  // But modify it to always proceed, whether additionalHours has content or not
  useEffect(() => {
    if (isHydrated) {
      // We'll always fetch appointments after additionalHours is set (even if empty)
      fetchAppointments();
    }
  }, [additionalHours, isHydrated]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch appointments for each day in the month
      const appointmentsPromises = [];
      let dateIterator = new Date(monthStart);

      while (dateIterator <= monthEnd) {
        const dateStr = format(dateIterator, "yyyy-MM-dd");
        appointmentsPromises.push(endpoints.appointments.getByDate(dateStr));
        dateIterator.setDate(dateIterator.getDate() + 1);
      }

      const responses = await Promise.all(appointmentsPromises);
      const allAppointments = responses.flatMap(
        (response) => response.data || [],
      );

      // Filter out cancelled appointments and sort by date and time
      const validAppointments = allAppointments
        .filter((app) => app.StatusLabel !== "Cancelled")
        .sort(
          (a, b) =>
            new Date(a.Date + "T" + a.TimeStart).getTime() -
            new Date(b.Date + "T" + b.TimeStart).getTime(),
        );

      setAppointments(validAppointments);

      // Now calculate hours with the updated additionalHours state
      calculateHours(validAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Make sure daySummaries is set to empty array if there's an error
      setDaySummaries([]);
      setHoursSummary({
        appointmentHours: 0,
        travelHours: 0,
        cleaningHours: 0,
        adminHours: 0,
        otherHours: 0,
        totalHours: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (appointments: Appointment[]) => {
    // Group appointments by date
    const appointmentsByDate = appointments.reduce(
      (acc, app) => {
        const date = app.Date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(app);
        return acc;
      },
      {} as Record<string, Appointment[]>,
    );

    // Get all dates with either appointments or additional hours
    const allDates = new Set<string>([
      ...Object.keys(appointmentsByDate),
      ...Object.keys(additionalHours),
    ]);

    console.log(
      "All dates with appointments or additional hours:",
      Array.from(allDates),
    );
    console.log("Current additionalHours state:", additionalHours);

    // Calculate hours for each day
    const summaries: DaySummary[] = [];
    let totalAppointmentHours = 0;
    let totalTravelHours = 0;
    let totalCleaningHours = 0;
    let totalAdminHours = 0;
    let totalOtherHours = 0;

    // Process each date
    Array.from(allDates).forEach((date) => {
      // Get appointments for this date (if any)
      const dayAppointments = appointmentsByDate[date] || [];

      // Calculate appointment hours
      const appointmentHours = dayAppointments.reduce(
        (sum, app) => sum + app.ActualDuration / 60,
        0,
      );

      // Get additional hours from database
      const dateAdditionalHours = additionalHours[date] || {
        travelHours: 0,
        cleaningHours: 0,
        adminHours: 0,
        otherHours: 0,
        travelRecordsCount: 0,
        hourDetails: [],
      };

      console.log(`Additional hours for ${date}:`, dateAdditionalHours);

      const totalHours =
        appointmentHours +
        dateAdditionalHours.travelHours +
        dateAdditionalHours.cleaningHours +
        dateAdditionalHours.adminHours +
        dateAdditionalHours.otherHours;

      // Check for inconsistencies
      let hasWarning = false;
      let warningMessage = "";

      // Case 1: Additional hours but no appointments
      if (
        dayAppointments.length === 0 &&
        (dateAdditionalHours.travelHours > 0 ||
          dateAdditionalHours.cleaningHours > 0)
      ) {
        hasWarning = true;
        warningMessage = "Travel or cleaning hours without appointments";
      }

      // Case 2: Appointments but missing travel or cleaning hours
      if (dayAppointments.length > 0) {
        if (
          dateAdditionalHours.travelHours === 0 &&
          dateAdditionalHours.cleaningHours === 0
        ) {
          hasWarning = true;
          warningMessage = "Appointments without travel or cleaning hours";
        } else {
          // Check for exactly one travel record
          const travelRecords =
            additionalHours[date]?.hourDetails.filter(
              (h) => h.HourTypeId === "Reis",
            ) || [];
          if (travelRecords.length !== 1) {
            hasWarning = true;
            warningMessage = hasWarning
              ? `${warningMessage}; Expected 1 travel record but found ${travelRecords.length}`
              : `Expected 1 travel record but found ${travelRecords.length}`;
          }

          // Check for exactly one cleaning record
          const cleaningRecords =
            additionalHours[date]?.hourDetails.filter(
              (h) => h.HourTypeId === "sch",
            ) || [];
          if (cleaningRecords.length !== 1) {
            hasWarning = true;
            warningMessage = hasWarning
              ? `${warningMessage}; Expected 1 cleaning record but found ${cleaningRecords.length}`
              : `Expected 1 cleaning record but found ${cleaningRecords.length}`;
          }
        }
      }

      // Only add the day if there are hours to show
      if (totalHours > 0) {
        summaries.push({
          date,
          appointments: dayAppointments,
          appointmentHours: Number(appointmentHours.toFixed(2)),
          travelHours: Number(dateAdditionalHours.travelHours.toFixed(2)),
          cleaningHours: Number(dateAdditionalHours.cleaningHours.toFixed(2)),
          adminHours: Number(dateAdditionalHours.adminHours.toFixed(2)),
          otherHours: Number(dateAdditionalHours.otherHours.toFixed(2)),
          totalHours: Number(totalHours.toFixed(2)),
          isExpanded: false,
          hasWarning,
          warningMessage,
        });

        totalAppointmentHours += appointmentHours;
        totalTravelHours += dateAdditionalHours.travelHours;
        totalCleaningHours += dateAdditionalHours.cleaningHours;
        totalAdminHours += dateAdditionalHours.adminHours;
        totalOtherHours += dateAdditionalHours.otherHours;
      }
    });

    // Sort summaries by date
    summaries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    console.log("Final daySummaries:", summaries);
    console.log("Final hoursSummary:", {
      appointmentHours: Number(totalAppointmentHours.toFixed(2)),
      travelHours: Number(totalTravelHours.toFixed(2)),
      cleaningHours: Number(totalCleaningHours.toFixed(2)),
      adminHours: Number(totalAdminHours.toFixed(2)),
      otherHours: Number(totalOtherHours.toFixed(2)),
      totalHours: Number(
        (
          totalAppointmentHours +
          totalTravelHours +
          totalCleaningHours +
          totalAdminHours +
          totalOtherHours
        ).toFixed(2),
      ),
    });

    setDaySummaries(summaries);
    setHoursSummary({
      appointmentHours: Number(totalAppointmentHours.toFixed(2)),
      travelHours: Number(totalTravelHours.toFixed(2)),
      cleaningHours: Number(totalCleaningHours.toFixed(2)),
      adminHours: Number(totalAdminHours.toFixed(2)),
      otherHours: Number(totalOtherHours.toFixed(2)),
      totalHours: Number(
        (
          totalAppointmentHours +
          totalTravelHours +
          totalCleaningHours +
          totalAdminHours +
          totalOtherHours
        ).toFixed(2),
      ),
    });
  };

  const toggleDayExpansion = (date: string) => {
    setDaySummaries((prev) =>
      prev.map((summary) =>
        summary.date === date
          ? { ...summary, isExpanded: !summary.isExpanded }
          : summary,
      ),
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const deleteHourRecord = async (hourId: number) => {
    if (!hourId) return;
    
    try {
      setDeletingHourId(hourId);
      
      // Call the API to delete the record
      await endpoints.additionalHours.delete(hourId);
      
      // Update the local state by filtering out the deleted record
      setAdditionalHours(prevHours => {
        const newHours = { ...prevHours };
        
        // Find which date contains this hour
        Object.keys(newHours).forEach(date => {
          const hourDetails = newHours[date].hourDetails;
          const hourIndex = hourDetails.findIndex(h => h.Id === hourId);
          
          if (hourIndex >= 0) {
            const deletedHour = hourDetails[hourIndex];
            const duration = deletedHour.Duration / 60; // Convert minutes to hours
            
            // Remove the hours from the appropriate counter
            if (deletedHour.HourTypeId === 'Reis') {
              newHours[date].travelHours -= duration;
              newHours[date].travelRecordsCount -= 1;
            } else if (deletedHour.HourTypeId === 'sch') {
              newHours[date].cleaningHours -= duration;
            } else if (deletedHour.HourTypeId === 'Adm') {
              newHours[date].adminHours -= duration;
            } else {
              newHours[date].otherHours -= duration;
            }
            
            // Remove the hour from the details array
            newHours[date].hourDetails = hourDetails.filter(h => h.Id !== hourId);
            
            // If no hours left for this date, remove the date from additional hours
            if (
              newHours[date].hourDetails.length === 0 || 
              (newHours[date].travelHours <= 0 && 
               newHours[date].cleaningHours <= 0 && 
               newHours[date].adminHours <= 0 && 
               newHours[date].otherHours <= 0)
            ) {
              delete newHours[date];
            }
          }
        });
        
        return newHours;
      });
      
      // Recalculate hours to update the UI
      calculateHours(appointments);
      
    } catch (error) {
      console.error('Error deleting hour record:', error);
      alert('Failed to delete the hour record. Please try again.');
    } finally {
      setDeletingHourId(null);
    }
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
            {format(currentDate, "MMMM yyyy")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Appointment Hours</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatHoursAndMinutes(hoursSummary.appointmentHours)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Travel Hours</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatHoursAndMinutes(hoursSummary.travelHours)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Cleaning Hours</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatHoursAndMinutes(hoursSummary.cleaningHours)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Admin Hours</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {formatHoursAndMinutes(hoursSummary.adminHours)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Other Hours</h3>
              <p className="text-3xl font-bold text-orange-600">
                {formatHoursAndMinutes(hoursSummary.otherHours)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Total Hours</h3>
              <p className="text-3xl font-bold text-gray-800">
                {formatHoursAndMinutes(hoursSummary.totalHours)}
              </p>
            </div>
          </div>

          {daySummaries.length > 0 ? (
            <div className="space-y-4">
              {daySummaries.map((summary) => (
                <div
                  key={summary.date}
                  className="bg-white rounded-lg shadow overflow-hidden"
                >
                  <button
                    onClick={() => toggleDayExpansion(summary.date)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">
                        {format(new Date(summary.date), "EEEE, MMMM d, yyyy")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {summary.appointments.length} appointment
                        {summary.appointments.length !== 1 ? "s" : ""}
                      </span>
                      {summary.hasWarning && (
                        <Tooltip text={summary.warningMessage}>
                          <FaExclamationTriangle className="text-yellow-500 ml-2" />
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total Hours</div>
                        <div className="text-lg font-semibold">
                          {formatHoursAndMinutes(summary.totalHours)}
                        </div>
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
                      <div className="px-6 py-4 grid grid-cols-5 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Appointment Hours</h4>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatHoursAndMinutes(summary.appointmentHours)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Travel Hours</h4>
                          <p className="text-lg font-semibold text-green-600">
                            {formatHoursAndMinutes(summary.travelHours)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Cleaning Hours</h4>
                          <p className="text-lg font-semibold text-purple-600">
                            {formatHoursAndMinutes(summary.cleaningHours)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Admin Hours</h4>
                          <p className="text-lg font-semibold text-indigo-600">
                            {formatHoursAndMinutes(summary.adminHours)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Other Hours</h4>
                          <p className="text-lg font-semibold text-orange-600">
                            {formatHoursAndMinutes(summary.otherHours)}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 py-4 border-t border-gray-200">
                        {summary.hasWarning && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                            <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                              <p className="font-medium">Warning</p>
                              <p>{summary.warningMessage}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4 space-y-2">
                          {/* Travel Hours Details */}
                          {summary.travelHours > 0 && (
                            <div className="border rounded-md overflow-hidden">
                              <button 
                                onClick={() => toggleHoursExpansion(summary.date, 'travel')}
                                className="w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100"
                              >
                                <span className="font-medium text-sm text-gray-700">Travel Time</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-green-600">
                                    {formatHoursAndMinutes(summary.travelHours)}
                                  </span>
                                  {expandedHours[`${summary.date}-travel`] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </div>
                              </button>
                              {expandedHours[`${summary.date}-travel`] && (
                                <div className="px-4 py-3 text-sm">
                                  {additionalHours[summary.date]?.hourDetails
                                    .filter(hour => hour.HourTypeId === 'Reis')
                                    .map(hour => (
                                      <div key={hour.Id} className="flex justify-between items-center py-1 border-b last:border-0">
                                        <span>{hour.Description || 'Travel time'}</span>
                                        <div className="flex items-center gap-2">
                                          <span>{formatHoursAndMinutes(hour.Duration / 60)}</span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (window.confirm('Are you sure you want to delete this travel time record?')) {
                                                deleteHourRecord(hour.Id);
                                              }
                                            }}
                                            className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                            disabled={deletingHourId === hour.Id}
                                          >
                                            {deletingHourId === hour.Id ? (
                                              <span className="text-xs">Deleting...</span>
                                            ) : (
                                              <FaTrash size={12} />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Cleaning Hours Details */}
                          {summary.cleaningHours > 0 && (
                            <div className="border rounded-md overflow-hidden">
                              <button 
                                onClick={() => toggleHoursExpansion(summary.date, 'cleaning')}
                                className="w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100"
                              >
                                <span className="font-medium text-sm text-gray-700">Cleaning Time</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-purple-600">
                                    {formatHoursAndMinutes(summary.cleaningHours)}
                                  </span>
                                  {expandedHours[`${summary.date}-cleaning`] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </div>
                              </button>
                              {expandedHours[`${summary.date}-cleaning`] && (
                                <div className="px-4 py-3 text-sm">
                                  {additionalHours[summary.date]?.hourDetails
                                    .filter(hour => hour.HourTypeId === 'sch')
                                    .map(hour => (
                                      <div key={hour.Id} className="flex justify-between items-center py-1 border-b last:border-0">
                                        <span>{hour.Description || 'Cleaning time'}</span>
                                        <div className="flex items-center gap-2">
                                          <span>{formatHoursAndMinutes(hour.Duration / 60)}</span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (window.confirm('Are you sure you want to delete this cleaning time record?')) {
                                                deleteHourRecord(hour.Id);
                                              }
                                            }}
                                            className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                            disabled={deletingHourId === hour.Id}
                                          >
                                            {deletingHourId === hour.Id ? (
                                              <span className="text-xs">Deleting...</span>
                                            ) : (
                                              <FaTrash size={12} />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Admin Hours Details */}
                          {summary.adminHours > 0 && (
                            <div className="border rounded-md overflow-hidden">
                              <button 
                                onClick={() => toggleHoursExpansion(summary.date, 'admin')}
                                className="w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100"
                              >
                                <span className="font-medium text-sm text-gray-700">Admin Time</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-indigo-600">
                                    {formatHoursAndMinutes(summary.adminHours)}
                                  </span>
                                  {expandedHours[`${summary.date}-admin`] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </div>
                              </button>
                              {expandedHours[`${summary.date}-admin`] && (
                                <div className="px-4 py-3 text-sm">
                                  {additionalHours[summary.date]?.hourDetails
                                    .filter(hour => hour.HourTypeId === 'Adm')
                                    .map(hour => (
                                      <div key={hour.Id} className="flex justify-between items-center py-1 border-b last:border-0">
                                        <span>{hour.Description || 'Admin time'}</span>
                                        <div className="flex items-center gap-2">
                                          <span>{formatHoursAndMinutes(hour.Duration / 60)}</span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (window.confirm('Are you sure you want to delete this admin time record?')) {
                                                deleteHourRecord(hour.Id);
                                              }
                                            }}
                                            className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                            disabled={deletingHourId === hour.Id}
                                          >
                                            {deletingHourId === hour.Id ? (
                                              <span className="text-xs">Deleting...</span>
                                            ) : (
                                              <FaTrash size={12} />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Other Hours Details */}
                          {summary.otherHours > 0 && (
                            <div className="border rounded-md overflow-hidden">
                              <button 
                                onClick={() => toggleHoursExpansion(summary.date, 'other')}
                                className="w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100"
                              >
                                <span className="font-medium text-sm text-gray-700">Other Time</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-orange-600">
                                    {formatHoursAndMinutes(summary.otherHours)}
                                  </span>
                                  {expandedHours[`${summary.date}-other`] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </div>
                              </button>
                              {expandedHours[`${summary.date}-other`] && (
                                <div className="px-4 py-3 text-sm">
                                  {additionalHours[summary.date]?.hourDetails
                                    .filter(hour => hour.HourTypeId !== 'Reis' && hour.HourTypeId !== 'sch' && hour.HourTypeId !== 'Adm')
                                    .map(hour => (
                                      <div key={hour.Id} className="flex justify-between items-center py-1 border-b last:border-0">
                                        <span>{hour.Description || `${hour.HourTypeId} time`}</span>
                                        <div className="flex items-center gap-2">
                                          <span>{formatHoursAndMinutes(hour.Duration / 60)}</span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (window.confirm('Are you sure you want to delete this time record?')) {
                                                deleteHourRecord(hour.Id);
                                              }
                                            }}
                                            className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                            disabled={deletingHourId === hour.Id}
                                          >
                                            {deletingHourId === hour.Id ? (
                                              <span className="text-xs">Deleting...</span>
                                            ) : (
                                              <FaTrash size={12} />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          )}
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
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No hours data
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no appointments or additional hours recorded for{" "}
                {format(currentDate, "MMMM yyyy")}.
              </p>
              <div className="mt-6">
                <button
                  onClick={goToCurrentMonth}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to current month
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
