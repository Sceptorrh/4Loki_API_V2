import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { endpoints } from '@/lib/api';

interface CustomerModalProps {
  onClose: () => void;
  onCustomerCreated: (customerId: number, customerName: string) => void;
  preFilledName?: string;
}

export default function CustomerModal({ onClose, onCustomerCreated, preFilledName }: CustomerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: preFilledName || '',
    contact: '',
    email: '',
    phone: '',
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
        Notities: formData.notes || undefined,
        IsAllowContactShare: formData.is_allow_contact_share || undefined
      };
      
      const response = await endpoints.customers.create(apiData);
      
      // Pass the new customer data back to the parent component
      onCustomerCreated(response.data.Id, formData.name);
      
      // Close the modal
      onClose();
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(err.response?.data?.message || 'Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Customer</h3>
          <button 
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="input w-full"
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
                className="input w-full"
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
                className="input w-full"
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
                rows={3}
                className="input w-full"
                placeholder="Any additional information about this customer"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
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