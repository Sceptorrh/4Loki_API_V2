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

  const handleCustomerClick = (customer: CustomerDropdownItem) => {
    console.log('Customer clicked:', customer);
    setSelectedCustomerId(customer.id);
    if (onCustomerSelected) {
      onCustomerSelected({
          id: customer.id,
          dogs: customer.dogs
      });
    }
    setDropdownOpen(false);
  };

  const clearCustomer = () => {
    console.log('CustomerSelection - clearCustomer called');
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

  console.log('CustomerSelection - Current state:', {
    selectedCustomerId,
    searchTerm,
    dropdownOpen,
    customersCount: customers.length,
    filteredCustomersCount: filteredCustomers.length
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
                if (!selectedCustomerId) {
                  setSearchTerm(e.target.value);
                }
                setDropdownOpen(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
              }}
              onClick={() => {
                setDropdownOpen(true);
              }}
              readOnly
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
        
        {dropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-2 text-gray-500">No customers found</div>
            ) : (
              filteredCustomers.map(customer => (
                <div 
                  key={customer.id}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedCustomerId === customer.id ? 'bg-primary-50' : ''}`}
                  onClick={() => {
                    console.log('CustomerSelection - Customer clicked:', customer);
                    handleCustomerClick(customer);
                  }}
                >
                  <div className="font-medium">{customer.contactperson}</div>
                  {customer.dogs && customer.dogs.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Dogs: {customer.dogs.map((d, index) => (
                        <span key={d.id}>{d.name}{index < customer.dogs.length - 1 ? ', ' : ''}</span>
                      ))}
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