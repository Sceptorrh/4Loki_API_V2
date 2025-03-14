import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const endpoints = {
  // Appointments
  appointments: {
    getAll: () => api.get('/appointments'),
    getById: (id: number) => api.get(`/appointments/${id}`),
    create: (data: any) => api.post('/appointments', data),
    createComplete: (data: any) => api.post('/appointments/complete', data),
    update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
    delete: (id: number) => api.delete(`/appointments/${id}`),
    getByYearMonth: (year: number, month: number) => api.get(`/appointments/year/${year}/month/${month}`),
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
};

export default api; 