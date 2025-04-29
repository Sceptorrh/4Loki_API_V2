import { FaTimes } from 'react-icons/fa';
import DogForm from '@/components/dogs/DogForm';

interface DogModalProps {
  onClose: () => void;
  onDogCreated: (dogId: number, dogName: string) => void;
  customerId: number;
}

export default function DogModal({ onClose, onDogCreated, customerId }: DogModalProps) {
  const handleSuccess = (dogId: number) => {
    onDogCreated(dogId, '');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Dog</h3>
          <button 
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <DogForm 
          initialCustomerId={customerId}
          onSuccess={handleSuccess}
          showCustomerSelection={false}
          backUrl="#"
          showHeader={false}
          onCancel={onClose}
        />
      </div>
    </div>
  );
} 