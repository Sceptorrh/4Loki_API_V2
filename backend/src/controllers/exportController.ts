import { Request, Response } from 'express';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import ExcelJS from 'exceljs';

/**
 * Generate an Excel export for invoiced appointments
 */
export const generateExcelExport = async (req: Request, res: Response) => {
  try {
    const { appointmentIds } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      throw new AppError('Invalid or missing appointmentIds', 400);
    }
    
    // Get appointments with details
    const placeholders = appointmentIds.map(() => '?').join(',');
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
      WHERE a.Id IN (${placeholders})
      GROUP BY a.Id
      ORDER BY a.Date ASC
    `, [...appointmentIds]);
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '4Loki Dog Grooming';
    workbook.lastModifiedBy = '4Loki Dog Grooming';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet('Facturen');
    
    // Define columns
    worksheet.columns = [
      { header: 'Factuurnummer', key: 'factuurnummer', width: 15 },
      { header: 'Referentie', key: 'referentie', width: 20 },
      { header: 'Factuurdatum', key: 'factuurdatum', width: 15 },
      { header: 'Relatie', key: 'relatie', width: 20 },
      { header: 'Vervaldatum', key: 'vervaldatum', width: 15 },
      { header: 'Omschrijving', key: 'omschrijving', width: 30 },
      { header: 'Btwpercentage', key: 'btwpercentage', width: 15 },
      { header: 'Aantal', key: 'aantal', width: 10 },
      { header: 'Bedragexcl_btw', key: 'bedragexcl_btw', width: 15 },
      { header: 'Categorie', key: 'categorie', width: 15 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add data rows
    for (const appointment of (appointments as any[])) {
      // Get all dogs for this appointment
      const [dogs] = await db.execute(`
        SELECT 
          d.Name as DogName
        FROM AppointmentDog ad
        JOIN Dog d ON ad.DogId = d.Id
        WHERE ad.AppointmentId = ?
        ORDER BY d.Name
      `, [appointment.Id]);
      
      // Generate invoice number
      const year = new Date(appointment.Date).getFullYear();
      let serialNumber = appointment.SerialNumber.toString().padStart(4, '0');
      if (appointment.IsPaidInCash) {
        serialNumber = 'C' + serialNumber;
      }
      const invoiceNumber = `${year}-${serialNumber}`;
      
      // Calculate expiry date (21 days after appointment date)
      const appointmentDate = new Date(appointment.Date);
      const expiryDate = new Date(appointmentDate);
      expiryDate.setDate(expiryDate.getDate() + 21);
      
      // Format dates
      const formattedAppointmentDate = appointmentDate.toISOString().split('T')[0];
      const formattedExpiryDate = expiryDate.toISOString().split('T')[0];
      
      // Combine all dog names
      const dogNames = (dogs as any[]).map(dog => dog.DogName).join(', ');
      
      // Calculate BTW values for the total price
      const totalPrice = parseFloat(appointment.TotalPrice || '0');
      const priceExclBtw = parseFloat((totalPrice / 1.21).toFixed(2));
      const btw = parseFloat((totalPrice - priceExclBtw).toFixed(2));
      
      // Create description
      const description = `Trimmen van ${dogNames}`;
      
      // Add a single row for the appointment
      worksheet.addRow({
        factuurnummer: invoiceNumber,
        referentie: `Afspraak op: ${formattedAppointmentDate}`,
        factuurdatum: formattedAppointmentDate,
        relatie: appointment.CustomerContactperson,
        vervaldatum: formattedExpiryDate,
        omschrijving: description,
        btwpercentage: 21,
        aantal: 1,
        bedragexcl_btw: priceExclBtw,
        categorie: ''
      });
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=facturen_export.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error('Error generating Excel export:', error);
    throw new AppError('Failed to generate Excel export', 500);
  }
};

/**
 * Get invoices that can be exported
 */
export const getExportableInvoices = async (req: Request, res: Response) => {
  try {
    const [invoices] = await db.execute(`
      SELECT 
        a.Id as id,
        CONCAT(YEAR(a.Date), '-', LPAD(a.SerialNumber, 4, '0')) as invoiceNumber,
        DATE_FORMAT(a.Date, '%Y-%m-%d') as date,
        c.Name as customer,
        GROUP_CONCAT(d.Name SEPARATOR ', ') as description,
        COALESCE(SUM(sad.Price), 0) as amount,
        a.ActualDuration as hours
      FROM Appointment a
      JOIN Customer c ON a.CustomerId = c.Id
      LEFT JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
      LEFT JOIN Dog d ON ad.DogId = d.Id
      LEFT JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
      WHERE a.AppointmentStatusId = 'Inv' AND a.AppointmentStatusId != 'Exp'
      GROUP BY a.Id, a.Date, a.SerialNumber, c.Name, a.ActualDuration
      ORDER BY a.Date DESC
    `);

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching exportable invoices:', error);
    throw new AppError('Failed to fetch exportable invoices', 500);
  }
};

/**
 * Get additional hours that can be exported
 */
export const getExportableHours = async (req: Request, res: Response) => {
  try {
    const [hours] = await db.execute(`
      SELECT 
        ah.Id as id,
        DATE_FORMAT(ah.Date, '%Y-%m-%d') as date,
        sht.DefaultText as description,
        ah.Duration as hours
      FROM AdditionalHour ah
      JOIN Statics_HourType sht ON ah.HourTypeId = sht.Id
      WHERE ah.IsExported = 0 OR ah.IsExported IS NULL
      ORDER BY ah.Date DESC
    `);

    res.json(hours);
  } catch (error) {
    console.error('Error fetching exportable hours:', error);
    throw new AppError('Failed to fetch exportable hours', 500);
  }
};

/**
 * Get customers that can be exported
 */
export const getExportableCustomers = async (req: Request, res: Response) => {
  try {
    const [customers] = await db.execute(`
      SELECT 
        c.Id as id,
        c.Name as name,
        c.Email as email,
        c.Phone as phone
      FROM Customer c
      WHERE c.IsExported = 0
      ORDER BY c.Name ASC
    `);

    res.json(customers);
  } catch (error) {
    console.error('Error fetching exportable customers:', error);
    throw new AppError('Failed to fetch exportable customers', 500);
  }
}; 