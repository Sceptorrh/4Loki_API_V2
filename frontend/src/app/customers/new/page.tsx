'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    is_allow_contact_share: ''
  });

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
        Address: formData.address || undefined,
        City: formData.city || undefined,
        PostalCode: formData.postal_code || undefined,
        Notities: formData.notes || undefined,
        IsAllowContactShare: formData.is_allow_contact_share || undefined
      };
      
      const response = await endpoints.customers.create(apiData);
      
      // Redirect to the new customer's page
      router.push(`/customers/${response.data.Id}`);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(err.response?.data?.message || 'Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
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
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="is_allow_contact_share" className="block text-sm font-medium text-gray-700 mb-1">
                Allow Contact Sharing
              </label>
              <select
                id="is_allow_contact_share"
                name="is_allow_contact_share"
                value={formData.is_allow_contact_share}
                onChange={handleChange}
                className="input"
              >
                <option value="">Not specified</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
                <option value="Not asked">Not asked</option>
              </select>
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
            <Link href="/customers" className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 