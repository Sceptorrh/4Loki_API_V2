'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Number(params.id);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    notes: '',
    is_allow_contact_share: ''
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const response = await endpoints.customers.getById(customerId);
        console.log('Customer detail response:', response.data);
        
        // Initialize form with customer data
        setFormData({
          name: response.data.Naam || '',
          contact: response.data.Contactpersoon || '',
          email: response.data.Emailadres || '',
          phone: response.data.Telefoonnummer || '',
          notes: response.data.Notities || '',
          is_allow_contact_share: response.data.IsAllowContactShare || ''
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.contact) {
      setError('Please fill in both Name and Contact fields.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Transform data to match API expectations
      const apiData = {
        Naam: formData.name,
        Contactpersoon: formData.contact,
        Emailadres: formData.email || undefined,
        Telefoonnummer: formData.phone || undefined,
        Notities: formData.notes || undefined,
        IsAllowContactShare: formData.is_allow_contact_share || undefined
      };
      
      await endpoints.customers.update(customerId, apiData);
      
      // Redirect back to customer details
      router.push(`/customers/${customerId}`);
    } catch (err: any) {
      console.error('Error updating customer:', err);
      setError(err.response?.data?.message || 'Failed to update customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder="Customer name or business name"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="input flex-grow"
                  required
                  placeholder="Person to make appointments with"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contact: prev.name }))}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Copy from Name
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the person you'll make appointments with. Often the same as the Name.
              </p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="is_allow_contact_share" className="block text-sm font-medium text-gray-700 mb-1">
                Allow Contact Sharing
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'unknown', label: 'Unknown' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_allow_contact_share: option.value }))}
                    className={`px-4 py-2 rounded-md border ${
                      formData.is_allow_contact_share === option.value
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                {formData.is_allow_contact_share && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_allow_contact_share: '' }))}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="input"
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <Link href={`/customers/${customerId}`} className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 