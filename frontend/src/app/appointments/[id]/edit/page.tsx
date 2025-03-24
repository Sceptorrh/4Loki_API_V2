'use client';

import { useParams } from 'next/navigation';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function EditAppointmentPage() {
  const params = useParams();
  const appointmentId = parseInt(params.id as string);

  return (
    <AppointmentForm
      mode="edit"
      appointmentId={appointmentId}
    />
  );
} 