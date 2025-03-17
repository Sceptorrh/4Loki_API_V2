import { Request, Response } from 'express';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a new export log entry
 */
export const createExportLog = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      IssuedOn, 
      UpUntilDate, 
      IsSuccesfull, 
      IsDummy, 
      FileName,
      Notes,
      AppointmentIds 
    } = req.body;
    
    // Validate required fields
    if (!IssuedOn || !UpUntilDate) {
      throw new AppError('IssuedOn and UpUntilDate are required', 400);
    }
    
    // Ensure dates are in MySQL compatible format
    let formattedIssuedOn = IssuedOn;
    let formattedUpUntilDate = UpUntilDate;
    
    // If IssuedOn is in ISO format, convert it to MySQL datetime format
    if (IssuedOn.includes('T') && IssuedOn.includes('Z')) {
      try {
        const date = new Date(IssuedOn);
        formattedIssuedOn = date.toISOString().slice(0, 19).replace('T', ' ');
      } catch (err) {
        throw new AppError('Invalid IssuedOn date format', 400);
      }
    }
    
    // If UpUntilDate is in ISO format, convert it to MySQL date format
    if (UpUntilDate.includes('T')) {
      try {
        formattedUpUntilDate = UpUntilDate.split('T')[0];
      } catch (err) {
        throw new AppError('Invalid UpUntilDate format', 400);
      }
    }
    
    // Insert the export log
    const [result] = await connection.execute(`
      INSERT INTO ExportLog (
        IssuedOn, 
        UpUntilDate, 
        IsSuccesfull, 
        IsDummy,
        FileName,
        Notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      formattedIssuedOn, 
      formattedUpUntilDate, 
      IsSuccesfull || true, 
      IsDummy || false,
      FileName || null,
      Notes || null
    ]);
    
    const exportLogId = (result as any).insertId;
    
    // If appointment IDs are provided, create relationships
    if (AppointmentIds && Array.isArray(AppointmentIds) && AppointmentIds.length > 0) {
      for (const appointmentId of AppointmentIds) {
        // Get the current status of the appointment
        const [statusResult] = await connection.execute(`
          SELECT AppointmentStatusId FROM Appointment WHERE Id = ?
        `, [appointmentId]);
        
        const currentStatus = (statusResult as any[])[0]?.AppointmentStatusId || null;
        
        // Create the export log appointment relationship with the current status
        await connection.execute(`
          INSERT INTO ExportLogAppointment (
            ExportLogId, 
            AppointmentId, 
            PreviousStatusId
          )
          VALUES (?, ?, ?)
        `, [exportLogId, appointmentId, currentStatus]);
      }
    }
    
    await connection.commit();
    
    // Get the created export log
    const [exportLogs] = await connection.execute(`
      SELECT * FROM ExportLog WHERE Id = ?
    `, [exportLogId]);
    
    return res.status(201).json((exportLogs as any[])[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating export log:', error);
    throw new AppError('Failed to create export log', 500);
  } finally {
    connection.release();
  }
};

/**
 * Get all export logs
 */
export const getAllExportLogs = async (req: Request, res: Response) => {
  try {
    // Get all export logs with appointment counts
    const [exportLogs] = await db.execute(`
      SELECT 
        el.*,
        COUNT(ela.AppointmentId) as AppointmentCount
      FROM ExportLog el
      LEFT JOIN ExportLogAppointment ela ON el.Id = ela.ExportLogId
      GROUP BY el.Id
      ORDER BY el.IssuedOn DESC
    `);
    
    return res.status(200).json(exportLogs);
  } catch (error) {
    console.error('Error getting export logs:', error);
    throw new AppError('Failed to retrieve export logs', 500);
  }
};

/**
 * Get export log by ID with related appointments
 */
export const getExportLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the export log
    const [exportLogs] = await db.execute(`
      SELECT * FROM ExportLog WHERE Id = ?
    `, [id]);
    
    if ((exportLogs as any[]).length === 0) {
      throw new AppError('Export log not found', 404);
    }
    
    const exportLog = (exportLogs as any[])[0];
    
    // Get related appointments
    const [appointments] = await db.execute(`
      SELECT 
        a.*,
        c.Naam as CustomerName,
        c.Contactpersoon as CustomerContactperson,
        ela.PreviousStatusId,
        ela.IsReverted,
        ela.RevertedOn
      FROM Appointment a
      JOIN ExportLogAppointment ela ON a.Id = ela.AppointmentId
      JOIN Customer c ON a.CustomerId = c.Id
      WHERE ela.ExportLogId = ?
    `, [id]);
    
    return res.status(200).json({
      ...exportLog,
      Appointments: appointments
    });
  } catch (error) {
    console.error('Error getting export log:', error);
    throw new AppError('Failed to retrieve export log', 500);
  }
};

/**
 * Revert an entire export
 */
export const revertExport = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { RevertedBy, RevertReason } = req.body;
    
    // Check if export log exists
    const [exportLogs] = await connection.execute(`
      SELECT * FROM ExportLog WHERE Id = ?
    `, [id]);
    
    if ((exportLogs as any[]).length === 0) {
      throw new AppError('Export log not found', 404);
    }
    
    const exportLog = (exportLogs as any[])[0];
    
    // Check if already reverted
    if (exportLog.IsReverted) {
      throw new AppError('Export has already been reverted', 400);
    }
    
    // Check if this is the latest non-reverted export
    const [latestExports] = await connection.execute(`
      SELECT * FROM ExportLog 
      WHERE IsReverted = 0
      ORDER BY IssuedOn DESC
      LIMIT 1
    `);
    
    if ((latestExports as any[]).length === 0 || (latestExports as any[])[0].Id !== parseInt(id)) {
      throw new AppError('Only the latest export can be reverted', 400);
    }
    
    // Get all appointments in this export
    const [exportAppointments] = await connection.execute(`
      SELECT * FROM ExportLogAppointment WHERE ExportLogId = ? AND IsReverted = 0
    `, [id]);
    
    // Revert each appointment to its previous status
    for (const exportAppointment of (exportAppointments as any[])) {
      // Always revert to 'Inv' status regardless of previous status
      
      // Update appointment status to 'Inv'
      await connection.execute(`
        UPDATE Appointment SET AppointmentStatusId = 'Inv' WHERE Id = ?
      `, [exportAppointment.AppointmentId]);
      
      // Mark the export-appointment relationship as reverted
      await connection.execute(`
        UPDATE ExportLogAppointment 
        SET IsReverted = 1, RevertedOn = NOW() 
        WHERE Id = ?
      `, [exportAppointment.Id]);
    }
    
    // Mark the export log as reverted
    await connection.execute(`
      UPDATE ExportLog 
      SET IsReverted = 1, RevertedOn = NOW(), RevertedBy = ?, RevertReason = ? 
      WHERE Id = ?
    `, [RevertedBy || null, RevertReason || null, id]);
    
    await connection.commit();
    
    // Get the updated export log
    const [updatedExportLogs] = await connection.execute(`
      SELECT * FROM ExportLog WHERE Id = ?
    `, [id]);
    
    return res.status(200).json({
      message: 'Export successfully reverted. All appointments have been set to "Invoiced" status.',
      exportLog: (updatedExportLogs as any[])[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error reverting export:', error);
    throw new AppError('Failed to revert export', 500);
  } finally {
    connection.release();
  }
};

/**
 * Revert a single appointment from an export
 */
export const revertAppointmentFromExport = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { exportId, appointmentId } = req.params;
    
    // Check if the export-appointment relationship exists
    const [exportAppointments] = await connection.execute(`
      SELECT * FROM ExportLogAppointment 
      WHERE ExportLogId = ? AND AppointmentId = ? AND IsReverted = 0
    `, [exportId, appointmentId]);
    
    if ((exportAppointments as any[]).length === 0) {
      throw new AppError('Appointment not found in this export or already reverted', 404);
    }
    
    const exportAppointment = (exportAppointments as any[])[0];
    
    // Always revert to 'Inv' status regardless of previous status
    
    // Update appointment status to 'Inv'
    await connection.execute(`
      UPDATE Appointment SET AppointmentStatusId = 'Inv' WHERE Id = ?
    `, [appointmentId]);
    
    // Mark the export-appointment relationship as reverted
    await connection.execute(`
      UPDATE ExportLogAppointment 
      SET IsReverted = 1, RevertedOn = NOW() 
      WHERE Id = ?
    `, [exportAppointment.Id]);
    
    await connection.commit();
    
    return res.status(200).json({
      message: 'Appointment successfully reverted from export and set to "Invoiced" status.',
      appointmentId,
      exportId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error reverting appointment from export:', error);
    throw new AppError('Failed to revert appointment from export', 500);
  } finally {
    connection.release();
  }
}; 