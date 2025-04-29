'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DogForm from '@/components/dogs/DogForm';

export default function NewDogPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={customerId ? `/customers/${customerId}` : '/dogs'} 
          className="text-primary-600 hover:text-primary-900"
        >
          &larr; {customerId ? 'Back to Customer' : 'Back to Dogs'}
        </Link>
      </div>

      <DogForm 
        initialCustomerId={customerId ? parseInt(customerId) : null}
        showCustomerSelection={!customerId}
        backUrl={customerId ? `/customers/${customerId}` : '/dogs'}
      />
    </div>
  );
} 