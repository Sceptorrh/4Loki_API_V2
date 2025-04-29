'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerForm from '@/components/CustomerForm';

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSubmit = async (customerId: number, customerName: string) => {
    // Redirect to the new customer's page
    router.push(`/customers/${customerId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/customers" 
          className="text-primary-600 hover:text-primary-900"
        >
          &larr; Back to Customers
        </Link>
      </div>

      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/customers')}
      />
    </div>
  );
} 