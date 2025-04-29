import { FaExclamationTriangle } from 'react-icons/fa';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function WarningModal({ isOpen, onClose, onConfirm, title, message }: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-yellow-500 mr-2" size={24} />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
} 