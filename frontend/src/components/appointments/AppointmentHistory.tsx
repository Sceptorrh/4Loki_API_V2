'use client';

interface DogService {
  ServiceId: string;
  ServiceName: string;
  Price: number;
}

interface PreviousAppointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  CustomerId: number;
  StatusLabel: string;
  ActualDuration: number;
  dogServices: {
    DogId: number;
    DogName: string;
    services: DogService[];
  }[];
  interval?: number;
}

interface AppointmentHistoryProps {
  previousAppointments: PreviousAppointment[];
  appointmentDate: Date;
}

export default function AppointmentHistory({
  previousAppointments,
  appointmentDate
}: AppointmentHistoryProps) {
  if (!previousAppointments || previousAppointments.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">No previous appointments found</p>
      </div>
    );
  }

  // Sort appointments by date (newest first)
  const sortedAppointments = [...previousAppointments].sort((a, b) => {
    return new Date(b.Date).getTime() - new Date(a.Date).getTime();
  });

  // Calculate days between new appointment and most recent appointment
  let daysSinceLastAppointment = null;
  if (sortedAppointments.length > 0) {
    const lastAppointmentDate = new Date(sortedAppointments[0].Date);
    const newAppointmentDate = appointmentDate;
    const diffTime = Math.abs(newAppointmentDate.getTime() - lastAppointmentDate.getTime());
    daysSinceLastAppointment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate intervals between appointments
  const appointmentsWithIntervals = sortedAppointments.map((appointment, index, array) => {
    let interval = null;
    if (index < array.length - 1) {
      const currentDate = new Date(appointment.Date);
      const prevDate = new Date(array[index + 1].Date);
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      interval = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
    }
    return { ...appointment, interval };
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Past Appointments</h3>
        {daysSinceLastAppointment !== null && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{daysSinceLastAppointment} days</span> since last visit
          </div>
        )}
      </div>
      <div className="max-h-[600px] overflow-y-auto pr-2">
        {appointmentsWithIntervals.map((appointment, index) => {
          // Calculate total price for this appointment
          let totalPrice = 0;
          
          appointment.dogServices?.forEach(dogService => {
            dogService.services?.forEach(service => {
              totalPrice += Number(service.Price || 0);
            });
          });

          // Format date and time
          const appointmentDate = new Date(appointment.Date);
          const formattedDate = appointmentDate.toLocaleDateString();
          
          return (
            <div key={appointment.Id} className="bg-white shadow-sm border rounded-md p-3 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{formattedDate}</div>
                <div className="text-right">
                  <div className="font-medium text-primary-600">€{totalPrice.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    {appointment.ActualDuration ? (
                      <>
                        {Math.floor(appointment.ActualDuration / 60)}h {appointment.ActualDuration % 60}m
                      </>
                    ) : (
                      'Duration not available'
                    )}
                  </div>
                </div>
              </div>
              
              {appointment.dogServices && appointment.dogServices.length > 0 && (
                <div className="mb-3">
                  {appointment.dogServices.map(dogService => (
                    <div key={dogService.DogId} className="ml-2 mb-2">
                      <div className="font-medium text-sm">{dogService.DogName}</div>
                      {dogService.services && dogService.services.length > 0 ? (
                        <ul className="pl-4 text-xs space-y-1">
                          {dogService.services.map(service => (
                            <li key={service.ServiceId} className="flex justify-between">
                              <span>{service.ServiceName}</span>
                              <span>€{Number(service.Price).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500 ml-4">No services</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {appointment.interval && (
                <div className="text-xs text-gray-500 border-t pt-2">
                  <span className="font-medium">Interval to previous:</span> {appointment.interval} days
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 