'use client';

import { useState, useEffect } from 'react';
import { endpoints } from '@/lib/api';
import Link from 'next/link';
import { Customer, Dog } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    
    // Use the correct property names from the API response
    const contactPerson = customer.Contactpersoon || '';
    const email = (customer.Emailadres || '').toLowerCase();
    const phone = (customer.Telefoonnummer || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return contactPerson.toLowerCase().includes(search) || email.includes(search) || phone.includes(search);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link href="/customers/new" className="btn btn-primary">
          New Customer
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers..."
          className="input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dogs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Appointment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.Id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.Contactpersoon || ''}
                    </div>
                    <div className="text-sm text-gray-500">
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
                        customer.Dogs.map((dogName, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {dogName}
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
                        customer.DaysSinceLastAppointment > 180 
                          ? 'text-red-600' 
                          : customer.DaysSinceLastAppointment > 90 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {customer.DaysSinceLastAppointment} days ago
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/customers/${customer.Id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/customers/${customer.Id}/edit`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/appointments/new?customer_id=${customer.Id}`}
                      className="text-primary-600 hover:text-primary-900"
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