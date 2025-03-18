'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Customer, Dog } from '@/types';
import ActiveCustomers from './components/ActiveCustomers';
import { FaCheckCircle } from 'react-icons/fa';

type SortField = 'customer' | 'lastAppointment' | 'averageInterval' | null;
type SortDirection = 'asc' | 'desc';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomerIds, setActiveCustomerIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await endpoints.customers.getTable();
        console.log('API Response:', response.data);
        console.log('First customer:', response.data && response.data.length > 0 ? response.data[0] : 'No customers');
        console.log('Customer properties:', response.data && response.data.length > 0 ? Object.keys(response.data[0]) : 'No properties');
        setCustomers(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Handle active customers list update
  const handleActiveCustomersUpdate = (activeCustomers: Customer[]) => {
    const ids = new Set(activeCustomers.map(c => c.Id as number));
    setActiveCustomerIds(ids);
  };

  // Check if a customer is active
  const isCustomerActive = (customerId: number | undefined): boolean => {
    if (!customerId) return false;
    return activeCustomerIds.has(customerId);
  };

  // Filter customers based on search term and active filter
  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    
    // Filter by active status if the toggle is on
    if (showActiveOnly && !isCustomerActive(customer.Id)) {
      return false;
    }
    
    const search = searchTerm.toLowerCase();
    
    // Search by customer name
    const customerName = (customer.Contactpersoon || '').toLowerCase();
    if (customerName.includes(search)) return true;
    
    // Search by email
    const email = (customer.Emailadres || '').toLowerCase();
    if (email.includes(search)) return true;
    
    // Search by phone number
    const phone = (customer.Telefoonnummer || '').toLowerCase();
    if (phone.includes(search)) return true;
    
    // Search by dog names
    if (customer.Dogs && Array.isArray(customer.Dogs)) {
      const hasMatchingDog = customer.Dogs.some(dog => {
        const dogName = typeof dog === 'string' 
          ? dog.toLowerCase() 
          : ((dog.Name || dog.name || '') as string).toLowerCase();
        return dogName.includes(search);
      });
      if (hasMatchingDog) return true;
    }
    
    return false;
  });

  // Sort customers based on current sort field and direction
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'customer':
        aValue = (a.Contactpersoon || '').toLowerCase();
        bValue = (b.Contactpersoon || '').toLowerCase();
        break;
      case 'lastAppointment':
        // Use DaysSinceLastAppointment to sort
        aValue = a.DaysSinceLastAppointment !== null && a.DaysSinceLastAppointment !== undefined
          ? a.DaysSinceLastAppointment 
          : Number.MAX_SAFE_INTEGER; // Customers without appointments go at the end (or beginning if desc)
        bValue = b.DaysSinceLastAppointment !== null && b.DaysSinceLastAppointment !== undefined
          ? b.DaysSinceLastAppointment 
          : Number.MAX_SAFE_INTEGER;
        break;
      case 'averageInterval':
        // Use AverageInterval to sort
        aValue = a.AverageInterval !== null && a.AverageInterval !== undefined
          ? a.AverageInterval
          : Number.MAX_SAFE_INTEGER; // Customers without average interval go at the end (or beginning if desc)
        bValue = b.AverageInterval !== null && b.AverageInterval !== undefined
          ? b.AverageInterval
          : Number.MAX_SAFE_INTEGER;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Handle row navigation with click delay to detect double clicks
  const handleRowClick = (customerId: string | number | undefined) => {
    if (!customerId) return;
    
    // If already tracking a click, it's a double click
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
      router.push(`/customers/${customerId}/edit`);
    } else {
      // Set a timeout to detect if this is a single click
      const timer = setTimeout(() => {
        setClickTimer(null);
        router.push(`/customers/${customerId}`);
      }, 250); // 250ms delay to detect double click
      
      setClickTimer(timer);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link href="/customers/new" className="btn btn-primary">
          New Customer
        </Link>
      </div>

      {/* Active Customers Component */}
      {!loading && !error && customers.length > 0 && (
        <ActiveCustomers 
          customers={customers} 
          onActiveListUpdated={handleActiveCustomersUpdate}
        />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by customer name, email, phone, or dog name..."
            className="input flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center whitespace-nowrap">
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input 
                type="checkbox" 
                id="activeToggle"
                className="sr-only peer"
                checked={showActiveOnly}
                onChange={() => setShowActiveOnly(!showActiveOnly)}
              />
              <label 
                htmlFor="activeToggle"
                className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
              ></label>
            </div>
            <label htmlFor="activeToggle" className="text-sm font-medium text-gray-700 cursor-pointer">
              Show active customers only
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {searchTerm ? (
            <p className="text-gray-500 mb-4">No customers found matching "{searchTerm}"</p>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No customers found</p>
              <Link href="/customers/new" className="btn btn-primary">
                Add your first customer
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer')}
                >
                  Customer <SortIcon field="customer" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dogs
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastAppointment')}
                >
                  Next/Last Appointment <SortIcon field="lastAppointment" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('averageInterval')}
                >
                  Avg Interval <SortIcon field="averageInterval" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <tr 
                  key={customer.Id}
                  onClick={() => handleRowClick(customer.Id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isCustomerActive(customer.Id) && (
                        <span className="text-green-500 mr-2" title="Active Customer">
                          <FaCheckCircle />
                        </span>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {customer.Contactpersoon || ''}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-0">
                      {/* City and postal code not available in this API response */}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.Emailadres || 'No email'}</div>
                    <div className="text-sm text-gray-500">{customer.Telefoonnummer || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.Dogs && Array.isArray(customer.Dogs) && customer.Dogs.length > 0 ? (
                        customer.Dogs.map((dog, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {typeof dog === 'string' ? dog : (dog.Name || dog.name || 'Unnamed')}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No dogs</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.DaysSinceLastAppointment !== null && customer.DaysSinceLastAppointment !== undefined ? (
                      <span className={`text-sm ${
                        customer.DaysSinceLastAppointment < 0 
                          ? 'text-blue-600' 
                          : customer.DaysSinceLastAppointment > 180 
                            ? 'text-red-600' 
                            : customer.DaysSinceLastAppointment > 90 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                      }`}>
                        {customer.DaysSinceLastAppointment < 0 
                          ? `In ${Math.abs(customer.DaysSinceLastAppointment)} days`
                          : `${customer.DaysSinceLastAppointment} days ago`}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.AverageInterval !== null && customer.AverageInterval !== undefined ? (
                      <span className={`text-sm ${
                        customer.AverageInterval > 180 ? 'text-red-600 font-medium' : 
                        customer.AverageInterval > 90 ? 'text-yellow-600 font-medium' : 
                        'text-green-600 font-medium'
                      }`}>
                        {customer.AverageInterval} days
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not available</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/customers/${customer.Id}/edit`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      onClick={(e) => e.stopPropagation()} // Prevent row click
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/appointments/new?customer_id=${customer.Id}`}
                      className="text-primary-600 hover:text-primary-900"
                      onClick={(e) => e.stopPropagation()} // Prevent row click
                    >
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 