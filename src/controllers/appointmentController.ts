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
    
    // Get the complete status object with hex color
    const [statusRows] = await connection.execute(
      `SELECT 
        s.Id, 
        s.Label, 
        s.Color,
        c.Hex as HexColor
      FROM Statics_AppointmentStatus s
      JOIN Statics_CustomColor c ON s.Color = c.Color
      WHERE s.Id = ?`,
      [appointment.AppointmentStatusId]
    );
    
    const status = (statusRows as any[])[0] || null;
    
    // Get complete customer information
    const [customerRows] = await connection.execute(
      `SELECT * FROM Customer WHERE Id = ?`,
      [appointment.CustomerId]
    );
    
    const customer = (customerRows as any[])[0] || null;
    
    // Get appointment dogs with their services and breeds
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
    
    // For each appointment dog, get its services and breeds
    const processedAppointmentDogs = [];
    for (const dog of (appointmentDogs as any[])) {
      // Get services for this dog
      const [services] = await connection.execute(`
        SELECT 
          sad.ServiceId,
          sad.Price,
          s.Name as ServiceName
        FROM ServiceAppointmentDog sad
        JOIN Statics_Service s ON sad.ServiceId = s.Id
        WHERE sad.AppointmentDogId = ?
      `, [dog.AppointmentDogId]);
      
      // Get breeds for this dog
      const [breeds] = await connection.execute(`
        SELECT 
          db.Id as BreedId,
          db.Name as BreedName
        FROM DogDogbreed ddb
        JOIN Statics_Dogbreed db ON ddb.DogBreedId = db.Id
        WHERE ddb.DogId = ?
      `, [dog.DogId]);
      
      processedAppointmentDogs.push({
        DogId: dog.DogId,
        Note: dog.Note,
        DogName: dog.DogName,
        DogSizeId: dog.DogSizeId,
        services: services,
        breeds: breeds
      });
    }
    
    // Format the response
    const completeAppointment = {
      appointment,
      appointmentDogs: processedAppointmentDogs,
      customer,
      status
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
        CustomerId, AppointmentStatusId, Note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment.Date,
        appointment.TimeStart,
        appointment.TimeEnd,
        appointment.DateEnd,
        appointment.ActualDuration,
        appointment.CustomerId,
        appointment.AppointmentStatusId,
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
        Note = ?
      WHERE Id = ?`,
      [
        appointment.Date,
        appointment.TimeStart,
        appointment.TimeEnd,
        appointment.DateEnd,
        appointment.ActualDuration,
        appointment.CustomerId,
        appointment.AppointmentStatusId,
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

export const getAppointmentsByYearMonth = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    const { year, month } = req.params;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid year or month format' });
    }
    
    // Get all appointments for the specified month with customer contact person and status details
    // Join with Statics_CustomColor to get the hex color
    const [appointments] = await connection.execute(`
      SELECT 
        a.Id as AppointmentId,
        a.Date,
        a.TimeStart,
        a.TimeEnd,
        c.Contactpersoon as ContactPerson,
        s.Label as StatusLabel,
        s.Color as StatusColor,
        s.Id as StatusId,
        cc.Hex as StatusHexColor
      FROM Appointment a
      JOIN Customer c ON a.CustomerId = c.Id
      JOIN Statics_AppointmentStatus s ON a.AppointmentStatusId = s.Id
      LEFT JOIN Statics_CustomColor cc ON s.Color = cc.Color
      WHERE YEAR(a.Date) = ? AND MONTH(a.Date) = ?
      ORDER BY a.Date, a.TimeStart
    `, [yearNum, monthNum]);
    
    // For each appointment, get the dogs with services
    const result = [];
    for (const appointment of (appointments as any[])) {
      // Get dogs for this appointment
      const [dogs] = await connection.execute(`
        SELECT 
          d.Id as DogId,
          d.Name as DogName,
          COUNT(sad.Id) as ServiceCount
        FROM AppointmentDog ad
        JOIN Dog d ON ad.DogId = d.Id
        LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
        WHERE ad.AppointmentId = ?
        GROUP BY d.Id, d.Name
      `, [appointment.AppointmentId]);
      
      // Use the hex color from the database if available, otherwise fall back to default colors
      let statusColor = appointment.StatusHexColor;
      if (!statusColor || !statusColor.startsWith('#')) {
        // Map status names to default hex colors if the database doesn't have proper hex codes
        const colorMap: Record<string, string> = {
          'Pln': '#3498db', // Blue for Planned
          'Planned': '#3498db',
          'Gepland': '#3498db',
          'Cnf': '#2ecc71', // Green for Confirmed
          'Confirmed': '#2ecc71',
          'Bevestigd': '#2ecc71',
          'Cmp': '#95a5a6', // Gray for Completed
          'Completed': '#95a5a6',
          'Voltooid': '#95a5a6',
          'Cnc': '#e74c3c', // Red for Cancelled
          'Cancelled': '#e74c3c',
          'Geannuleerd': '#e74c3c',
          'default': '#7f8c8d' // Default gray
        };
        
        // Try to find a matching color based on status ID or label
        statusColor = colorMap[appointment.StatusId] || 
                      colorMap[appointment.StatusLabel] || 
                      colorMap['default'];
      }
      
      result.push({
        AppointmentId: appointment.AppointmentId,
        Date: appointment.Date,
        TimeStart: appointment.TimeStart,
        TimeEnd: appointment.TimeEnd,
        ContactPerson: appointment.ContactPerson,
        Status: {
          Id: appointment.StatusId,
          Label: appointment.StatusLabel,
          Color: appointment.StatusColor,
          HexColor: statusColor
        },
        Dogs: dogs
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching appointments by year/month:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  } finally {
    connection.release();
  }
};

/**
 * Get all past appointments with status 'Pln' that are ready to be invoiced
 */
export const getInvoiceReadyAppointments = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    // Query to get all past appointments with status 'Pln' and calculate total price
    const [appointments] = await db.execute(`
      SELECT 
        a.*,
        c.Naam as CustomerName,
        s.Label as StatusLabel,
        COALESCE(SUM(sad.Price), 0) as TotalPrice
      FROM Appointment a
      JOIN Customer c ON a.CustomerId = c.Id
      JOIN Statics_AppointmentStatus s ON a.AppointmentStatusId = s.Id
      LEFT JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
      LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
      WHERE a.AppointmentStatusId = 'Pln'
      AND a.Date < ?
      GROUP BY a.Id
      ORDER BY a.Date DESC
    `, [currentDate]);
    
    // For each appointment, get the associated dogs
    const appointmentsWithDogs = [];
    for (const appointment of (appointments as any[])) {
      // Get dogs for this appointment
      const [dogs] = await db.execute(`
        SELECT 
          d.Id as DogId,
          d.Name as DogName,
          COUNT(sad.Id) as ServiceCount
        FROM AppointmentDog ad
        JOIN Dog d ON ad.DogId = d.Id
        LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
        WHERE ad.AppointmentId = ?
        GROUP BY d.Id, d.Name
      `, [appointment.Id]);
      
      appointmentsWithDogs.push({
        ...appointment,
        Dogs: dogs
      });
    }
    
    return res.status(200).json(appointmentsWithDogs);
  } catch (error) {
    console.error('Error getting invoice-ready appointments:', error);
    throw new AppError('Failed to retrieve invoice-ready appointments', 500);
  }
};

/**
 * Get all appointments with status 'Inv' that need to be exported
 */
export const getExportReadyAppointments = async (req: Request, res: Response) => {
  try {
    // Query to get all appointments with status 'Inv' and calculate total price
    const [appointments] = await db.execute(`
      SELECT 
        a.*,
        c.Naam as CustomerName,
        c.Contactpersoon as CustomerContactperson,
        s.Label as StatusLabel,
        COALESCE(SUM(sad.Price), 0) as TotalPrice
      FROM Appointment a
      JOIN Customer c ON a.CustomerId = c.Id
      JOIN Statics_AppointmentStatus s ON a.AppointmentStatusId = s.Id
      LEFT JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
      LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
      WHERE a.AppointmentStatusId = 'Inv'
      GROUP BY a.Id
      ORDER BY a.Date ASC
    `);
    
    // For each appointment, get the associated dogs and services
    const appointmentsWithDetails = [];
    for (const appointment of (appointments as any[])) {
      // Get dogs and services for this appointment
      const [dogsWithServices] = await db.execute(`
        SELECT 
          d.Id as DogId,
          d.Name as DogName,
          sad.Id as ServiceId,
          s.Name as ServiceLabel,
          sad.Price as ServicePrice
        FROM AppointmentDog ad
        JOIN Dog d ON ad.DogId = d.Id
        LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
        LEFT JOIN Statics_Service s ON sad.ServiceId = s.Id
        WHERE ad.AppointmentId = ?
        ORDER BY d.Name, s.Name
      `, [appointment.Id]);
      
      // Group services by dog
      const dogs = [];
      const dogMap = new Map();
      
      for (const item of (dogsWithServices as any[])) {
        if (!dogMap.has(item.DogId)) {
          const dog = {
            DogId: item.DogId,
            DogName: item.DogName,
            Services: []
          };
          dogs.push(dog);
          dogMap.set(item.DogId, dog);
        }
        
        // Only add service if it exists
        if (item.ServiceId) {
          // Calculate BTW at 21%
          const servicePriceExclBtw = parseFloat((item.ServicePrice / 1.21).toFixed(2));
          const serviceBtw = parseFloat((item.ServicePrice - servicePriceExclBtw).toFixed(2));
          
          dogMap.get(item.DogId).Services.push({
            ServiceId: item.ServiceId,
            ServiceLabel: item.ServiceLabel,
            ServicePrice: item.ServicePrice,
            BtwPercentage: 21,
            ServiceQuantity: 1,
            ServicePriceExclBtw: servicePriceExclBtw
          });
        }
      }
      
      appointmentsWithDetails.push({
        ...appointment,
        Dogs: dogs
      });
    }
    
    return res.status(200).json(appointmentsWithDetails);
  } catch (error) {
    console.error('Error getting export-ready appointments:', error);
    throw new AppError('Failed to retrieve export-ready appointments', 500);
  }
};

/**
 * Update appointment status to 'Exp' when exported and assign serial numbers
 */
export const markAppointmentsAsExported = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    // Test the database connection
    try {
      const [testResult] = await connection.execute('SELECT 1 as test');
      console.log('Database connection test:', testResult);
    } catch (testErr) {
      console.error('Database connection test failed:', testErr);
      throw new Error('Database connection test failed');
    }
    
    await connection.beginTransaction();
    
    const { appointmentIds } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      throw new AppError('Invalid or missing appointmentIds', 400);
    }
    
    console.log(`Processing ${appointmentIds.length} appointments for export`);
    
    // Get the appointments to be exported with their payment method and dates
    const placeholders = appointmentIds.map(() => '?').join(',');
    const [appointmentsToExport] = await connection.execute(`
      SELECT Id, Date, IsPaidInCash
      FROM Appointment
      WHERE Id IN (${placeholders})
      ORDER BY Date ASC
    `, [...appointmentIds]);
    
    console.log(`Found ${(appointmentsToExport as any[]).length} appointments to export`);
    
    // Get the earliest date among the appointments to be exported
    const earliestDate = (appointmentsToExport as any[])[0]?.Date;
    
    // Check if there are any unexported appointments before the earliest date
    const [unexportedAppointments] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM Appointment
      WHERE Date < ?
      AND AppointmentStatusId = 'Inv'
      AND Id NOT IN (${placeholders})
    `, [earliestDate, ...appointmentIds]);
    
    if ((unexportedAppointments as any[])[0].count > 0) {
      throw new AppError('Cannot export appointments: there are unexported appointments before the selected date range', 400);
    }
    
    // Group appointments by year and payment type
    const groupedAppointments = new Map();
    
    for (const appointment of (appointmentsToExport as any[])) {
      const appointmentYear = new Date(appointment.Date).getFullYear();
      const isCashPayment = appointment.IsPaidInCash === 1;
      const key = `${appointmentYear}-${isCashPayment ? 'cash' : 'bank'}`;
      
      if (!groupedAppointments.has(key)) {
        groupedAppointments.set(key, []);
      }
      groupedAppointments.get(key).push(appointment);
    }
    
    console.log(`Grouped appointments into ${groupedAppointments.size} categories`);
    
    // Process each group to assign sequential serial numbers
    const updatedAppointments = [];
    
    for (const [key, appointments] of groupedAppointments.entries()) {
      const [year, paymentType] = key.split('-');
      const isCashPayment = paymentType === 'cash';
      
      console.log(`Processing group: ${key} with ${appointments.length} appointments`);
      
      // Get the highest serial number for this year and payment type
      const [highestSerialResult] = await connection.execute(`
        SELECT MAX(SerialNumber) as MaxSerialNumber
        FROM Appointment
        WHERE YEAR(Date) = ? AND IsPaidInCash = ? AND SerialNumber IS NOT NULL
      `, [year, isCashPayment ? 1 : 0]);
      
      // Calculate the new serial number (highest + 1)
      let nextSerialNumber = 1; // Default to 1 if no previous serial numbers
      if ((highestSerialResult as any[])[0].MaxSerialNumber) {
        nextSerialNumber = (highestSerialResult as any[])[0].MaxSerialNumber + 1;
      }
      
      console.log(`Starting serial number for ${key}: ${nextSerialNumber}`);
      
      // Assign sequential serial numbers to all appointments in this group
      for (const appointment of appointments) {
        const serialNumber = nextSerialNumber++;
        console.log(`Assigning serial number ${serialNumber} to appointment ${appointment.Id}`);
        
        // Update the appointment with the new serial number and status
        const updateResult = await connection.execute(`
          UPDATE Appointment
          SET AppointmentStatusId = 'Exp', SerialNumber = ?
          WHERE Id = ?
        `, [serialNumber, appointment.Id]);
        
        console.log(`Update result for appointment ${appointment.Id}:`, updateResult);
        
        // Verify the update was successful with a direct query
        const [verifyUpdate] = await connection.execute(`
          SELECT Id, SerialNumber, AppointmentStatusId 
          FROM Appointment 
          WHERE Id = ?
        `, [appointment.Id]);
        
        console.log(`Verification for appointment ${appointment.Id}:`, verifyUpdate);
        
        // Add to updated appointments list
        updatedAppointments.push({
          Id: appointment.Id,
          SerialNumber: serialNumber,
          IsPaidInCash: appointment.IsPaidInCash,
          Date: appointment.Date
        });
      }
    }
    
    // Verify that all appointments were updated correctly
    const [verificationResult] = await connection.execute(`
      SELECT Id, SerialNumber, IsPaidInCash, Date, AppointmentStatusId
      FROM Appointment
      WHERE Id IN (${placeholders})
    `, [...appointmentIds]);
    
    console.log(`Verification result:`, verificationResult);
    
    // Check if any appointments weren't updated properly
    const notUpdated = (verificationResult as any[]).filter(app => 
      app.AppointmentStatusId !== 'Exp' || app.SerialNumber === null
    );
    
    if (notUpdated.length > 0) {
      console.error(`${notUpdated.length} appointments were not updated properly:`, notUpdated);
      throw new Error(`Failed to update ${notUpdated.length} appointments`);
    }
    
    await connection.commit();
    console.log(`Successfully committed transaction for ${appointmentIds.length} appointments`);
    
    // Final verification after commit
    try {
      const [finalVerification] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM Appointment
        WHERE Id IN (${placeholders}) AND AppointmentStatusId = 'Exp' AND SerialNumber IS NOT NULL
      `, [...appointmentIds]);
      
      console.log('Final verification after commit:', finalVerification);
      
      if ((finalVerification as any[])[0].count !== appointmentIds.length) {
        console.error('Final verification failed: not all appointments were updated');
      }
    } catch (verifyErr) {
      console.error('Error in final verification:', verifyErr);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `${appointmentIds.length} appointments marked as exported with serial numbers assigned`,
      appointmentIds,
      updatedAppointments
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error marking appointments as exported:', error);
    throw new AppError('Failed to mark appointments as exported', 500);
  } finally {
    connection.release();
  }
};

/**
 * Revert appointments back to 'Inv' status when an export fails
 */
export const revertAppointmentsToInvoiced = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { appointmentIds } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      throw new AppError('Valid appointment IDs are required', 400);
    }
    
    // Update all appointments back to 'Inv' status
    for (const appointmentId of appointmentIds) {
      await connection.execute(`
        UPDATE Appointment SET AppointmentStatusId = 'Inv' WHERE Id = ?
      `, [appointmentId]);
    }
    
    await connection.commit();
    
    return res.status(200).json({
      message: 'Appointments successfully reverted to invoiced status',
      appointmentIds
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error reverting appointments to invoiced status:', error);
    throw new AppError('Failed to revert appointments to invoiced status', 500);
  } finally {
    connection.release();
  }
};

/**
 * Get all appointments for a specific customer with dog services
 */
export const getAppointmentsByCustomerId = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    
    // First check if the customer exists
    const [customer] = await db.execute(
      'SELECT Id FROM Customer WHERE Id = ?',
      [customerId]
    );

    if (!Array.isArray(customer) || customer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get all appointments for this customer
    const [appointments] = await db.execute(`
      SELECT 
        a.*,
        s.Label as StatusLabel
      FROM Appointment a
      JOIN Statics_AppointmentStatus s ON a.AppointmentStatusId = s.Id
      WHERE a.CustomerId = ?
      ORDER BY a.Date DESC
    `, [customerId]);
    
    // For each appointment, get the dogs and their services
    const appointmentsWithDogServices = [];
    
    for (const appointment of (appointments as any[])) {
      // Get dogs and services for this appointment
      const [appointmentDogs] = await db.execute(`
        SELECT 
          ad.Id as AppointmentDogId,
          ad.DogId,
          d.Name as DogName
        FROM AppointmentDog ad
        JOIN Dog d ON ad.DogId = d.Id
        WHERE ad.AppointmentId = ?
      `, [appointment.Id]);
      
      // For each dog, get its services with prices
      const dogsWithServices = [];
      
      for (const dog of (appointmentDogs as any[])) {
        const [services] = await db.execute(`
          SELECT 
            sad.ServiceId,
            sad.Price,
            s.Name as ServiceName
          FROM ServiceAppointmentDog sad
          JOIN Statics_Service s ON sad.ServiceId = s.Id
          WHERE sad.AppointmentDogId = ?
        `, [dog.AppointmentDogId]);
        
        dogsWithServices.push({
          DogId: dog.DogId,
          DogName: dog.DogName,
          services: services
        });
      }
      
      appointmentsWithDogServices.push({
        ...appointment,
        dogServices: dogsWithServices
      });
    }
    
    return res.status(200).json(appointmentsWithDogServices);
  } catch (error) {
    console.error('Error getting appointments by customer ID:', error);
    return res.status(500).json({ message: 'Failed to retrieve customer appointments' });
  }
};

// Get appointments for a specific date
export const getAppointmentsByDate = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    const date = req.params.date;
    
    // Validate date format (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Query to get all appointments for the date with customer and dog information
    const [appointments] = await connection.execute(`
      SELECT 
        a.Id,
        a.Date,
        a.TimeStart,
        a.TimeEnd,
        a.ActualDuration,
        a.CustomerId,
        a.AppointmentStatusId as StatusId,
        s.Label as StatusLabel,
        c.Contactpersoon as CustomerName,
        c.Emailadres as CustomerEmail,
        c.Telefoonnummer as CustomerPhone
      FROM Appointment a
      JOIN Customer c ON a.CustomerId = c.Id
      JOIN Statics_AppointmentStatus s ON a.AppointmentStatusId = s.Id
      WHERE a.Date = ?
      ORDER BY a.TimeStart ASC
    `, [date]);
    
    // Enhanced appointments with dog information
    const enhancedAppointments = [];
    
    for (const appointment of (appointments as any[])) {
      // Get dogs for this appointment
      const [dogServices] = await connection.execute(`
        SELECT 
          ad.DogId,
          d.Name as DogName,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'ServiceId', s.Id,
              'ServiceName', s.Name,
              'Price', sad.Price
            )
          ) as services
        FROM AppointmentDog ad
        JOIN Dog d ON ad.DogId = d.Id
        LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
        LEFT JOIN Statics_Service s ON sad.ServiceId = s.Id
        WHERE ad.AppointmentId = ?
        GROUP BY ad.DogId, d.Name
      `, [appointment.Id]);
      
      // Parse the JSON services for each dog
      const processedDogServices = (dogServices as any[]).map(dog => ({
        DogId: dog.DogId,
        DogName: dog.DogName,
        services: JSON.parse(dog.services || '[]').filter((s: any) => s.ServiceId !== null)
      }));
      
      // Calculate estimated duration based on services and past appointments
      let estimatedDuration = 0;
      
      // Get all services for this appointment
      const allServices = processedDogServices.flatMap(dog => dog.services);
      
      // If we have services, calculate estimated duration based on them
      if (allServices.length > 0) {
        // For simplicity, for each service add a standard time
        // In a real application, you would calculate this based on historical data
        const [standardDurations] = await connection.execute(`
          SELECT Id, StandardDuration FROM Statics_Service
          WHERE Id IN (${allServices.map(s => `'${s.ServiceId}'`).join(',')})
        `);
        
        const durationMap = new Map();
        (standardDurations as any[]).forEach(sd => {
          durationMap.set(sd.Id, sd.StandardDuration || 30); // Default 30 minutes if not specified
        });
        
        // Sum up standard durations for the estimate
        allServices.forEach(service => {
          estimatedDuration += durationMap.get(service.ServiceId) || 30;
        });
        
        // Get past appointments for the dogs in this appointment to refine the estimate
        const dogIds = processedDogServices.map(dog => dog.DogId);
        if (dogIds.length > 0) {
          const [pastAppointments] = await connection.execute(`
            SELECT a.Id, a.ActualDuration, ad.DogId, s.Id as ServiceId
            FROM Appointment a
            JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
            JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
            JOIN Statics_Service s ON sad.ServiceId = s.Id
            WHERE ad.DogId IN (${dogIds.join(',')})
            AND a.Date < ?
            ORDER BY a.Date DESC
            LIMIT 10 
          `, [date]);
          
          // If we have past appointment data, refine our estimate
          if ((pastAppointments as any[]).length > 0) {
            // Here we would typically do a more sophisticated analysis
            // For simplicity, we'll just adjust based on the average of past actual durations
            const totalActualDuration = (pastAppointments as any[]).reduce((sum, pa) => 
              sum + (pa.ActualDuration || 0), 0);
            
            const avgActualDuration = totalActualDuration / (pastAppointments as any[]).length;
            
            // Adjust our estimate if we have a significant sample
            if ((pastAppointments as any[]).length >= 2) {
              // Blend the standard estimate with the historical average
              estimatedDuration = Math.round((estimatedDuration + avgActualDuration) / 2);
            }
          }
        }
      } else {
        // If no services, use the actual duration or a default
        estimatedDuration = appointment.ActualDuration || 60;
      }
      
      // Ensure minimum duration
      estimatedDuration = Math.max(estimatedDuration, 60);
      
      enhancedAppointments.push({
        ...appointment,
        EstimatedDuration: estimatedDuration,
        dogServices: processedDogServices
      });
    }
    
    res.json(enhancedAppointments);
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    res.status(500).json({ message: 'Error fetching appointments by date' });
  } finally {
    connection.release();
  }
}; 