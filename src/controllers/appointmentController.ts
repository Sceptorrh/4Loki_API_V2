import { Request, Response } from 'express';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';

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
      LEFT JOIN Statics_Service s ON sad.ServiceId = s.Id
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

export const getCompleteAppointment = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    const appointmentId = parseInt(req.params.id);
    
    // Get the appointment
    const [appointments] = await connection.execute(
      `SELECT * FROM Appointment WHERE Id = ?`,
      [appointmentId]
    );
    
    const appointment = (appointments as any[])[0];
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Get appointment dogs with their services
    const [appointmentDogs] = await connection.execute(`
      SELECT 
        ad.Id as AppointmentDogId,
        ad.DogId,
        ad.Note,
        d.Name as DogName,
        d.DogSizeId
      FROM AppointmentDog ad
      JOIN Dog d ON ad.DogId = d.Id
      WHERE ad.AppointmentId = ?
    `, [appointmentId]);
    
    // For each appointment dog, get its services
    const processedAppointmentDogs = [];
    for (const dog of (appointmentDogs as any[])) {
      const [services] = await connection.execute(`
        SELECT 
          sad.ServiceId,
          sad.Price,
          s.Name as ServiceName
        FROM ServiceAppointmentDog sad
        JOIN Statics_Service s ON sad.ServiceId = s.Id
        WHERE sad.AppointmentDogId = ?
      `, [dog.AppointmentDogId]);
      
      processedAppointmentDogs.push({
        DogId: dog.DogId,
        Note: dog.Note,
        DogName: dog.DogName,
        DogSizeId: dog.DogSizeId,
        services: services
      });
    }
    
    // Format the response
    const completeAppointment = {
      appointment,
      appointmentDogs: processedAppointmentDogs
    };
    
    res.json(completeAppointment);
  } catch (error) {
    console.error('Error fetching complete appointment:', error);
    res.status(500).json({ message: 'Error fetching appointment details' });
  } finally {
    connection.release();
  }
};

export const createCompleteAppointment = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { appointment, appointmentDogs } = req.body;
    
    // Insert the appointment
    const [appointmentResult] = await connection.execute(
      `INSERT INTO Appointment (
        Date, TimeStart, TimeEnd, DateEnd, ActualDuration, 
        CustomerId, AppointmentStatusId, AppointmentTypeId, Note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment.Date,
        appointment.TimeStart,
        appointment.TimeEnd,
        appointment.DateEnd,
        appointment.ActualDuration,
        appointment.CustomerId,
        appointment.AppointmentStatusId,
        appointment.AppointmentTypeId,
        appointment.Note || null
      ]
    );
    
    const appointmentId = (appointmentResult as any).insertId;
    
    // Insert appointment dogs and their services
    for (const appointmentDog of appointmentDogs) {
      const [appointmentDogResult] = await connection.execute(
        `INSERT INTO AppointmentDog (AppointmentId, DogId, Note) VALUES (?, ?, ?)`,
        [appointmentId, appointmentDog.DogId, appointmentDog.Note || null]
      );
      
      const appointmentDogId = (appointmentDogResult as any).insertId;
      
      // Insert services for this appointment dog
      for (const service of appointmentDog.services) {
        await connection.execute(
          `INSERT INTO ServiceAppointmentDog (AppointmentDogId, ServiceId, Price) VALUES (?, ?, ?)`,
          [appointmentDogId, service.ServiceId, service.Price]
        );
      }
    }
    
    await connection.commit();
    
    // Return the created appointment with all details
    const [createdAppointment] = await connection.execute(
      `SELECT * FROM Appointment WHERE Id = ?`,
      [appointmentId]
    );
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointmentId,
      appointment: (createdAppointment as any[])[0]
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating complete appointment:', error);
    res.status(500).json({ message: 'Error creating appointment' });
  } finally {
    connection.release();
  }
};

export const updateCompleteAppointment = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const appointmentId = parseInt(req.params.id);
    const { appointment, appointmentDogs } = req.body;
    
    // Check if appointment exists
    const [existingAppointment] = await connection.execute(
      `SELECT Id FROM Appointment WHERE Id = ?`,
      [appointmentId]
    );
    
    if (!(existingAppointment as any[]).length) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Update the appointment
    await connection.execute(
      `UPDATE Appointment SET 
        Date = ?, TimeStart = ?, TimeEnd = ?, DateEnd = ?, 
        ActualDuration = ?, CustomerId = ?, AppointmentStatusId = ?, 
        AppointmentTypeId = ?, Note = ?
      WHERE Id = ?`,
      [
        appointment.Date,
        appointment.TimeStart,
        appointment.TimeEnd,
        appointment.DateEnd,
        appointment.ActualDuration,
        appointment.CustomerId,
        appointment.AppointmentStatusId,
        appointment.AppointmentTypeId,
        appointment.Note || null,
        appointmentId
      ]
    );
    
    // Delete existing appointment dogs and their services
    const [existingAppointmentDogs] = await connection.execute(
      `SELECT Id FROM AppointmentDog WHERE AppointmentId = ?`,
      [appointmentId]
    );
    
    for (const dog of (existingAppointmentDogs as any[])) {
      // Delete services for this appointment dog
      await connection.execute(
        `DELETE FROM ServiceAppointmentDog WHERE AppointmentDogId = ?`,
        [dog.Id]
      );
    }
    
    // Delete all appointment dogs for this appointment
    await connection.execute(
      `DELETE FROM AppointmentDog WHERE AppointmentId = ?`,
      [appointmentId]
    );
    
    // Insert new appointment dogs and their services
    for (const appointmentDog of appointmentDogs) {
      const [appointmentDogResult] = await connection.execute(
        `INSERT INTO AppointmentDog (AppointmentId, DogId, Note) VALUES (?, ?, ?)`,
        [appointmentId, appointmentDog.DogId, appointmentDog.Note || null]
      );
      
      const appointmentDogId = (appointmentDogResult as any).insertId;
      
      // Insert services for this appointment dog
      for (const service of appointmentDog.services) {
        await connection.execute(
          `INSERT INTO ServiceAppointmentDog (AppointmentDogId, ServiceId, Price) VALUES (?, ?, ?)`,
          [appointmentDogId, service.ServiceId, service.Price]
        );
      }
    }
    
    await connection.commit();
    
    res.json({
      message: 'Appointment updated successfully',
      appointmentId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating complete appointment:', error);
    res.status(500).json({ message: 'Error updating appointment' });
  } finally {
    connection.release();
  }
};

export const deleteCompleteAppointment = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const appointmentId = parseInt(req.params.id);
    
    // Check if appointment exists
    const [existingAppointment] = await connection.execute(
      `SELECT Id FROM Appointment WHERE Id = ?`,
      [appointmentId]
    );
    
    if (!(existingAppointment as any[]).length) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Get all appointment dogs for this appointment
    const [appointmentDogs] = await connection.execute(
      `SELECT Id FROM AppointmentDog WHERE AppointmentId = ?`,
      [appointmentId]
    );
    
    // Delete services for each appointment dog
    for (const dog of (appointmentDogs as any[])) {
      await connection.execute(
        `DELETE FROM ServiceAppointmentDog WHERE AppointmentDogId = ?`,
        [dog.Id]
      );
    }
    
    // Delete all appointment dogs
    await connection.execute(
      `DELETE FROM AppointmentDog WHERE AppointmentId = ?`,
      [appointmentId]
    );
    
    // Delete the appointment
    await connection.execute(
      `DELETE FROM Appointment WHERE Id = ?`,
      [appointmentId]
    );
    
    await connection.commit();
    
    res.json({
      message: 'Appointment deleted successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting complete appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment' });
  } finally {
    connection.release();
  }
}; 