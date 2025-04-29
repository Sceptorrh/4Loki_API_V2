import { useState } from 'react';
import { endpoints } from '@/lib/api';
import GoogleContactsSelector from '@/components/GoogleContactsSelector';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WarningModal from './WarningModal';

interface CustomerFormData {
  Name: string;
  Contactperson: string;
  Email: string;
  Phone: string;
  Notes: string;
  IsAllowContactShare: boolean;
}

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
  
  const [formData, setFormData] = useState<CustomerFormData>({
    Name: preFilledName || '',
    Contactperson: '',
    Email: '',
    Phone: '',
    Notes: '',
    IsAllowContactShare: false
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSelect = (contact: { name: string; email: string; phone: string }) => {
    setFormData(prev => ({
      ...prev,
      Name: contact.name,
      Contactperson: contact.name,
      Email: contact.email,
      Phone: contact.phone
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for required fields
    if (!formData.Name || !formData.Contactperson || !formData.Phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(formData.Phone)) {
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
      // Map form data to API format matching database schema
      const apiData = {
        Name: formData.Name,
        Contactperson: formData.Contactperson,
        Email: formData.Email,
        Phone: formData.Phone,
        Notes: formData.Notes,
        IsAllowContactShare: formData.IsAllowContactShare ? 'yes' : null
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
        onSubmit(data.id, data.Name);
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
    <div className="max-w-2xl mx-auto">
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new customer profile
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <GoogleContactsSelector
                value={formData.Name}
                onChange={(value) => setFormData(prev => ({ ...prev, Name: value }))}
                onSelect={handleContactSelect}
                placeholder="Search contacts..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="Contactperson" className="block text-sm font-medium text-gray-700">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="Contactperson"
                id="Contactperson"
                required
                value={formData.Contactperson}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Person to make appointments with"
              />
            </div>
          </div>

          <div>
            <label htmlFor="Email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="Email"
                id="Email"
                value={formData.Email}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="customer@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="Phone" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="tel"
                name="Phone"
                id="Phone"
                required
                value={formData.Phone}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="+31 6 12345678 or 06 12345678"
              />
            </div>
            {!validatePhoneNumber(formData.Phone) && formData.Phone && (
              <p className="mt-1 text-sm text-yellow-600">
                Please enter a valid Dutch phone number (e.g., +31 6 12345678 or 06 12345678)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="Notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <div className="mt-1">
              <textarea
                name="Notes"
                id="Notes"
                rows={3}
                value={formData.Notes}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Additional information about the customer"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="IsAllowContactShare"
              id="IsAllowContactShare"
              checked={formData.IsAllowContactShare}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="IsAllowContactShare" className="ml-2 block text-sm text-gray-700">
              Allow contact sharing
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
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