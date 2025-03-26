import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/lib/api';

interface GoogleContact {
  resourceName: string;
  person?: {
    names?: Array<{
      displayName?: string;
    }>;
    emailAddresses?: Array<{
      value?: string;
    }>;
    phoneNumbers?: Array<{
      value?: string;
    }>;
  };
}

interface Customer {
  Id: number;
  Contactpersoon: string;
  Naam: string;
  Emailadres: string;
  Telefoonnummer: string;
}

interface GoogleContactsSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (contact: { name: string; email: string; phone: string }) => void;
  placeholder?: string;
}

// Function to normalize phone numbers for comparison
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If the number starts with a country code (e.g., +31), remove it
  if (digits.startsWith('31')) {
    return digits.slice(2);
  }
  
  // If the number starts with 0, remove it
  if (digits.startsWith('0')) {
    return digits.slice(1);
  }
  
  return digits;
}

// Function to clean special characters from names
function cleanName(name: string): string {
  // Remove emojis and other special characters, keeping only letters, numbers, spaces, and basic punctuation
  return name.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[^\w\s.,-]/g, '') // Remove any remaining special characters except basic punctuation
    .trim();
}

export default function GoogleContactsSelector({ 
  value, 
  onChange, 
  onSelect,
  placeholder = 'Search contacts...'
}: GoogleContactsSelectorProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch existing customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await endpoints.customers.getAll();
        setExistingCustomers(response.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch contacts from Google
  const fetchContacts = async (query: string) => {
    if (!query) {
      setContacts([]);
      return;
    }

    try {
      setLoading(true);
      const response = await endpoints.google.contacts.search(query);
      if (response.status === 401) {
        // Redirect to Google login
        window.location.href = '/api/auth/google/login';
        return;
      }
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchContacts(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update search query when input value changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Filter contacts based on search term and existing customers
  const filteredContacts = contacts.filter(contact => {
    // The contact object from searchContacts has a different structure
    const name = contact.person?.names?.[0]?.displayName?.toLowerCase() || '';
    const email = contact.person?.emailAddresses?.[0]?.value?.toLowerCase() || '';
    const phone = contact.person?.phoneNumbers?.[0]?.value || '';

    // Check if contact matches search term
    const matchesSearch = searchQuery === '' || 
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);

    return matchesSearch;
  });

  // Check if a contact is an existing customer
  const isExistingCustomer = (contact: GoogleContact): boolean => {
    const name = contact.person?.names?.[0]?.displayName?.toLowerCase() || '';
    const email = contact.person?.emailAddresses?.[0]?.value?.toLowerCase() || '';
    const phone = contact.person?.phoneNumbers?.[0]?.value || '';
    const normalizedPhone = normalizePhoneNumber(phone);

    console.log('Checking contact:', {
      name,
      email,
      phone,
      normalizedPhone
    });

    return existingCustomers.some(customer => {
      const customerName = customer.Naam.toLowerCase();
      const customerContact = customer.Contactpersoon.toLowerCase();
      const customerEmail = customer.Emailadres?.toLowerCase() || '';
      const customerPhone = customer.Telefoonnummer ? normalizePhoneNumber(customer.Telefoonnummer) : '';

      console.log('Comparing with customer:', {
        name: customerName,
        contact: customerContact,
        email: customerEmail,
        phone: customer.Telefoonnummer,
        normalizedPhone: customerPhone
      });

      // Check for exact matches (case-insensitive)
      const matches = (
        customerName === name ||
        customerContact === name ||
        (email && customerEmail && customerEmail === email) ||
        (normalizedPhone && customerPhone && customerPhone === normalizedPhone)
      );

      if (matches) {
        console.log('Match found!', {
          name: customerName === name,
          contact: customerContact === name,
          email: email && customerEmail && customerEmail === email,
          phone: normalizedPhone && customerPhone && customerPhone === normalizedPhone,
          phoneDetails: {
            contact: normalizedPhone,
            customer: customerPhone
          }
        });
      }

      return matches;
    });
  };

  // Handle clicking outside the suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="input w-full"
      />

      {error && (
        <div className="text-red-600 text-sm mt-1">{error}</div>
      )}

      {showSuggestions && (value.trim() || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
          {loading ? (
            <div className="p-2 text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-2 text-gray-500">No contacts found</div>
          ) : (
            filteredContacts.map((contact) => {
              const name = contact.person?.names?.[0]?.displayName || 'No name';
              const email = contact.person?.emailAddresses?.[0]?.value || 'No email';
              const phone = contact.person?.phoneNumbers?.[0]?.value || 'No phone';
              const exists = isExistingCustomer(contact);

              return (
                <button
                  key={contact.resourceName}
                  onClick={() => {
                    if (!exists) {
                      onSelect({ 
                        name: cleanName(name), 
                        email, 
                        phone 
                      });
                      setShowSuggestions(false);
                    }
                  }}
                  disabled={exists}
                  className={`w-full text-left p-2 border-b last:border-b-0 ${
                    exists 
                      ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-gray-600">{email}</div>
                  <div className="text-sm text-gray-600">{phone}</div>
                  {exists && (
                    <div className="text-xs text-gray-500 mt-1">Already added as a customer</div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
} 