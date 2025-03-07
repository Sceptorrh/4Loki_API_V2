import { Request, Response } from 'express';
import db from '../config/database';

interface AppointmentDog {
  Id: number;
  Name: string;
  DogSizeId: string;
  Note: string;
  services: Array<{
    Id: number;
    Name: string;
    Price: number;
  }>;
}

export const getDetailedAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.id);

    // Get appointment with status label
    const [appointments] = await db.execute(`
      SELECT 
        a.*,
        s.Label as Status
      FROM Appointment a
      LEFT JOIN Statics_AppointmentStatus s ON a.AppointmentStatusId = s.Id
      WHERE a.Id = ?
    `, [appointmentId]);

    const appointment = (appointments as any[])[0];
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Get customer details
    const [customers] = await db.execute(`
      SELECT 
        Id, 
        Naam, 
        Emailadres, 
        Telefoonnummer
      FROM Customer 
      WHERE Id = ?
    `, [appointment.CustomerId]);

    const customer = (customers as any[])[0];

    // Get all customer's dogs
    const [allCustomerDogs] = await db.execute(`
      SELECT 
        Id, 
        Name, 
        DogSizeId
      FROM Dog 
      WHERE CustomerId = ?
    `, [customer.Id]);

    // Get dogs in this appointment with their services
    const [appointmentDogs] = await db.execute(`
      SELECT 
        d.Id,
        d.Name,
        d.DogSizeId,
        ad.Note,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'Id', s.Id,
            'Name', s.Name,
            'Price', sad.Price
          )
        ) as services
      FROM AppointmentDog ad
      JOIN Dog d ON ad.DogId = d.Id
      LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
      LEFT JOIN Service s ON sad.ServiceId = s.Id
      WHERE ad.AppointmentId = ?
      GROUP BY d.Id, d.Name, d.DogSizeId, ad.Note
    `, [appointmentId]);

    // Parse the JSON string in services
    const processedAppointmentDogs = (appointmentDogs as any[]).map(dog => ({
      ...dog,
      services: JSON.parse(dog.services || '[]').filter((s: any) => s.Id !== null)
    }));

    // Format the response
    const detailedAppointment = {
      appointment: {
        Id: appointment.Id,
        Date: appointment.Date,
        TimeStart: appointment.TimeStart,
        TimeEnd: appointment.TimeEnd,
        DateEnd: appointment.DateEnd,
        ActualDuration: appointment.ActualDuration,
        Status: appointment.Status,
        TipAmount: appointment.TipAmount,
        Note: appointment.Note
      },
      customer,
      allCustomerDogs,
      appointmentDogs: processedAppointmentDogs
    };

    res.json(detailedAppointment);
  } catch (error) {
    console.error('Error fetching detailed appointment:', error);
    res.status(500).json({ message: 'Error fetching appointment details' });
  }
}; 