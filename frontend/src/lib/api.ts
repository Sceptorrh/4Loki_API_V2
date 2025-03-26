import axios from 'axios';
import Cookies from 'js-cookie';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies and credentials
});

// Add request interceptor to include session ID in headers
api.interceptors.request.use((config) => {
  const sessionId = Cookies.get('session_id');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

// API endpoints
export const endpoints = {
  // Appointments
  appointments: {
    getAll: () => api.get('/appointments'),
    getById: (id: number) => api.get(`/appointments/${id}`),
    getComplete: (id: number) => api.get(`/appointments/${id}/complete`),
    create: (data: any) => api.post('/appointments', data),
    createComplete: (data: any) => api.post('/appointments/complete', data),
    update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
    updateComplete: (id: number, data: any) => api.put(`/appointments/${id}/complete`, data),
    delete: (id: number) => api.delete(`/appointments/${id}`),
    getByYearMonth: (year: number, month: number) => api.get(`/appointments/year/${year}/month/${month}`),
    getByCustomerId: (customerId: number) => api.get(`/appointments/customer/${customerId}`),
    getInvoiceReady: () => api.get('/appointments/invoice-ready'),
    getByDate: (date: string) => api.get(`/appointments/date/${date}`),
  },
  
  // Customers
  customers: {
    getAll: () => api.get('/customers'),
    getTable: () => api.get('/customers/table'),
    getById: (id: number) => api.get(`/customers/${id}`),
    create: (data: any) => api.post('/customers', data),
    update: (id: number, data: any) => api.put(`/customers/${id}`, data),
    delete: (id: number) => api.delete(`/customers/${id}`),
    getDropdown: () => api.get('/dropdowns/customers'),
    getActive: () => api.get('/customers/active'),
    getActiveHistory: () => api.get('/customers/active/history'),
  },
  
  // Dogs
  dogs: {
    getAll: () => api.get('/dogs'),
    getTable: () => api.get('/dogs/table'),
    getById: (id: number) => api.get(`/dogs/${id}`),
    create: (data: any) => api.post('/dogs', data),
    update: (id: number, data: any) => api.put(`/dogs/${id}`, data),
    delete: (id: number) => api.delete(`/dogs/${id}`),
  },
  
  // Invoices
  invoices: {
    getAll: () => api.get('/invoices'),
    getById: (id: number) => api.get(`/invoices/${id}`),
    create: (data: any) => api.post('/invoices', data),
    update: (id: number, data: any) => api.put(`/invoices/${id}`, data),
    delete: (id: number) => api.delete(`/invoices/${id}`),
  },
  
  // Dog Breeds
  dogBreeds: {
    getAll: () => api.get('/static/dog-breeds'),
  },
  
  // Dog Sizes
  dogSizes: {
    getAll: () => api.get('/static/dog-sizes'),
  },
  
  // Services
  services: {
    getAll: () => api.get('/static/services'),
    getById: (id: string) => api.get(`/static/services/${id}`),
  },
  
  // Appointment Statuses
  appointmentStatuses: {
    getAll: () => api.get('/static/appointment-statuses'),
  },
  
  // Export Logs
  exportLogs: {
    getAll: () => api.get('/export-logs'),
    getById: (id: number) => api.get(`/export-logs/${id}`),
    create: (data: any) => api.post('/export-logs', data),
    revertExport: (id: number, data: any) => api.post(`/export-logs/${id}/revert`, data),
    revertAppointment: (exportId: number, appointmentId: number) => 
      api.post(`/export-logs/${exportId}/appointments/${appointmentId}/revert`),
  },
  
  // Exports
  exports: {
    getExportReady: () => api.get('/appointments/export-ready'),
    markAsExported: (appointmentIds: number[]) => api.post('/appointments/mark-exported', { appointmentIds }),
    generateExcel: (appointmentIds: number[]) => api.post('/exports/excel', { appointmentIds }, { responseType: 'blob' }),
    revertToInvoiced: (appointmentIds: number[]) => api.post('/appointments/revert-to-invoiced', { appointmentIds }),
  },
  
  // Travel Times
  travelTimes: {
    getAll: () => api.get('/travel-times'),
    getById: (id: number) => api.get(`/travel-times/${id}`),
    create: (data: any) => api.post('/travel-times', data),
    update: (id: number, data: any) => api.put(`/travel-times/${id}`, data),
    delete: (id: number) => api.delete(`/travel-times/${id}`),
    updateHomeWork: (data: any) => api.post('/travel-times/update', data),
    calculate: (data: any) => api.post('/travel-times/calculate', data),
    getStats: () => api.get('/travel-times/stats'),
  },

  // Google Maps
  google: {
    maps: {
      places: {
        autocomplete: (input: string) => api.get(`/google/maps/places/autocomplete?input=${encodeURIComponent(input)}`),
        details: (placeId: string) => api.get(`/google/maps/places/details?place_id=${placeId}`),
      },
      forwardGeocode: (address: string) => api.get(`/google/maps/forward-geocode?address=${encodeURIComponent(address)}`),
    },
    contacts: {
      search: (query: string) => api.get(`/google/contacts?q=${encodeURIComponent(query)}`),
    },
    auth: {
      token: () => api.get('/google/auth/token'),
      user: () => api.get('/google/auth/user'),
    },
    settings: {
      get: () => api.get('/settings/google'),
    },
  },
};

export default api; 