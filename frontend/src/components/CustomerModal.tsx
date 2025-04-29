import { FaTimes } from 'react-icons/fa';
import CustomerForm from './CustomerForm';

interface CustomerModalProps {
  onClose: () => void;
  onCustomerCreated: (customerId: number, customerName: string) => void;
  preFilledName?: string;
}

export default function CustomerModal({ onClose, onCustomerCreated, preFilledName }: CustomerModalProps) {
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

        <CustomerForm
          onSubmit={onCustomerCreated}
          onCancel={onClose}
          preFilledName={preFilledName}
          isModal={true}
          showHeader={false}
        />
      </div>
    </div>
  );
} 