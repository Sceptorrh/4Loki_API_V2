import { useState } from 'react';
import { endpoints } from '@/lib/api';
import GoogleContactsSelector from '@/components/GoogleContactsSelector';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WarningModal from './WarningModal';

interface CustomerFormProps {
  onSubmit: (customerId: number, customerName: string) => void;
  onCancel?: () => void;
  preFilledName?: string;
  isModal?: boolean;
  showHeader?: boolean;
}

export default function CustomerForm({ onSubmit, onCancel, preFilledName, isModal = false, showHeader = true }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: preFilledName || '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    is_allow_contact_share: ''
  });

  const [showWarning, setShowWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);

  // Phone number validation regex
  const phoneRegex = /^(\+31|0)[1-9][0-9]{8}$/;

  const validatePhoneNumber = (phone: string) => {
    // Remove all spaces and dashes for validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSelect = (contact: { name: string; email: string; phone: string }) => {
    setFormData(prev => ({
      ...prev,
      name: contact.name,
      contact: contact.name,
      ...(contact.email !== 'No email' && { email: contact.email }),
      ...(contact.phone !== 'No phone' && { phone: contact.phone })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for required fields
    if (!formData.name || !formData.contact || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(formData.phone)) {
      setShowWarning(true);
      setPendingSubmit(() => async () => {
        await submitForm();
      });
      return;
    }

    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      // Map form data to API format with Dutch field names
      const apiData = {
        Naam: formData.name,
        Contactpersoon: formData.contact,
        Emailadres: formData.email,
        Telefoonnummer: formData.phone,
        Adres: formData.address,
        Plaats: formData.city,
        Postcode: formData.postal_code,
        Notities: formData.notes,
        IsAllowContactShare: formData.is_allow_contact_share ? 'yes' : null
      };

      const response = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      const data = await response.json();
      if (onSubmit) {
        onSubmit(data.id, data.name);
      } else {
        router.push(`/customers/${data.id}`);
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      if (err instanceof Error) {
        // Try to parse API validation errors
        try {
          const errorObj = JSON.parse(err.message);
          if (Array.isArray(errorObj)) {
            const formattedErrors = errorObj.map((e: any) => `${e.field}: ${e.message}`).join('\n');
            setError(formattedErrors);
          } else {
            setError(err.message);
          }
        } catch {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWarningConfirm = () => {
    setShowWarning(false);
    if (pendingSubmit) {
      pendingSubmit();
    }
  };

  const handleWarningClose = () => {
    setShowWarning(false);
    setPendingSubmit(null);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
        </div>
      )}

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md whitespace-pre-line">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={isModal ? 'space-y-6' : 'card'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <GoogleContactsSelector
                value={formData.name}
                onChange={(value) => handleChange({ target: { name: 'name', value } } as React.ChangeEvent<HTMLInputElement>)}
                onSelect={handleContactSelect}
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
              {!isModal && (
                <p className="text-xs text-gray-500 mt-1">
                  This is the person you'll make appointments with. Often the same as the Name.
                </p>
              )}
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
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                required
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
          
          <div className={`flex justify-end space-x-3 ${isModal ? 'pt-4' : 'mt-8'}`}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
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

      <WarningModal
        isOpen={showWarning}
        onClose={handleWarningClose}
        onConfirm={handleWarningConfirm}
        title="Invalid Phone Number"
        message="The phone number you entered doesn't match the expected format. Would you like to continue anyway?"
      />
    </div>
  );
} 