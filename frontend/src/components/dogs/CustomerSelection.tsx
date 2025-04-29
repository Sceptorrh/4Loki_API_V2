import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import CustomerModal from '@/components/CustomerModal';

interface CustomerDropdownItem {
  id: number;
  contactperson: string;
  dogs: {
    id: number;
    name: string;
  }[];
}

interface CustomerSelectionProps {
  selectedCustomerId: number | null;
  customers: CustomerDropdownItem[];
  onCustomerChange: (customerId: number) => void;
}

export default function CustomerSelection({
  selectedCustomerId,
  customers,
  onCustomerChange
}: CustomerSelectionProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to handle clicking outside the dropdown
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false);
    }
  }
  
  // Add event listener for clicks outside dropdown
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCustomerCreated = async (customerId: number, customerName: string) => {
    onCustomerChange(customerId);
    setShowCustomerModal(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          onClick={() => setShowCustomerModal(true)}
          title="Add New Customer"
        >
          <FaPlus size={14} />
        </button>
        <label className="block text-sm font-medium text-gray-700">
          Customer *
        </label>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full input flex justify-between items-center"
        >
          <span>
            {selectedCustomerId
              ? customers.find(c => c.id === selectedCustomerId)?.contactperson
              : 'Select a customer'}
          </span>
          <span className="ml-2">▼</span>
        </button>
        {dropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onCustomerChange(customer.id);
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {customer.contactperson}
              </button>
            ))}
          </div>
        )}
      </div>

      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
} 