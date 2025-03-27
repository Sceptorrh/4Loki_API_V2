'use client';

import { useParams, useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function EditAppointmentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const appointmentId = parseInt(params.id as string);
  const returnTo = searchParams.get('returnTo');

  return (
    <AppointmentForm
      mode="edit"
      appointmentId={appointmentId}
      returnTo={returnTo || undefined}
    />
  );
} 