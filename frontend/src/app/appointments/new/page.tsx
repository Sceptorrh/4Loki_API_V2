'use client';

import { useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function NewAppointmentPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const date = searchParams.get('date');

  return (
    <AppointmentForm
      mode="new"
      initialCustomerId={customerId ? parseInt(customerId) : undefined}
      initialDate={date || undefined}
    />
  );
} 