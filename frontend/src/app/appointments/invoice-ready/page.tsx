'use client';

import { useState, useEffect, useRef } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FaMoneyBillWave, FaUniversity, FaClock, FaEdit, FaFileInvoiceDollar, FaTimes, FaCheck, FaCalendarCheck, FaCalendarTimes, FaCalendarDay, FaCalendarAlt } from 'react-icons/fa';

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed bottom-6 right-6 z-50 sm:max-w-sm md:max-w-md">
      <div 
        className={`rounded-md p-4 shadow-xl flex items-center w-full ${
          type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 
          'bg-red-50 text-red-800 border-l-4 border-red-500'
        }`}
        style={{
          animation: 'slideInUp 0.3s ease-out, fadeIn 0.3s ease-out',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex-shrink-0 mr-3">
          {type === 'success' ? (
            <FaCheck className="h-5 w-5 text-green-500" />
          ) : (
            <FaTimes className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="mr-2 font-medium text-sm sm:text-base flex-grow">{message}</div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 -mx-1.5 -my-1.5 rounded-md p-1.5 inline-flex text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @media (max-width: 640px) {
          div {
            bottom: 0;
            right: 0;
            left: 0;
            margin: 0 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

interface Dog {
  DogId: number;
  DogName: string;
  ServiceCount: number;
}

interface InvoiceReadyAppointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  DateEnd: string;
  ActualDuration: number;
  CustomerId: number;
  CustomerName: string;
  AppointmentStatusId: string;
  StatusLabel: string;
  Note: string;
  IsPaidInCash: boolean;
  TotalPrice: number;
  Dogs: Dog[];
  StatusColor?: string;
}

// Define the ConfirmationDialog component
interface ConfirmationDialogProps {
  appointment: InvoiceReadyAppointment | undefined;
  onConfirm: () => void;
  onCancel: () => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

const ConfirmationDialog = ({ 
  appointment, 
  onConfirm, 
  onCancel,
  formatDate,
  formatTime
}: ConfirmationDialogProps) => {
  if (!appointment) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="text-gray-600 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Confirm Invoice</h3>
          <button 
            onClick={onCancel}
            className="ml-auto text-gray-400 hover:text-gray-500"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="mb-5">
          <p className="text-gray-600 mb-3">
            Are you sure you want to mark this appointment as invoiced? This will remove it from this list.
          </p>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Customer:</div>
              <div className="font-medium">{appointment.CustomerName}</div>
              
              <div className="text-gray-500">Date:</div>
              <div className="font-medium">{formatDate(appointment.Date)}</div>
              
              <div className="text-gray-500">Time:</div>
              <div className="font-medium">{formatTime(appointment.TimeStart)} - {formatTime(appointment.TimeEnd)}</div>
              
              <div className="text-gray-500">Dogs:</div>
              <div className="font-medium">
                {appointment.Dogs && appointment.Dogs.length > 0 
                  ? appointment.Dogs.map(dog => dog.DogName).join(', ')
                  : 'No dogs'
                }
              </div>
              
              <div className="text-gray-500">Total Price:</div>
              <div className="font-medium">€{Number(appointment.TotalPrice).toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Add a new interface for the group confirmation dialog
interface GroupConfirmationDialogProps {
  appointments: InvoiceReadyAppointment[];
  onConfirm: () => void;
  onCancel: () => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

const GroupConfirmationDialog = ({ 
  appointments, 
  onConfirm, 
  onCancel,
  formatDate,
  formatTime
}: GroupConfirmationDialogProps) => {
  if (!appointments.length) return null;
  
  // Calculate total price of all selected appointments
  const totalPrice = appointments.reduce((sum, app) => sum + Number(app.TotalPrice), 0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center mb-4">
          <div className="text-gray-600 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Confirm Group Invoice</h3>
          <button 
            onClick={onCancel}
            className="ml-auto text-gray-400 hover:text-gray-500"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="mb-5">
          <p className="text-gray-600 mb-3">
            Are you sure you want to mark <span className="font-medium">{appointments.length}</span> appointments as invoiced? This will remove them from this list.
          </p>
          
          <div className="bg-gray-50 p-3 rounded-md mb-3">
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dogs</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map(app => (
                    <tr key={app.Id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(app.Date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {app.CustomerName}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {app.Dogs && app.Dogs.length > 0 
                          ? app.Dogs.map(dog => dog.DogName).join(', ')
                          : 'No dogs'
                        }
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        €{Number(app.TotalPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
            <span className="font-medium text-gray-700">Total Amount:</span>
            <span className="font-bold text-lg">€{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm All
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InvoiceReadyPage() {
  const [appointments, setAppointments] = useState<InvoiceReadyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingInvoice, setProcessingInvoice] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointmentToInvoice, setAppointmentToInvoice] = useState<number | null>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>([]);
  const [showGroupConfirmDialog, setShowGroupConfirmDialog] = useState(false);
  const [processingGroup, setProcessingGroup] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInvoiceReadyAppointments = async () => {
      try {
        setLoading(true);
        const response = await endpoints.appointments.getInvoiceReady();
        setAppointments(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching invoice-ready appointments:', err);
        setError('Failed to load invoice-ready appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceReadyAppointments();
  }, []);

  const handleIsPaidInCashChange = async (id: number, value: boolean) => {
    try {
      // Find the appointment to update
      const appointmentToUpdate = appointments.find(app => app.Id === id);
      if (!appointmentToUpdate) return;

      // Format time values to ensure they're in the correct format (HH:MM)
      const timeStart = appointmentToUpdate.TimeStart.substring(0, 5); // Get HH:MM part
      const timeEnd = appointmentToUpdate.TimeEnd.substring(0, 5); // Get HH:MM part

      // Include all required fields in the update
      await endpoints.appointments.update(id, { 
        Date: appointmentToUpdate.Date,
        TimeStart: timeStart,
        TimeEnd: timeEnd,
        DateEnd: appointmentToUpdate.DateEnd,
        CustomerId: appointmentToUpdate.CustomerId,
        AppointmentStatusId: appointmentToUpdate.AppointmentStatusId,
        ActualDuration: appointmentToUpdate.ActualDuration || 0,
        IsPaidInCash: Boolean(value) // Explicitly convert to boolean
      });

      // Update the local state
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app.Id === id ? { ...app, IsPaidInCash: value } : app
        )
      );
    } catch (err) {
      console.error('Error updating IsPaidInCash:', err);
      setError('Failed to update payment method. Please try again.');
    }
  };

  const handleActualDurationChange = async (id: number, hours: number, minutes: number) => {
    try {
      // Calculate total minutes
      const totalMinutes = (hours * 60) + minutes;
      
      // Find the appointment to update
      const appointmentToUpdate = appointments.find(app => app.Id === id);
      if (!appointmentToUpdate) return;

      // Format time values to ensure they're in the correct format (HH:MM)
      const timeStart = appointmentToUpdate.TimeStart.substring(0, 5); // Get HH:MM part
      const timeEnd = appointmentToUpdate.TimeEnd.substring(0, 5); // Get HH:MM part

      // Include all required fields in the update
      await endpoints.appointments.update(id, { 
        Date: appointmentToUpdate.Date,
        TimeStart: timeStart,
        TimeEnd: timeEnd,
        DateEnd: appointmentToUpdate.DateEnd,
        CustomerId: appointmentToUpdate.CustomerId,
        AppointmentStatusId: appointmentToUpdate.AppointmentStatusId,
        ActualDuration: totalMinutes 
      });

      // Update the local state
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app.Id === id ? { ...app, ActualDuration: totalMinutes } : app
        )
      );
    } catch (err) {
      console.error('Error updating ActualDuration:', err);
      setError('Failed to update actual duration. Please try again.');
    }
  };

  const handleInvoiceClick = (id: number) => {
    // Show confirmation dialog
    setAppointmentToInvoice(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmInvoice = () => {
    // Process the invoice
    if (appointmentToInvoice) {
      processInvoiceAppointment(appointmentToInvoice);
    }
    
    // Close the dialog
    setShowConfirmDialog(false);
    setAppointmentToInvoice(null);
  };

  const handleCancelInvoice = () => {
    setShowConfirmDialog(false);
    setAppointmentToInvoice(null);
  };

  const processInvoiceAppointment = async (id: number) => {
    setProcessingInvoice(id);
    
    try {
      // Find the appointment to update
      const appointmentToUpdate = appointments.find(app => app.Id === id);
      if (!appointmentToUpdate) {
        setProcessingInvoice(null);
        return;
      }

      // Format time values to ensure they're in the correct format (HH:MM)
      const timeStart = appointmentToUpdate.TimeStart.substring(0, 5); // Get HH:MM part
      const timeEnd = appointmentToUpdate.TimeEnd.substring(0, 5); // Get HH:MM part

      // Update the appointment status to "Inv" (Invoiced)
      await endpoints.appointments.update(id, { 
        Date: appointmentToUpdate.Date,
        TimeStart: timeStart,
        TimeEnd: timeEnd,
        DateEnd: appointmentToUpdate.DateEnd,
        CustomerId: appointmentToUpdate.CustomerId,
        AppointmentStatusId: 'Inv', // Change status to Invoiced
        ActualDuration: appointmentToUpdate.ActualDuration || 0,
        IsPaidInCash: Boolean(appointmentToUpdate.IsPaidInCash) // Explicitly convert to boolean
      });

      // Remove the invoiced appointment from the list
      setAppointments(prevAppointments => 
        prevAppointments.filter(app => app.Id !== id)
      );

      // Show success toast instead of alert
      setToast({
        message: `Appointment #${id} has been marked as invoiced.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error marking appointment as invoiced:', err);
      setError('Failed to mark appointment as invoiced. Please try again.');
    } finally {
      setProcessingInvoice(null);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd-MM-yyyy');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Format HH:MM from HH:MM:SS
  };

  // Helper function to get hours from minutes
  const getHours = (minutes: number): number => {
    return Math.floor(minutes / 60);
  };

  // Helper function to get remaining minutes
  const getMinutes = (minutes: number): number => {
    return minutes % 60;
  };

  // Helper function to calculate planned duration in minutes
  const getPlannedDuration = (timeStart: string, timeEnd: string): number => {
    const [startHours, startMinutes] = timeStart.split(':').map(Number);
    const [endHours, endMinutes] = timeEnd.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes - startTotalMinutes;
  };

  // Helper function to format duration difference
  const formatDurationDifference = (planned: number, actual: number): string => {
    const diff = actual - planned;
    if (diff === 0) return '';
    
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / 60);
    const minutes = absDiff % 60;
    
    const sign = diff > 0 ? '+' : '-';
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
    
    return `${sign}${parts.join(' ')}`;
  };

  const handleSelectAppointment = (id: number) => {
    setSelectedAppointments(prev => {
      if (prev.includes(id)) {
        return prev.filter(appId => appId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedAppointments.length === appointments.length) {
      // If all are selected, deselect all
      setSelectedAppointments([]);
    } else {
      // Otherwise, select all
      setSelectedAppointments(appointments.map(app => app.Id));
    }
  };

  const handleGroupInvoice = () => {
    if (selectedAppointments.length === 0) {
      alert('Please select at least one appointment to invoice.');
      return;
    }
    
    setShowGroupConfirmDialog(true);
  };

  const handleConfirmGroupInvoice = async () => {
    setProcessingGroup(true);
    setShowGroupConfirmDialog(false);
    
    try {
      // Process each selected appointment
      for (const id of selectedAppointments) {
        const appointmentToUpdate = appointments.find(app => app.Id === id);
        if (!appointmentToUpdate) continue;
        
        // Format time values
        const timeStart = appointmentToUpdate.TimeStart.substring(0, 5);
        const timeEnd = appointmentToUpdate.TimeEnd.substring(0, 5);
        
        // Update the appointment status to "Inv" (Invoiced)
        await endpoints.appointments.update(id, { 
          Date: appointmentToUpdate.Date,
          TimeStart: timeStart,
          TimeEnd: timeEnd,
          DateEnd: appointmentToUpdate.DateEnd,
          CustomerId: appointmentToUpdate.CustomerId,
          AppointmentStatusId: 'Inv', // Change status to Invoiced
          ActualDuration: appointmentToUpdate.ActualDuration || 0,
          IsPaidInCash: Boolean(appointmentToUpdate.IsPaidInCash) // Explicitly convert to boolean
        });
      }
      
      // Remove the invoiced appointments from the list
      setAppointments(prevAppointments => 
        prevAppointments.filter(app => !selectedAppointments.includes(app.Id))
      );
      
      // Clear selection
      setSelectedAppointments([]);
      
      // Show success toast instead of alert
      setToast({
        message: `${selectedAppointments.length} appointments have been marked as invoiced.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error marking appointments as invoiced:', err);
      setError('Failed to mark appointments as invoiced. Please try again.');
    } finally {
      setProcessingGroup(false);
    }
  };

  const handleCancelGroupInvoice = () => {
    setShowGroupConfirmDialog(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Individual Confirmation Dialog */}
      {showConfirmDialog && appointmentToInvoice && (
        <ConfirmationDialog 
          appointment={appointments.find(app => app.Id === appointmentToInvoice)}
          onConfirm={handleConfirmInvoice}
          onCancel={handleCancelInvoice}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      )}
      
      {/* Group Confirmation Dialog */}
      {showGroupConfirmDialog && (
        <GroupConfirmationDialog 
          appointments={appointments.filter(app => selectedAppointments.includes(app.Id))}
          onConfirm={handleConfirmGroupInvoice}
          onCancel={handleCancelGroupInvoice}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoice Ready Appointments</h1>
        
        {appointments.length > 0 && (
          <button
            onClick={handleGroupInvoice}
            disabled={selectedAppointments.length === 0 || processingGroup}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedAppointments.length === 0 || processingGroup
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FaFileInvoiceDollar className="mr-2" />
            {processingGroup ? 'Processing...' : `Invoice Selected (${selectedAppointments.length})`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No invoice-ready appointments found</p>
          <p className="text-sm text-gray-400">
            Invoice-ready appointments are past appointments with a "Planned" status
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dogs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => {
                const hours = getHours(appointment.ActualDuration || 0);
                const minutes = getMinutes(appointment.ActualDuration || 0);
                const isSelected = selectedAppointments.includes(appointment.Id);
                
                return (
                  <tr key={appointment.Id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectAppointment(appointment.Id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(appointment.Date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(appointment.TimeStart)} - {formatTime(appointment.TimeEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.CustomerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {appointment.Dogs && appointment.Dogs.length > 0 ? (
                          appointment.Dogs.map(dog => (
                            <span 
                              key={dog.DogId}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {dog.DogName}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">No dogs</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleIsPaidInCashChange(appointment.Id, !appointment.IsPaidInCash)}
                          title={appointment.IsPaidInCash ? "Cash Payment" : "Bank Transfer"}
                        >
                          {appointment.IsPaidInCash ? (
                            <div className="bg-green-100 border border-green-300 rounded-full px-3 py-1 flex items-center">
                              <FaMoneyBillWave className="text-green-500 mr-2" />
                              <span className="text-green-700 text-xs font-medium">PAID IN CASH</span>
                            </div>
                          ) : (
                            <div className="bg-gray-100 border border-gray-300 rounded-full px-3 py-1 flex items-center">
                              <FaUniversity className="text-gray-500 mr-2" />
                              <span className="text-gray-700 text-xs font-medium">BANK TRANSFER</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <FaClock className="text-gray-400 mr-1" />
                        <div className="flex flex-col">
                          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md">
                            <button
                              onClick={() => {
                                const newMinutes = Math.max(0, (hours * 60 + minutes) - 15);
                                handleActualDurationChange(appointment.Id, Math.floor(newMinutes / 60), newMinutes % 60);
                              }}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-l-md focus:outline-none"
                            >
                              -
                            </button>
                            <div className="px-3 py-1 border-x border-gray-300">
                              {hours}h {minutes}m
                            </div>
                            <button
                              onClick={() => {
                                const newMinutes = (hours * 60 + minutes) + 15;
                                handleActualDurationChange(appointment.Id, Math.floor(newMinutes / 60), newMinutes % 60);
                              }}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-r-md focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                          {(() => {
                            const plannedDuration = getPlannedDuration(appointment.TimeStart, appointment.TimeEnd);
                            const actualDuration = appointment.ActualDuration || 0;
                            const diff = formatDurationDifference(plannedDuration, actualDuration);
                            
                            if (diff) {
                              return (
                                <div className={`text-xs mt-1 ${diff.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                                  {diff} from planned
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{Number(appointment.TotalPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/appointments/${appointment.Id}/edit?returnTo=/appointments/invoice-ready`}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 flex items-center"
                        >
                          <FaEdit className="mr-1" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleInvoiceClick(appointment.Id)}
                          className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 flex items-center"
                          disabled={processingInvoice === appointment.Id}
                        >
                          <FaFileInvoiceDollar className="mr-1" />
                          <span>{processingInvoice === appointment.Id ? 'Processing...' : 'Invoice'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 