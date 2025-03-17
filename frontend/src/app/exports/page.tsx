'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import { format } from 'date-fns';
import { FaFileExcel, FaCheck, FaSpinner, FaHistory, FaUndo, FaEye, FaCalendarAlt, FaInfoCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';

interface ExportReadyAppointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  CustomerId: number;
  CustomerName: string;
  CustomerContactperson: string;
  AppointmentStatusId: string;
  StatusLabel: string;
  IsPaidInCash: boolean;
  SerialNumber: number;
  TotalPrice: number;
  Dogs: {
    DogId: number;
    DogName: string;
    Services: {
      ServiceId: number;
      ServiceLabel: string;
      ServicePrice: number;
      BtwPercentage: number;
      ServiceQuantity: number;
      ServicePriceExclBtw: number;
    }[];
  }[];
}

interface ExportLog {
  Id: number;
  IssuedOn: string;
  UpUntilDate: string;
  IsSuccesfull: boolean;
  IsDummy: boolean;
  FileName: string;
  Notes: string;
  IsReverted: boolean;
  RevertedOn: string;
  RevertedBy: string;
  RevertReason: string;
  CreatedOn: string;
  UpdatedOn: string;
  AppointmentCount: number;
  Appointments?: Array<{
    Id: number;
    Date: string;
    CustomerName: string;
    CustomerContactperson: string;
    PreviousStatusId: string;
    IsReverted: boolean;
    RevertedOn: string;
  }>;
}

export default function ExportsPage() {
  const [appointments, setAppointments] = useState<ExportReadyAppointment[]>([]);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ExportReadyAppointment | null>(null);
  const [selectedExportLog, setSelectedExportLog] = useState<ExportLog | null>(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  const [reverting, setReverting] = useState(false);
  const [isLatestExport, setIsLatestExport] = useState(false);
  const [highestSerialNumbers, setHighestSerialNumbers] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch export-ready appointments
        const appointmentsResponse = await endpoints.exports.getExportReady();
        setAppointments(appointmentsResponse.data || []);
        
        // Fetch export logs
        const exportLogsResponse = await endpoints.exportLogs.getAll();
        setExportLogs(exportLogsResponse.data || []);

        // Calculate highest serial numbers
        calculateHighestSerialNumbers(appointmentsResponse.data || []);
      } catch (err) {
        console.error('Error fetching export data:', err);
        setError('Failed to load export data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Add effect to recalculate highest serial numbers when selected year changes
  useEffect(() => {
    if (appointments.length > 0) {
      calculateHighestSerialNumbers(appointments);
    }
  }, [selectedYear]);
  
  // Clear toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Get appointments to export based on selected date
  const getAppointmentsToExport = () => {
    return appointments.filter(app => app.Date <= selectedDate);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const handleViewDetails = (appointmentId: number) => {
    const appointment = appointments.find(app => app.Id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };
  
  const handleExportToExcel = async () => {
    const appointmentsToExport = getAppointmentsToExport();
    
    if (appointmentsToExport.length === 0) {
      setToast({
        message: 'No appointments to export for the selected date range',
        type: 'error'
      });
      return;
    }
    
    try {
      setExporting(true);
      
      const appointmentIds = appointmentsToExport.map(app => app.Id);
      console.log('Starting export process for appointments:', appointmentIds);
      
      // Format dates for MySQL compatibility (YYYY-MM-DD HH:MM:SS)
      const now = new Date();
      const formattedIssuedOn = format(now, 'yyyy-MM-dd HH:mm:ss');
      
      // Step 1: Generate Excel file
      let excelResponse;
      try {
        console.log('Generating Excel file...');
        excelResponse = await endpoints.exports.generateExcel(appointmentIds);
        console.log('Excel file generated successfully');
      } catch (err) {
        console.error('Error generating Excel:', err);
        throw new Error('Failed to generate Excel file');
      }
      
      // Step 2: Mark appointments as exported
      let markAsExportedResponse;
      try {
        console.log('Marking appointments as exported...');
        markAsExportedResponse = await endpoints.exports.markAsExported(appointmentIds);
        console.log('Mark as exported response:', markAsExportedResponse);
        
        // Verify that the response contains the updated appointments
        if (!markAsExportedResponse.data || !markAsExportedResponse.data.updatedAppointments) {
          console.error('Missing updatedAppointments in response:', markAsExportedResponse);
          throw new Error('Invalid response from server: missing updated appointments data');
        }
        
        // Log the updated appointments for verification
        console.log('Updated appointments from markAsExported:', markAsExportedResponse.data.updatedAppointments);
      } catch (err) {
        console.error('Error marking appointments as exported:', err);
        throw new Error('Failed to mark appointments as exported');
      }
      
      // Generate filename
      const fileName = `facturen_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Step 3: Create export log
      let exportLogResponse;
      try {
        console.log('Creating export log...');
        exportLogResponse = await endpoints.exportLogs.create({
          IssuedOn: formattedIssuedOn,
          UpUntilDate: selectedDate,
          IsSuccesfull: true,
          IsDummy: false,
          FileName: fileName,
          Notes: `Export of ${appointmentIds.length} appointments up to ${format(new Date(selectedDate), 'dd-MM-yyyy')}`,
          AppointmentIds: appointmentIds
        });
        console.log('Export log created successfully:', exportLogResponse);
      } catch (err) {
        console.error('Error creating export log:', err);
        
        // Attempt to revert the appointment status changes
        try {
          console.log('Attempting to revert appointment status changes...');
          // If we have an export log ID, use the revert endpoint
          if (exportLogResponse && exportLogResponse.data && exportLogResponse.data.Id) {
            await endpoints.exportLogs.revertExport(exportLogResponse.data.Id, {
              RevertedBy: 'System',
              RevertReason: 'Automatic reversion due to error during export process'
            });
          } else {
            // Otherwise, manually revert the appointments back to 'Inv' status
            await endpoints.exports.revertToInvoiced(appointmentIds);
          }
          console.log('Successfully reverted appointment status changes');
        } catch (revertErr) {
          console.error('Failed to revert appointment status changes:', revertErr);
        }
        
        throw new Error('Failed to create export log');
      }
      
      // Create a download link for the Excel file
      const url = window.URL.createObjectURL(new Blob([excelResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Remove exported appointments from the list and update highest serial numbers
      if (markAsExportedResponse && markAsExportedResponse.data && markAsExportedResponse.data.updatedAppointments) {
        // Update the highest serial numbers based on the newly assigned values
        const updatedAppointments = markAsExportedResponse.data.updatedAppointments;
        const updatedHighestSerialNumbers = {...highestSerialNumbers};
        
        console.log('Processing updated appointments for highest serial numbers:', updatedAppointments);
        
        updatedAppointments.forEach((app: any) => {
          const year = new Date(app.Date).getFullYear();
          const paymentType = app.IsPaidInCash === 1 ? 'cash' : 'bank';
          const key = `${year}-${paymentType}`;
          
          console.log(`Processing appointment ${app.Id}:`, {
            year,
            paymentType,
            key,
            serialNumber: app.SerialNumber,
            currentHighest: updatedHighestSerialNumbers[key]
          });
          
          if (!updatedHighestSerialNumbers[key] || app.SerialNumber > updatedHighestSerialNumbers[key]) {
            updatedHighestSerialNumbers[key] = app.SerialNumber;
          }
        });
        
        console.log('Updated highest serial numbers:', updatedHighestSerialNumbers);
        setHighestSerialNumbers(updatedHighestSerialNumbers);
      }
      
      // Instead of just removing the exported appointments, fetch fresh data
      // to ensure we have the latest state including serial numbers
      try {
        console.log('Refreshing appointment data after export...');
        const refreshResponse = await endpoints.exports.getExportReady();
        console.log('Refreshed appointment data:', refreshResponse.data);
        setAppointments(refreshResponse.data || []);
      } catch (refreshErr) {
        console.error('Error refreshing appointments after export:', refreshErr);
      }
      
      // Refresh export logs
      const exportLogsResponse = await endpoints.exportLogs.getAll();
      setExportLogs(exportLogsResponse.data || []);
      
      // Show success message
      setToast({
        message: `Successfully exported ${appointmentIds.length} appointments`,
        type: 'success'
      });
      
      // Refresh data to ensure we have the latest information
      await refreshData();
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setToast({
        message: `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}. Any changes have been reverted.`,
        type: 'error'
      });
    } finally {
      setExporting(false);
    }
  };
  
  const formatDate = (dateString: string, includeTime: boolean = false) => {
    if (includeTime) {
      return format(new Date(dateString), 'dd-MM-yyyy HH:mm');
    }
    return format(new Date(dateString), 'dd-MM-yyyy');
  };
  
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Format HH:MM from HH:MM:SS
  };
  
  // Calculate preview serial numbers for appointments that will be exported
  const calculatePreviewSerialNumbers = () => {
    const appointmentsToExport = getAppointmentsToExport();
    const previewSerialNumbers = new Map<number, number>();
    
    // Group appointments by year and payment type
    const groupedAppointments = new Map<string, ExportReadyAppointment[]>();
    
    appointmentsToExport.forEach(app => {
      const year = new Date(app.Date).getFullYear();
      const paymentType = app.IsPaidInCash ? 'cash' : 'bank';
      const key = `${year}-${paymentType}`;
      
      if (!groupedAppointments.has(key)) {
        groupedAppointments.set(key, []);
      }
      groupedAppointments.get(key)!.push(app);
    });
    
    // For each group, find the highest existing serial number and assign new ones
    groupedAppointments.forEach((apps, key) => {
      // Find highest existing serial number for this year and payment type
      const [year, paymentType] = key.split('-');
      const isCash = paymentType === 'cash';
      
      // Find the highest serial number among all appointments (including those not being exported)
      const highestExisting = appointments
        .filter(app => 
          new Date(app.Date).getFullYear().toString() === year && 
          app.IsPaidInCash === isCash && 
          app.SerialNumber !== null && 
          app.SerialNumber !== undefined
        )
        .reduce((max, app) => Math.max(max, app.SerialNumber || 0), 0);
      
      // Assign new serial numbers to appointments in this group
      let nextSerialNumber = highestExisting + 1;
      apps.forEach(app => {
        previewSerialNumbers.set(app.Id, nextSerialNumber++);
      });
    });
    
    return previewSerialNumbers;
  };
  
  // Generate invoice number for preview or actual appointment
  const generateInvoiceNumber = (appointment: ExportReadyAppointment, previewSerialNumbers?: Map<number, number>) => {
    const year = new Date(appointment.Date).getFullYear();
    
    // If we have a preview serial number, use it
    if (previewSerialNumbers && previewSerialNumbers.has(appointment.Id)) {
      const previewSerialNumber = previewSerialNumbers.get(appointment.Id)!.toString().padStart(4, '0');
      return `${year}-${appointment.IsPaidInCash ? 'C' : ''}${previewSerialNumber} (preview)`;
    }
    
    // If the appointment doesn't have a serial number yet (in preview without calculated numbers), show a placeholder
    if (!appointment.SerialNumber) {
      return `${year}-${appointment.IsPaidInCash ? 'C' : ''}XXXX (will be assigned)`;
    }
    
    // Otherwise, format the actual serial number
    let serialNumber = appointment.SerialNumber.toString().padStart(4, '0');
    if (appointment.IsPaidInCash) {
      serialNumber = 'C' + serialNumber;
    }
    return `${year}-${serialNumber}`;
  };
  
  // Helper function to ensure a value is a number and format it
  const formatCurrency = (value: any): string => {
    const numValue = typeof value === 'number' ? value : parseFloat(value || '0');
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  };
  
  // Helper function to calculate BTW values
  const calculateBtwValues = (price: number | string) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price || '0');
    const priceExclBtw = parseFloat((numPrice / 1.21).toFixed(2));
    const btw = parseFloat((numPrice - priceExclBtw).toFixed(2));
    return { priceExclBtw, btw };
  };
  
  const handleViewExportDetails = async (exportId: number) => {
    try {
      setLoading(true);
      const response = await endpoints.exportLogs.getById(exportId);
      setSelectedExportLog(response.data);
      
      // Check if this is the latest non-reverted export
      const exportLogsResponse = await endpoints.exportLogs.getAll();
      const allExportLogs = exportLogsResponse.data || [];
      const latestNonRevertedIndex = allExportLogs.findIndex((log: ExportLog) => !log.IsReverted);
      
      if (latestNonRevertedIndex !== -1) {
        const latestNonReverted = allExportLogs[latestNonRevertedIndex];
        setIsLatestExport(latestNonReverted.Id === exportId);
      } else {
        setIsLatestExport(false);
      }
    } catch (err) {
      console.error('Error fetching export details:', err);
      setToast({
        message: 'Failed to load export details',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevertExport = async () => {
    if (!selectedExportLog) return;
    
    try {
      setReverting(true);
      
      await endpoints.exportLogs.revertExport(selectedExportLog.Id, {
        RevertedBy: 'User', // You could get the actual user name here
        RevertReason: revertReason
      });
      
      // Refresh export logs
      const exportLogsResponse = await endpoints.exportLogs.getAll();
      setExportLogs(exportLogsResponse.data || []);
      
      // Refresh appointments (some may have been reverted back to 'Inv' status)
      const appointmentsResponse = await endpoints.exports.getExportReady();
      const updatedAppointments = appointmentsResponse.data || [];
      setAppointments(updatedAppointments);
      
      // Recalculate highest serial numbers after revert
      calculateHighestSerialNumbers(updatedAppointments);
      
      // Close modals and reset state
      setShowRevertModal(false);
      setSelectedExportLog(null);
      setRevertReason('');
      
      // Show success message
      setToast({
        message: 'Export successfully reverted. All appointments have been set to "Invoiced" status and serial numbers have been reset.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error reverting export:', err);
      
      // Check for specific error message about chronological order
      let errorMessage = 'Failed to revert export';
      
      if (err.response?.data?.message === 'Only the latest export can be reverted') {
        errorMessage = 'Only the latest export can be reverted. Exports must be reverted in chronological order.';
      }
      
      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setReverting(false);
    }
  };
  
  // Calculate highest serial numbers for both payment types
  const calculateHighestSerialNumbers = (appointmentData: ExportReadyAppointment[]) => {
    const result: {[key: string]: number} = {};
    
    // Find highest serial numbers for all years
    appointmentData.forEach(app => {
      // Only consider appointments that have a valid serial number (greater than 0)
      // Explicitly ignore null, undefined, 0, or negative numbers
      if (app.SerialNumber && app.SerialNumber > 0) {
        const year = new Date(app.Date).getFullYear();
        const paymentType = app.IsPaidInCash ? 'cash' : 'bank';
        const key = `${year}-${paymentType}`;
        
        if (!result[key] || app.SerialNumber > result[key]) {
          result[key] = app.SerialNumber;
        }
      }
    });
    
    // Initialize with zero if no serial numbers found for selected year
    if (!result[`${selectedYear}-bank`]) {
      result[`${selectedYear}-bank`] = 0;
    }
    if (!result[`${selectedYear}-cash`]) {
      result[`${selectedYear}-cash`] = 0;
    }
    
    setHighestSerialNumbers(result);
  };
  
  // Function to refresh data
  const refreshData = async () => {
    try {
      // Fetch export-ready appointments
      const appointmentsResponse = await endpoints.exports.getExportReady();
      setAppointments(appointmentsResponse.data || []);
      
      // Fetch export logs
      const exportLogsResponse = await endpoints.exportLogs.getAll();
      setExportLogs(exportLogsResponse.data || []);

      // Calculate highest serial numbers
      calculateHighestSerialNumbers(appointmentsResponse.data || []);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };
  
  // Add function to navigate years
  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export Management</h1>
        <div className="flex space-x-2 items-center">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-gray-300">
            <FaCalendarAlt className="text-gray-500" />
            <span className="text-sm text-gray-700">Export up to:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="border-none focus:ring-0 p-0 text-sm"
            />
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={getAppointmentsToExport().length === 0 || exporting}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
              getAppointmentsToExport().length === 0 || exporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 transition-colors'
            }`}
          >
            {exporting ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaFileExcel />
                <span>Export to Excel</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Highest Serial Numbers Display */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-md font-semibold text-gray-900">
            {selectedYear === new Date().getFullYear() 
              ? "Current Highest Serial Numbers" 
              : `Highest Serial Numbers for ${selectedYear}`}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateYear('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Previous Year"
            >
              <FaChevronLeft className="text-gray-600" />
            </button>
            <span className="text-lg font-semibold text-gray-700">{selectedYear}</span>
            <button
              onClick={() => navigateYear('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Next Year"
            >
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="text-sm text-gray-700">Bank Transfers</div>
            <div className="text-lg font-semibold">
              {highestSerialNumbers[`${selectedYear}-bank`] 
                ? `${selectedYear}-${highestSerialNumbers[`${selectedYear}-bank`].toString().padStart(4, '0')}`
                : `${selectedYear}-0000 (No invoices yet)`}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <div className="text-sm text-gray-700">Cash Payments</div>
            <div className="text-lg font-semibold">
              {highestSerialNumbers[`${selectedYear}-cash`] 
                ? `${selectedYear}-C${highestSerialNumbers[`${selectedYear}-cash`].toString().padStart(4, '0')}`
                : `${selectedYear}-C0000 (No invoices yet)`}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export-ready appointments */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Export-Ready Appointments</h2>
            <p className="text-sm text-gray-600">
              These appointments have been invoiced and are ready to be exported
            </p>
            {getAppointmentsToExport().length > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                <strong>{getAppointmentsToExport().length}</strong> appointments selected for export (up to {format(new Date(selectedDate), 'dd-MM-yyyy')})
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md m-4">
              {error}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg m-4">
              <p className="text-gray-500 mb-4">No export-ready appointments found</p>
              <p className="text-sm text-gray-400">
                Export-ready appointments are appointments with an "Invoiced" status
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selection
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dogs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => {
                    const isSelected = appointment.Date <= selectedDate;
                    const dogNames = appointment.Dogs.map(dog => dog.DogName).join(', ');
                    
                    return (
                      <tr key={appointment.Id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isSelected ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <FaCheck className="mr-1" /> Selected
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Not Selected
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(appointment.Date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.CustomerContactperson}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dogNames}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{formatCurrency(appointment.TotalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleViewDetails(appointment.Id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Export logs or preview */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {showPreview ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Export Preview</h2>
                <p className="text-sm text-gray-600">
                  Preview of the data that will be exported to Excel
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  <strong>Note:</strong> Serial numbers shown are calculated previews of what will be assigned during export, with separate numbering for cash payments and bank transfers.
                </p>
              </div>
              
              {getAppointmentsToExport().length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg m-4">
                  <p className="text-gray-500 mb-4">No appointments selected</p>
                  <p className="text-sm text-gray-400">
                    Select a date to see a preview of the export data
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Factuurnummer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Referentie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Factuurdatum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Relatie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vervaldatum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bedragexcl_btw
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Omschrijving
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        // Calculate preview serial numbers once for all appointments
                        const previewSerialNumbers = calculatePreviewSerialNumbers();
                        
                        return getAppointmentsToExport().map(appointment => {
                          const invoiceNumber = generateInvoiceNumber(appointment, previewSerialNumbers);
                          const appointmentDate = new Date(appointment.Date);
                          const expiryDate = new Date(appointmentDate);
                          expiryDate.setDate(expiryDate.getDate() + 21);
                          
                          // Calculate total price excluding BTW for the entire appointment
                          const { priceExclBtw } = calculateBtwValues(appointment.TotalPrice);
                          
                          // Combine all dog names
                          const dogNames = appointment.Dogs.map(dog => dog.DogName).join(', ');
                          
                          return (
                            <tr key={appointment.Id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {invoiceNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {`Afspraak op: ${formatDate(appointment.Date)}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(appointment.Date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointment.CustomerContactperson}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(expiryDate.toISOString())}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                €{formatCurrency(priceExclBtw)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {`Trimmen van ${dogNames}`}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Export History</h2>
                <p className="text-sm text-gray-600">
                  Previous exports and their details
                </p>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : exportLogs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg m-4">
                  <p className="text-gray-500 mb-4">No export history found</p>
                  <p className="text-sm text-gray-400">
                    Export history will appear here after you export appointments
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Up Until Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Appointments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exportLogs.map((log, index) => {
                        // Determine if this is the latest non-reverted export
                        const isLatestNonReverted = !log.IsReverted && 
                          exportLogs.findIndex(l => !l.IsReverted) === index;
                        
                        return (
                          <tr 
                            key={log.Id} 
                            className={`hover:bg-gray-50 ${log.IsReverted ? 'bg-gray-100' : ''} ${isLatestNonReverted ? 'border-l-4 border-green-500' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(log.IssuedOn, true)}
                              {isLatestNonReverted && (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Latest
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(log.UpUntilDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {log.IsReverted ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Reverted to Invoiced
                                </span>
                              ) : log.IsSuccesfull ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  <FaCheck className="mr-1" /> Success
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.AppointmentCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewExportDetails(log.Id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                {!log.IsReverted && (
                                  <button
                                    onClick={() => {
                                      setSelectedExportLog(log);
                                      setShowRevertModal(true);
                                    }}
                                    className={`${isLatestNonReverted ? 'text-red-600 hover:text-red-900' : 'text-gray-400 cursor-not-allowed'}`}
                                    title={isLatestNonReverted ? "Revert Export" : "Only the latest export can be reverted"}
                                    disabled={!isLatestNonReverted}
                                  >
                                    <FaUndo />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {selectedAppointment.CustomerContactperson} - {formatDate(selectedAppointment.Date)}
                </h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p><span className="font-semibold">Invoice Number:</span> {(() => {
                    // Calculate preview serial numbers for this appointment
                    const previewSerialNumbers = calculatePreviewSerialNumbers();
                    return generateInvoiceNumber(selectedAppointment, previewSerialNumbers);
                  })()}</p>
                  <p><span className="font-semibold">Date:</span> {formatDate(selectedAppointment.Date)}</p>
                  <p><span className="font-semibold">Time:</span> {formatTime(selectedAppointment.TimeStart)} - {formatTime(selectedAppointment.TimeEnd)}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Customer:</span> {selectedAppointment.CustomerContactperson}</p>
                  <p><span className="font-semibold">Status:</span> {selectedAppointment.StatusLabel}</p>
                  <p><span className="font-semibold">Payment Method:</span> {selectedAppointment.IsPaidInCash ? 'Cash' : 'Bank Transfer'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Dogs and Services:</h4>
                {selectedAppointment.Dogs.map((dog, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-md">
                    <h5 className="text-md font-semibold">{dog.DogName}</h5>
                    
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold">Services:</h4>
                      <ul className="list-disc pl-5">
                        {dog.Services.map((service, serviceIndex) => {
                          const { priceExclBtw, btw } = calculateBtwValues(service.ServicePrice);
                          return (
                            <li key={serviceIndex}>
                              {service.ServiceLabel} - €{formatCurrency(service.ServicePrice)}
                              <div className="text-sm text-gray-600">
                                <div>Excl. BTW: €{priceExclBtw.toFixed(2)}</div>
                                <div>BTW (21%): €{btw.toFixed(2)}</div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-right">
                <div className="text-lg font-semibold">
                  Totaal: €{formatCurrency(selectedAppointment.TotalPrice)}
                </div>
                {(() => {
                  const { priceExclBtw, btw } = calculateBtwValues(selectedAppointment.TotalPrice);
                  return (
                    <>
                      <div className="text-sm text-gray-600">
                        Excl. BTW: €{priceExclBtw.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        BTW (21%): €{btw.toFixed(2)}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Log Details Modal */}
      {selectedExportLog && !showRevertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Export Details - {formatDate(selectedExportLog.IssuedOn, true)}
                </h3>
                <button
                  onClick={() => setSelectedExportLog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p><span className="font-semibold">Date:</span> {formatDate(selectedExportLog.IssuedOn, true)}</p>
                  <p><span className="font-semibold">Up Until Date:</span> {formatDate(selectedExportLog.UpUntilDate)}</p>
                  <p><span className="font-semibold">Status:</span> {selectedExportLog.IsSuccesfull ? 'Success' : 'Failed'}</p>
                </div>
                <div>
                  <p><span className="font-semibold">File Name:</span> {selectedExportLog.FileName || 'N/A'}</p>
                  <p><span className="font-semibold">Appointments:</span> {
                    selectedExportLog.Appointments && selectedExportLog.Appointments.length > 0 
                      ? selectedExportLog.Appointments.length 
                      : (selectedExportLog.AppointmentCount > 0 ? selectedExportLog.AppointmentCount : 'N/A')
                  }</p>
                </div>
              </div>
              
              {selectedExportLog.IsReverted && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-2">This export has been reverted</h4>
                  <p><span className="font-semibold">Reverted On:</span> {formatDate(selectedExportLog.RevertedOn)}</p>
                  <p><span className="font-semibold">Reverted By:</span> {selectedExportLog.RevertedBy || 'N/A'}</p>
                  <p><span className="font-semibold">Reason:</span> {selectedExportLog.RevertReason || 'No reason provided'}</p>
                </div>
              )}
              
              {/* Display a message when there are no appointments to show */}
              {!selectedExportLog.IsReverted && (!selectedExportLog.Appointments || selectedExportLog.Appointments.length === 0) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md text-center">
                  <p className="text-gray-500">No appointment details available for this export.</p>
                </div>
              )}
              
              {selectedExportLog.Appointments && selectedExportLog.Appointments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Included Appointments:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Previous Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedExportLog.Appointments.map((appointment) => (
                          <tr key={appointment.Id} className={appointment.IsReverted ? 'bg-gray-100' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(appointment.Date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.CustomerContactperson}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.PreviousStatusId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {appointment.IsReverted ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Reverted to Invoiced
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Exported
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {!selectedExportLog.IsReverted && isLatestExport && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowRevertModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  >
                    <FaUndo className="mr-2" /> Revert Export
                  </button>
                </div>
              )}
              
              {!selectedExportLog.IsReverted && !isLatestExport && (
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        This export cannot be reverted because it is not the latest export. Exports must be reverted in chronological order (newest first). When reverted, all appointments will be set to "Invoiced" status.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Revert Confirmation Modal */}
      {showRevertModal && selectedExportLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-600">
                  Revert Export
                </h3>
                <button
                  onClick={() => {
                    setShowRevertModal(false);
                    setRevertReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to revert this export? This will change all appointments back to their "Invoiced" status.
                </p>
                
                <p className="text-gray-700 mb-4">
                  <span className="font-semibold">Export Date:</span> {formatDate(selectedExportLog.IssuedOn, true)}
                </p>
                <p className="text-gray-700 mb-4">
                  <span className="font-semibold">Appointments:</span> {selectedExportLog.AppointmentCount}
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Note: Only the latest export can be reverted. Exports must be reverted in chronological order (newest first). All appointments will be set to "Invoiced" status.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="revertReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for reverting (optional)
                  </label>
                  <textarea
                    id="revertReason"
                    value={revertReason}
                    onChange={(e) => setRevertReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter reason for reverting this export..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRevertModal(false);
                    setRevertReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevertExport}
                  disabled={reverting}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    reverting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 transition-colors'
                  }`}
                >
                  {reverting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Reverting...
                    </>
                  ) : (
                    <>
                      <FaUndo className="mr-2" />
                      Revert Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 