'use client';

import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setSelectedCustomerId: (id: number | null) => void;
  setShowCustomerModal: (show: boolean) => void;
  onCustomerSelected?: (customer: { id: number; dogs: any[] } | null) => void;
}

export default function CustomerSelection({
  selectedCustomerId,
  customers,
  searchTerm,
  setSearchTerm,
  setSelectedCustomerId,
  setShowCustomerModal,
  onCustomerSelected
}: CustomerSelectionProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setDropdownOpen(false);
    setSearchTerm('');
    
    // Call onCustomerSelected callback if provided
    if (onCustomerSelected) {
      const selectedCustomer = customers.find(c => c.id === customerId) || null;
      onCustomerSelected(selectedCustomer);
    }
  };

  const clearCustomer = () => {
    setSelectedCustomerId(null);
    setSearchTerm('');
    
    // Call onCustomerSelected callback with null if provided
    if (onCustomerSelected) {
      onCustomerSelected(null);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    
    // Check if customer name or contactperson matches search
    if (customer.contactperson.toLowerCase().includes(search)) return true;
    
    // Check if any dog name matches search
    return customer.dogs.some(dog => 
      dog.name.toLowerCase().includes(search)
    );
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          onClick={() => setShowCustomerModal(true)}
          title="Add New Customer"
        >
          <FaPlus size={14} />
        </button>
        <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
          Customer *
        </label>
      </div>
      <div className="relative" ref={dropdownRef}>
        <div className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              id="customer"
              className="input pr-10 w-full"
              placeholder="Search customer..."
              value={selectedCustomerId 
                ? customers.find(c => c.id === selectedCustomerId)?.contactperson || ''
                : searchTerm
              }
              onChange={(e) => {
                if (selectedCustomerId) return; // Don't allow changes when customer is selected
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => {
                if (!selectedCustomerId) setDropdownOpen(true);
              }}
              readOnly={selectedCustomerId !== null}
            />
            {selectedCustomerId && (
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={clearCustomer}
              >
                <FaTimes size={16} />
              </button>
            )}
          </div>
        </div>
        
        {dropdownOpen && !selectedCustomerId && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-2 text-gray-500">No customers found</div>
            ) : (
              filteredCustomers.map(customer => (
                <div 
                  key={customer.id}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedCustomerId === customer.id ? 'bg-primary-50' : ''}`}
                  onClick={() => handleCustomerChange(customer.id)}
                >
                  <div className="font-medium">{customer.contactperson}</div>
                  {customer.dogs.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Dogs: {customer.dogs.map(d => d.name).join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 