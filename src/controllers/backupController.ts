import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// Define multer file interface
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

interface ErrorDetail {
  message: string;
  details: any;
  error?: any;
  sqlError?: any;
  validationErrors?: ValidationError[];
  errorType: string;
}

interface ImportResults {
  customers: { success: number; failed: number; errors: ErrorDetail[] };
  dogs: { success: number; failed: number; errors: ErrorDetail[] };
  appointments: { success: number; failed: number; errors: ErrorDetail[] };
}

// List of tables to export/import
const NON_STATIC_TABLES = [
  'Customer',
  'Dog',
  'Appointment',
  'AppointmentDog',
  'AdditionalHour',
  'DogDogbreed',
  'ServiceAppointmentDog'
];

// Add field validation interface and function
interface FieldValidation {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  maxLength?: number;
}

const TABLE_SCHEMA: Record<string, FieldValidation[]> = {
  Customer: [
    { name: 'naam', type: 'string', required: true, maxLength: 100 },
    { name: 'contactpersoon', type: 'string', required: false, maxLength: 100 },
    { name: 'emailadres', type: 'string', required: false, maxLength: 100 },
    { name: 'telefoonnummer', type: 'string', required: false, maxLength: 20 },
    { name: 'notities', type: 'string', required: false, maxLength: 500 },
    { name: 'isallowcontactshare', type: 'string', required: false, maxLength: 7 },
    { name: 'createdon', type: 'date', required: false },
    { name: 'updatedon', type: 'date', required: false }
  ],
  Dog: [
    { name: 'name', type: 'string', required: true, maxLength: 50 },
    { name: 'breed', type: 'string', required: false, maxLength: 50 },
    { name: 'Birthday', type: 'date', required: false },
    { name: 'weight', type: 'number', required: false },
    { name: 'CustomerId', type: 'number', required: true }
  ],
  Appointment: [
    { name: 'Date', type: 'date', required: true },
    { name: 'TimeStart', type: 'string', required: true, maxLength: 10 },
    { name: 'TimeEnd', type: 'string', required: true, maxLength: 10 },
    { name: 'DateEnd', type: 'date', required: false },
    { name: 'ActualDuration', type: 'number', required: false },
    { name: 'CustomerId', type: 'number', required: true },
    { name: 'AppointmentStatusId', type: 'string', required: true, maxLength: 20 },
    { name: 'Note', type: 'string', required: false, maxLength: 500 },
    { name: 'SerialNumber', type: 'number', required: false },
    { name: 'IsPaidInCash', type: 'boolean', required: false }
  ]
};

interface ValidationError {
  field: string;
  error: string;
  value: any;
}

interface TableValidationResult {
  table: string;
  valid: boolean;
  errors: ValidationError[];
  rowNumber: number;
}

const validateRow = (tableName: string, rowData: any, rowNumber: number): TableValidationResult => {
  const schema = TABLE_SCHEMA[tableName];
  if (!schema) {
    return {
      table: tableName,
      valid: false,
      errors: [{ field: 'schema', error: 'Table schema not found', value: null }],
      rowNumber
    };
  }

  const errors: ValidationError[] = [];

  // Special handling for Dog table to ensure customer_id exists and is valid
  if (tableName === 'Dog') {
    // Check all possible variants of customer_id field
    const hasCustomerId = 
      rowData.CustomerId !== undefined || 
      rowData.customer_id !== undefined || 
      rowData.customerId !== undefined || 
      rowData.CUSTOMERID !== undefined;
    
    if (!hasCustomerId || 
        (rowData.CustomerId === null && 
         rowData.customer_id === null && 
         rowData.customerId === null && 
         rowData.CUSTOMERID === null)) {
      errors.push({
        field: 'CustomerId',
        error: `Dog "${rowData.name || rowData.Name || 'unnamed'}" is missing required customer ID reference`,
        value: null
      });
    }
  }
  
  // Special handling for Appointment table to ensure TimeStart and TimeEnd are filled
  if (tableName === 'Appointment') {
    // Check if TimeStart is missing
    if (!rowData.TimeStart && !rowData.timestart) {
      errors.push({
        field: 'TimeStart',
        error: 'Start time is required for appointments',
        value: null
      });
    }
    
    // Check if TimeEnd is missing
    if (!rowData.TimeEnd && !rowData.timeend) {
      errors.push({
        field: 'TimeEnd',
        error: 'End time is required for appointments',
        value: null
      });
    }
  }

  for (const field of schema) {
    // Check if the field exists in any case form
    const fieldName = field.name;
    const fieldLower = fieldName.toLowerCase();
    
    // Find the field in the data with any case variation
    let value = null;
    const fieldKey = Object.keys(rowData).find(
      key => key.toLowerCase() === fieldLower
    );
    
    if (fieldKey) {
      value = rowData[fieldKey];
    }
    
    // Check required fields
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: fieldName,
        error: 'Required field is missing',
        value: null
      });
      continue;
    }

    // Skip validation for optional fields that are empty
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Validate string length
    if (field.type === 'string' && field.maxLength && value.length > field.maxLength) {
      errors.push({
        field: fieldName,
        error: `Value exceeds maximum length of ${field.maxLength}`,
        value
      });
    }

    // Validate number type
    if (field.type === 'number' && isNaN(Number(value))) {
      errors.push({
        field: fieldName,
        error: 'Value must be a number',
        value
      });
    }

    // Validate date type
    if (field.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({
          field: fieldName,
          error: 'Invalid date format',
          value
        });
      }
    }

    // Validate boolean type
    if (field.type === 'boolean' && typeof value !== 'boolean') {
      errors.push({
        field: fieldName,
        error: 'Value must be a boolean',
        value
      });
    }
  }

  return {
    table: tableName,
    valid: errors.length === 0,
    errors,
    rowNumber
  };
};

// In-memory storage for preview data
let previewDataStore: Record<string, any[]> = {};

// Define a type for the row data
interface RowData {
  [key: string]: any;
}

// Initialize normalizedRow with the RowData type
const normalizedRow: RowData = {};

// Ensure validationResults is initialized
const validationResults: any[] = [];

/**
 * Generate a data backup of all non-static tables
 */
export const generateBackup = async (req: Request, res: Response) => {
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '4Loki Dog Grooming';
    workbook.lastModifiedBy = '4Loki Dog Grooming';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Get data from each table and add to workbook
    for (const table of NON_STATIC_TABLES) {
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY Id`);
      
      // Add a worksheet for each table
      const worksheet = workbook.addWorksheet(table);
      
      if (Array.isArray(rows) && rows.length > 0) {
        // Create column headers based on first row
        const firstRow = rows[0];
        worksheet.columns = Object.keys(firstRow).map(key => ({
          header: key,
          key,
          width: 20
        }));
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Add data rows
        for (const row of (rows as any[])) {
          worksheet.addRow(row);
        }
      }
    }
    
    // Set response headers
    const date = new Date().toISOString().split('T')[0];
    const filename = `4loki_backup_${date}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Write to response
    await workbook.xlsx.write(res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error('Error generating backup:', error);
    throw new AppError('Failed to generate backup', 500);
  }
};

/**
 * Convert "\N", specific dates, or any date before 1910 to null for any value
 * Also converts boolean-like values to actual booleans
 */
const convertNullValue = (value: any, fieldName?: string): any => {
  // If it's already null/undefined, just return null
  if (value === null || value === undefined) {
    return null;
  }
  
  // Check for empty strings or special null representations
  if (value === '' || value === '\\N' || 
      value === '01/01/1900' || value === '1900-01-01' ||
      value === '1899-12-31' ||
      (typeof value === 'string' && value.includes('1900-01-01'))) {
    return null;
  }

  // Special handling for IsPaidInCash field - convert to boolean
  if (fieldName && fieldName.toLowerCase() === 'ispaidincash') {
    if (typeof value === 'string') {
      // Convert string values to booleans
      return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
    } else if (typeof value === 'number') {
      // Convert numeric values to booleans
      return value === 1;
    } else if (typeof value === 'boolean') {
      // Already a boolean, return as is
      return value;
    }
    // Default to false for any other value
    return false;
  }

  // Special handling for customer_id values - don't convert valid numbers to null
  if (typeof value === 'string') {
    // Only convert '0' to null, not other numeric strings
    if (value.trim() === '0') {
      return null;
    }
    
    // Try to convert numeric strings to numbers
    const num = Number(value);
    if (!isNaN(num)) {
      return num; // Return the numeric value
    }
  }
  
  // Check for dates before 1910 - skip this for numbers that might be IDs
  if (typeof value === 'string' && !isNumeric(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime()) && date.getFullYear() < 1910) {
      return null;
    }
  }
  
  return value;
};

/**
 * Helper function to check if a string is numeric
 */
const isNumeric = (value: string): boolean => {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
};

/**
 * Convert Excel time value (decimal fraction of day) to MySQL time format
 */
const convertExcelTimeToMySql = (excelTime: number): string | null => {
  if (excelTime === 0) return null;
  
  // Excel stores time as fraction of 24 hours
  // Convert to seconds
  const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  // Format as HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Helper function to convert Excel time format (HH:MM:SS) to MySQL time format
 */
const formatTimeToMySql = (timeString: string | null | number | Date): string | null => {
  // Handle null or empty values
  if (timeString === null || timeString === undefined || timeString === '') {
    return null;
  }
  
  // If value is a Date object, extract the time part
  if (timeString instanceof Date) {
    console.log(`Converting Date object to time: ${timeString}`);
    // Check if the date is around Excel epoch (1899-12-30)
    const year = timeString.getFullYear();
    if (year < 1910) {
      // This is likely just a time value stored in a date object
      // Extract just the time component
      return `${timeString.getHours().toString().padStart(2, '0')}:${
        timeString.getMinutes().toString().padStart(2, '0')}:${
        timeString.getSeconds().toString().padStart(2, '0')}`;
    } else {
      // Normal date - extract time part
      return timeString.toTimeString().slice(0, 8);
    }
  }
  
  // If value is a number, it could be an Excel time value (decimal fraction of day)
  if (typeof timeString === 'number') {
    return convertExcelTimeToMySql(timeString);
  }
  
  // If it's a string, continue with text parsing
  if (typeof timeString === 'string') {
    // Basic validation
    if (timeString === '00:00:00' || timeString === '00:00') {
      return null; // Treat midnight as null to avoid issues
    }
    
    // If it's already in HH:MM:SS or HH:MM format, return it with proper formatting
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeString)) {
      // Make sure it's in HH:MM:SS format
      if (!timeString.includes(':')) return null;
      
      const parts = timeString.split(':');
      
      // Validate hours, minutes, seconds
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`Invalid time values: ${timeString}`);
        return null;
      }
      
      if (parts.length === 2) {
        // Add seconds if it's just HH:MM
        return `${timeString}:00`;
      }
      
      // Ensure seconds are valid
      const seconds = parseInt(parts[2], 10);
      if (seconds < 0 || seconds > 59) {
        console.warn(`Invalid seconds value: ${timeString}`);
        return null;
      }
      
      return timeString;
    }
    
    // Try to parse as a date and extract the time part
    try {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().slice(0, 8); // Takes just the HH:MM:SS part
      }
    } catch (e) {
      console.warn(`Failed to parse time: ${timeString}`);
    }
  }
  
  return null;
};

/**
 * Helper function to format a date string to MySQL date format (YYYY-MM-DD)
 * Also returns null for very old dates (before 1910)
 */
const formatDateToMySql = (dateString: string | null | Date): string | null => {
  if (!dateString) return null;
  
  // If it's a Date object
  if (dateString instanceof Date) {
    // Check for old dates - return null for dates before 1910
    if (dateString.getFullYear() < 1910) {
      console.log(`Converting old date to null: ${dateString}`);
      return null;
    }
    return dateString.toISOString().split('T')[0];
  }
  
  // If it's already in YYYY-MM-DD format, check for old dates
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    if (year < 1910) {
      console.log(`Converting old date string to null: ${dateString}`);
      return null;
    }
    return dateString;
  }
  
  // Try to parse as a date
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Check for old dates - return null for dates before 1910
      if (date.getFullYear() < 1910) {
        console.log(`Converting parsed old date to null: ${dateString}`);
        return null;
      }
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn(`Failed to parse date: ${dateString}`);
  }
  
  return null;
};

/**
 * Preview data from a backup file before import
 */
export const previewBackup = async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const workbook = new ExcelJS.Workbook();
  const buffer = req.file.buffer;

  try {
    await workbook.xlsx.load(buffer);
    
    const preview: Record<string, any[]> = {};
    const validationResults: TableValidationResult[] = [];

    // Process each worksheet
    for (const worksheet of workbook.worksheets) {
      const tableName = worksheet.name;
      const tableNameLower = tableName.toLowerCase();
      
      // Skip if not a valid table name
      if (!NON_STATIC_TABLES.map(t => t.toLowerCase()).includes(tableNameLower)) {
        console.warn(`Skipping worksheet ${tableName} as it's not in the allowed list`);
        continue;
      }

      // Get headers from first row
      const headers = worksheet.getRow(1).values as string[];
      if (!headers || headers.length <= 1) {
        console.warn(`No valid headers found for table ${tableName}`);
        continue;
      }

      // Remove first empty element from headers array (ExcelJS quirk)
      headers.shift();
      
      // Log original headers to help debug
      console.log(`Original headers for table ${tableName}:`, headers);

      // Find the index of the CustomerId column (case insensitive)
      const customerIdIndex = headers.findIndex(h => 
        typeof h === 'string' && h.toLowerCase() === 'customerid'
      );
      
      console.log(`CustomerID column index for ${tableName}: ${customerIdIndex}`);

      // Normalize headers to lowercase
      const normalizedHeaders = headers.map(header => 
        typeof header === 'string' ? header.toLowerCase() : `column_${header}`
      );

      // Process each row
      const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
      preview[tableName] = rows.map((row, index) => {
        const rowData: any = {};
        
        // First get the raw CustomerId directly if it exists
        const rawCustomerId = customerIdIndex !== -1 ? row.getCell(customerIdIndex + 1).text : null;
        if (rawCustomerId && rawCustomerId.trim() !== '') {
          console.log(`Row ${row.number}, ${tableName}, raw CustomerId: ${rawCustomerId}`);
          // Convert potential numeric string to number for database
          rowData['CustomerId'] = isNaN(Number(rawCustomerId)) ? rawCustomerId : Number(rawCustomerId);
        }
        
        // Then populate the rest of the fields
        normalizedHeaders.forEach((header, colIndex) => {
          if (header.toLowerCase() !== 'customerid') { // Skip the CustomerId field as we've handled it
            const cell = row.getCell(colIndex + 1);
            let value;
            
            // Check cell type to handle different types of data correctly
            if (cell.type === 4) { // DateValue enum in ExcelJS
              // Handle date values
              value = cell.value; // Get the Date object
              // Log all date/time values for debugging
              console.log(`Found Date value in column ${header}: ${value}`);
            } else if (cell.type === 2 && typeof cell.value === 'number') { // NumberValue enum
              // For numeric values, check if this might be a time value (for time columns)
              const headerName = header.toLowerCase();
              if (headerName.includes('time') || headerName.includes('start') || headerName.includes('end')) {
                // If the value is small (less than 1), it's likely a time value (fraction of day)
                if (cell.value < 1) {
                  console.log(`Potential time value found: ${cell.value} for header ${header}`);
                  // Store the raw value - we'll format it during processing
                  value = cell.value;
                } else {
                  value = cell.text; // Use string representation
                }
              } else {
                value = cell.value; // Use numeric value
              }
            } else {
              // For other types, use the text representation
              value = cell.text;
            }
            
            rowData[header] = convertNullValue(value, header);
          }
        });

        // Safety check - ensure CustomerId is still populated from raw value
        if (rawCustomerId && rawCustomerId.trim() !== '' && !rowData['CustomerId']) {
          rowData['CustomerId'] = isNaN(Number(rawCustomerId)) ? rawCustomerId : Number(rawCustomerId);
        }

        // If we have customer_id but not CustomerId, map it
        if (rowData['customer_id'] && !rowData['CustomerId']) {
          rowData['CustomerId'] = rowData['customer_id'];
          delete rowData['customer_id'];
        }
        
        // For Appointment table, apply field name mapping
        if (tableNameLower === 'appointment') {
          // Field name mapping from lowercase to proper case
          const fieldMapping: Record<string, string> = {
            'id': 'Id',
            'date': 'Date',
            'timestart': 'TimeStart', 
            'timeend': 'TimeEnd',
            'dateend': 'DateEnd',
            'actualduration': 'ActualDuration',
            'customerid': 'CustomerId',
            'appointmentstatusid': 'AppointmentStatusId',
            'note': 'Note',
            'serialnumber': 'SerialNumber',
            'ispaidincash': 'IsPaidInCash'
          };
          
          // Create a new object with properly capitalized field names
          const properCaseRow: RowData = {};
          
          // Map field names and handle date/time formatting
          Object.keys(rowData).forEach(key => {
            const lowerKey = key.toLowerCase();
            const value = rowData[key];
            
            if (fieldMapping[lowerKey]) {
              const mappedKey = fieldMapping[lowerKey];
              
              // Handle specific date and time fields
              if (mappedKey === 'Date' || mappedKey === 'DateEnd') {
                properCaseRow[mappedKey] = formatDateToMySql(value);
              } else if (mappedKey === 'TimeStart' || mappedKey === 'TimeEnd') {
                // Pass the value directly to formatTimeToMySql which can now handle numeric values
                properCaseRow[mappedKey] = formatTimeToMySql(value);
                console.log(`${mappedKey} value: ${value}, formatted: ${properCaseRow[mappedKey]}`);
              } else {
                properCaseRow[mappedKey] = value;
              }
            } else if (!Object.values(fieldMapping).map(v => v.toLowerCase()).includes(lowerKey)) {
              // Only include keys that don't have a mapped equivalent
              properCaseRow[key] = value;
            }
          });
          
          // Replace rowData completely with properCaseRow instead of merging
          // This prevents duplicate fields with different casings
          Object.keys(rowData).forEach(key => delete rowData[key]); 
          Object.assign(rowData, properCaseRow);
        }
        
        // Check for missing customer_id for Dog and Appointment tables
        if ((tableNameLower === 'dog' || tableNameLower === 'appointment') && !rowData['CustomerId']) {
          console.warn(`Row ${row.number} in table ${tableName} is missing CustomerId. Dog name: ${rowData.name || rowData.Name || 'unnamed'}`);
          validationResults.push({
            table: tableName,
            valid: false,
            errors: [{ 
              field: 'CustomerId', 
              error: `Required field is missing for ${tableNameLower === 'dog' ? `dog "${rowData.name || rowData.Name || 'unnamed'}"` : 'appointment'}`, 
              value: null 
            }],
            rowNumber: row.number
          });
        }

        // Validate the row
        const validationResult = validateRow(tableName, rowData, row.number);
        if (!validationResult.valid) {
          validationResults.push(validationResult);
        }

        // Log row data before validation
        console.log(`Row data before validation for table ${tableName}:`, rowData);

        return rowData;
      });
    }

    // Store preview data in memory
    previewDataStore = preview;

    res.json({
      message: 'Backup preview generated successfully',
      preview,
      validationResults
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ 
      error: 'Failed to preview backup',
      details: error.message 
    });
  }
};

/**
 * Import data from a backup file
 */
export const importBackup = async (req: MulterRequest, res: Response) => {
  if (!previewDataStore || Object.keys(previewDataStore).length === 0) {
    return res.status(400).json({ error: 'No preview data available for import' });
  }

  try {
    const results: ImportResults = {
      customers: { success: 0, failed: 0, errors: [] },
      dogs: { success: 0, failed: 0, errors: [] },
      appointments: { success: 0, failed: 0, errors: [] }
    };

    // Get a connection from the pool
    const connection = await db.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Process each table from preview data
      for (const tableName in previewDataStore) {
        const tableNameLower = tableName.toLowerCase();
        const rows = previewDataStore[tableName];
        console.log(`Processing ${rows.length} rows for table ${tableName}`);
        
        for (const row of rows) {
          try {
            // Create a row identifier for better error reporting
            let rowIdentifier = '';
            let rowDetails = {};
            
            if (tableNameLower === 'customer') {
              rowIdentifier = `Customer "${row.naam || row.Naam || 'unnamed'}"`;
              rowDetails = {
                name: row.naam || row.Naam || 'unnamed',
                id: row.id || row.Id,
                contact: row.contactpersoon || row.Contactpersoon
              };
            } else if (tableNameLower === 'dog') {
              rowIdentifier = `Dog "${row.name || row.Name || 'unnamed'}" (CustomerId: ${row.CustomerId || 'missing'})`;
              rowDetails = {
                name: row.name || row.Name || 'unnamed',
                id: row.id || row.Id,
                customerId: row.CustomerId || 'missing',
                breed: row.breed || row.Breed
              };
            } else if (tableNameLower === 'appointment') {
              const dateInfo = row.Date || row.date || 'unknown date';
              const timeInfo = row.TimeStart || row.timestart || 'unknown time';
              rowIdentifier = `Appointment on ${dateInfo} at ${timeInfo} (CustomerId: ${row.CustomerId || 'missing'})`;
              rowDetails = {
                date: dateInfo,
                time: timeInfo,
                id: row.id || row.Id,
                customerId: row.CustomerId || 'missing',
                status: row.AppointmentStatusId || row.appointmentstatusid
              };
            } else {
              rowIdentifier = `Row in ${tableName}`;
              rowDetails = { id: row.id || row.Id };
            }
            
            // First log the original row for debugging
            console.log(`Processing ${rowIdentifier}:`, row);
            
            // Since we've already processed the customer_id in the preview stage,
            // we should keep it intact in the normalizedRow
            const normalizedRow: RowData = { ...row };
            
            // Ensure CustomerId has the correct type (number) if it's a numeric string
            if (normalizedRow.CustomerId && typeof normalizedRow.CustomerId === 'string' && !isNaN(Number(normalizedRow.CustomerId))) {
              normalizedRow.CustomerId = Number(normalizedRow.CustomerId);
            }
            
            // If we have customer_id but not CustomerId, map it
            if (normalizedRow.customer_id && !normalizedRow.CustomerId) {
              normalizedRow.CustomerId = normalizedRow.customer_id;
              delete normalizedRow.customer_id;
            }
            
            // For Appointment table, ensure fields have the correct capitalization
            if (tableNameLower === 'appointment') {
              // Field name mapping from Excel/JSON to database schema
              const fieldMapping: Record<string, string> = {
                'id': 'Id',
                'date': 'Date',
                'timestart': 'TimeStart', 
                'timeend': 'TimeEnd',
                'dateend': 'DateEnd',
                'actualduration': 'ActualDuration',
                'customerid': 'CustomerId',
                'appointmentstatusid': 'AppointmentStatusId',
                'note': 'Note',
                'serialnumber': 'SerialNumber',
                'ispaidincash': 'IsPaidInCash'
              };
              
              // Create a new object with ONLY properly capitalized field names
              const properCaseRow: RowData = {};
              
              // First, capture all fields with their proper casing 
              Object.keys(normalizedRow).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (fieldMapping[lowerKey]) {
                  // Use the proper field name from mapping
                  properCaseRow[fieldMapping[lowerKey]] = normalizedRow[key];
                } else if (!lowerKey.toLowerCase().startsWith('id') && 
                           !Object.values(fieldMapping).map(v => v.toLowerCase()).includes(lowerKey)) {
                  // Keep original if no mapping exists and it's not already a mapped field
                  properCaseRow[key] = normalizedRow[key];
                }
              });
              
              // Create a new normalized row with ONLY the properly cased fields
              const updatedRow: RowData = { ...properCaseRow };
              
              // Check for various forms of the IsPaidInCash field
              const isPaidValue = normalizedRow.IsPaidInCash !== undefined ? normalizedRow.IsPaidInCash :
                                  normalizedRow.ispaidincash !== undefined ? normalizedRow.ispaidincash :
                                  normalizedRow.is_paid_in_cash !== undefined ? normalizedRow.is_paid_in_cash : null;
              
              if (isPaidValue !== null) {
                // Ensure it's properly converted to a boolean for MySQL
                updatedRow.IsPaidInCash = convertNullValue(isPaidValue, 'IsPaidInCash');
                
                console.log(`Appointment ${updatedRow.Id || 'new'} IsPaidInCash set to:`, updatedRow.IsPaidInCash);
              }
              
              // Replace normalizedRow with updatedRow
              Object.keys(normalizedRow).forEach(key => delete normalizedRow[key]);
              Object.assign(normalizedRow, updatedRow);
            } else if (tableNameLower === 'customer') {
              // Field name mapping from Excel/JSON to database schema
              const fieldMapping: Record<string, string> = {
                'id': 'Id',
                'naam': 'Naam',
                'contactpersoon': 'Contactpersoon',
                'emailadres': 'Emailadres',
                'telefoonnummer': 'Telefoonnummer',
                'notities': 'Notities',
                'isallowcontactshare': 'IsAllowContactShare',
                'createdon': 'CreatedOn',
                'updatedon': 'UpdatedOn'
              };
              
              // Create a new object with properly capitalized field names
              const properCaseRow: RowData = {};
              
              // First, capture all fields with their proper casing 
              Object.keys(normalizedRow).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (fieldMapping[lowerKey]) {
                  // Use the proper field name from mapping
                  properCaseRow[fieldMapping[lowerKey]] = normalizedRow[key];
                } else if (!lowerKey.toLowerCase().startsWith('id') && 
                           !Object.values(fieldMapping).map(v => v.toLowerCase()).includes(lowerKey)) {
                  // Keep original if no mapping exists and it's not already a mapped field
                  properCaseRow[key] = normalizedRow[key];
                }
              });
              
              // Replace normalizedRow with properCaseRow
              Object.keys(normalizedRow).forEach(key => delete normalizedRow[key]);
              Object.assign(normalizedRow, properCaseRow);
            }
            
            // Log the CustomerId for debugging
            console.log(`${tableName} row has CustomerId:`, normalizedRow.CustomerId);

            // Check for required fields based on table type
            if (tableNameLower === 'dog' && !normalizedRow['CustomerId']) {
              const errorMsg = `${rowIdentifier} is missing required CustomerId reference`;
              console.error(errorMsg);
              
              results.dogs.failed++;
              results.dogs.errors.push({
                message: errorMsg,
                details: rowDetails,
                errorType: 'missing_customer_id'
              });
              continue;
            }
            
            if (tableNameLower === 'appointment' && !normalizedRow['CustomerId']) {
              const errorMsg = `${rowIdentifier} is missing required CustomerId reference`;
              console.error(errorMsg);
              
              results.appointments.failed++;
              results.appointments.errors.push({
                message: errorMsg,
                details: rowDetails,
                errorType: 'missing_customer_id'
              });
              continue;
            }

            // Validate the row before import
            const validationResult = validateRow(tableName, normalizedRow, 0);
            if (!validationResult.valid) {
              // Create a detailed error message with the validation errors
              const errorDetails = validationResult.errors.map(err => 
                `Field "${err.field}": ${err.error}${err.value !== null ? ` (value: ${err.value})` : ''}`
              ).join('; ');
              
              const errorMsg = `${rowIdentifier} validation failed: ${errorDetails}`;
              console.error(errorMsg);
              
              // Add to appropriate error collection
              const detailedError = {
                message: errorMsg,
                details: rowDetails,
                validationErrors: validationResult.errors,
                errorType: 'validation_error'
              };
              
              switch (tableNameLower) {
                case 'customer':
                  results.customers.failed++;
                  results.customers.errors.push(detailedError);
                  break;
                case 'dog':
                  results.dogs.failed++;
                  results.dogs.errors.push(detailedError);
                  break;
                case 'appointment':
                  results.appointments.failed++;
                  results.appointments.errors.push(detailedError);
                  break;
              }
              continue;
            }

            // Format dates for Appointment table
            if (tableNameLower === 'appointment') {
              // Format Date field to MySQL format (YYYY-MM-DD)
              normalizedRow.Date = formatDateToMySql(normalizedRow.Date);
              
              // Format DateEnd field if it exists
              // Ensure old dates are converted to null
              normalizedRow.DateEnd = formatDateToMySql(normalizedRow.DateEnd);
              
              // Log the raw time values before formatting
              console.log(`Raw TimeStart: ${typeof normalizedRow.TimeStart} - ${normalizedRow.TimeStart}`);
              console.log(`Raw TimeEnd: ${typeof normalizedRow.TimeEnd} - ${normalizedRow.TimeEnd}`);
              
              // Format TimeStart and TimeEnd to HH:MM:SS format
              normalizedRow.TimeStart = formatTimeToMySql(normalizedRow.TimeStart);
              normalizedRow.TimeEnd = formatTimeToMySql(normalizedRow.TimeEnd);
              
              console.log(`Formatted appointment date: ${normalizedRow.Date}, timeStart: ${normalizedRow.TimeStart}, timeEnd: ${normalizedRow.TimeEnd}`);
            }

            // Format dates for Dog table
            if (tableNameLower === 'dog') {
              // Field name mapping from Excel/JSON to database schema
              const fieldMapping: Record<string, string> = {
                'id': 'Id',
                'name': 'Name',
                'breed': 'Breed',
                'birth_date': 'Birthday',
                'birthday': 'Birthday',
                'weight': 'Weight',
                'allergies': 'Allergies',
                'servicenote': 'ServiceNote',
                'dogsizeid': 'DogSizeId',
                'customerid': 'CustomerId'
              };
              
              // Create a new object with properly capitalized field names
              const properCaseRow: RowData = {};
              
              // First, capture all fields with their proper casing 
              Object.keys(normalizedRow).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (fieldMapping[lowerKey]) {
                  // Use the proper field name from mapping
                  properCaseRow[fieldMapping[lowerKey]] = normalizedRow[key];
                } else if (!lowerKey.toLowerCase().startsWith('id') && 
                           !Object.values(fieldMapping).map(v => v.toLowerCase()).includes(lowerKey)) {
                  // Keep original if no mapping exists and it's not already a mapped field
                  properCaseRow[key] = normalizedRow[key];
                }
              });
              
              // Replace normalizedRow with properCaseRow
              Object.keys(normalizedRow).forEach(key => delete normalizedRow[key]);
              Object.assign(normalizedRow, properCaseRow);
              
              // Format Birthday field
              normalizedRow.Birthday = formatDateToMySql(normalizedRow.Birthday);
            }

            // Format created/updated dates for all tables
            if (normalizedRow.CreatedOn) {
              try {
                const date = new Date(normalizedRow.CreatedOn);
                if (!isNaN(date.getTime())) {
                  // Format to MySQL compatible datetime format: YYYY-MM-DD HH:MM:SS
                  normalizedRow.CreatedOn = date.toISOString().slice(0, 19).replace('T', ' ');
                }
              } catch (e) {
                console.warn(`Failed to format CreatedOn date: ${normalizedRow.CreatedOn}`);
              }
            }
            
            if (normalizedRow.UpdatedOn) {
              try {
                const date = new Date(normalizedRow.UpdatedOn);
                if (!isNaN(date.getTime())) {
                  // Format to MySQL compatible datetime format: YYYY-MM-DD HH:MM:SS
                  normalizedRow.UpdatedOn = date.toISOString().slice(0, 19).replace('T', ' ');
                }
              } catch (e) {
                console.warn(`Failed to format UpdatedOn date: ${normalizedRow.UpdatedOn}`);
              }
            }

            // Handle lowercase variants of createdOn and updatedOn
            if (normalizedRow.createdon) {
              try {
                const date = new Date(normalizedRow.createdon);
                if (!isNaN(date.getTime())) {
                  // Format to MySQL compatible datetime format: YYYY-MM-DD HH:MM:SS
                  normalizedRow.createdon = date.toISOString().slice(0, 19).replace('T', ' ');
                }
              } catch (e) {
                console.warn(`Failed to format createdon date: ${normalizedRow.createdon}`);
              }
            }
            
            if (normalizedRow.updatedon) {
              try {
                const date = new Date(normalizedRow.updatedon);
                if (!isNaN(date.getTime())) {
                  // Format to MySQL compatible datetime format: YYYY-MM-DD HH:MM:SS
                  normalizedRow.updatedon = date.toISOString().slice(0, 19).replace('T', ' ');
                }
              } catch (e) {
                console.warn(`Failed to format updatedon date: ${normalizedRow.updatedon}`);
              }
            }

            // Remove non-existent fields
            delete normalizedRow.created_at;
            delete normalizedRow.updated_at;

            // Log the row data before insertion
            console.log(`Inserting row into ${tableName}:`, normalizedRow);

            // Explicitly list columns and values
            const columns = Object.keys(normalizedRow).join(', ');
            const placeholders = Object.keys(normalizedRow).map(() => '?').join(', ');
            const values = Object.values(normalizedRow);

            try {
              // For existing record with an ID, check if we need to handle auto-increment
              let sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
              
              // Execute the insert statement
              const [result] = await connection.execute(sql, values);
              
              // If the ID column is present in the data, update the auto-increment value
              if (normalizedRow.Id || normalizedRow.id) {
                // Get the current max ID
                const [maxRows]: any = await connection.execute(`SELECT MAX(Id) as maxId FROM ${tableName}`);
                const maxId = maxRows[0].maxId || 0;
                
                // Update the auto-increment to be one more than the max ID
                await connection.execute(`ALTER TABLE ${tableName} AUTO_INCREMENT = ${maxId + 1}`);
              }
              
              // Log the result of the insertion
              console.log(`Successfully inserted ${rowIdentifier}:`, result);
              
              // Update success counts
              switch (tableNameLower) {
                case 'customer':
                  results.customers.success++;
                  break;
                case 'dog':
                  results.dogs.success++;
                  break;
                case 'appointment':
                  results.appointments.success++;
                  break;
              }
            } catch (dbError: any) {
              // Create a detailed database error message
              const errorMsg = `${rowIdentifier} database error: ${dbError.message}`;
              console.error(errorMsg);
              
              // Add to appropriate error collection
              const detailedError = {
                message: errorMsg,
                details: rowDetails,
                sqlError: dbError.message,
                errorType: 'database_error'
              };
              
              // Add to appropriate error collection
              switch (tableNameLower) {
                case 'customer':
                  results.customers.failed++;
                  results.customers.errors.push(detailedError);
                  break;
                case 'dog':
                  results.dogs.failed++;
                  results.dogs.errors.push(detailedError);
                  break;
                case 'appointment':
                  results.appointments.failed++;
                  results.appointments.errors.push(detailedError);
                  break;
              }
            }
          } catch (error: any) {
            // Create a descriptive error for the row
            let rowIdentifier = '';
            let rowDetails = {};
            
            try {
              if (tableNameLower === 'customer') {
                rowIdentifier = `Customer "${row.naam || row.Naam || 'unnamed'}"`;
                rowDetails = {
                  name: row.naam || row.Naam || 'unnamed',
                  id: row.id || row.Id
                };
              } else if (tableNameLower === 'dog') {
                rowIdentifier = `Dog "${row.name || row.Name || 'unnamed'}" (CustomerId: ${row.CustomerId || 'missing'})`;
                rowDetails = {
                  name: row.name || row.Name || 'unnamed',
                  id: row.id || row.Id,
                  customerId: row.CustomerId
                };
              } else if (tableNameLower === 'appointment') {
                const dateInfo = row.Date || row.date || 'unknown date';
                const timeInfo = row.TimeStart || row.timestart || 'unknown time';
                rowIdentifier = `Appointment on ${dateInfo} at ${timeInfo} (CustomerId: ${row.CustomerId || 'missing'})`;
                rowDetails = {
                  date: dateInfo,
                  time: timeInfo,
                  id: row.id || row.Id,
                  customerId: row.CustomerId
                };
              } else {
                rowIdentifier = `Row in ${tableName}`;
                rowDetails = { id: row.id || row.Id };
              }
            } catch (e) {
              rowIdentifier = `Row in ${tableName}`;
              rowDetails = { error: "Could not extract row details" };
            }
            
            const errorMsg = `${rowIdentifier} processing error: ${error.message}`;
            console.error(errorMsg);
            
            const detailedError = {
              message: errorMsg,
              details: rowDetails,
              error: error.message,
              errorType: 'processing_error'
            };
            
            // Update failure count based on table
            switch (tableNameLower) {
              case 'customer':
                results.customers.failed++;
                results.customers.errors.push(detailedError);
                break;
              case 'dog':
                results.dogs.failed++;
                results.dogs.errors.push(detailedError);
                break;
              case 'appointment':
                results.appointments.failed++;
                results.appointments.errors.push(detailedError);
                break;
            }
          }
        }
      }

      // Commit transaction
      await connection.commit();

      // Clear preview data after import
      previewDataStore = {};

      // Prepare detailed report for frontend display
      const detailedReport = {
        summary: {
          total: {
            success: results.customers.success + results.dogs.success + results.appointments.success,
            failed: results.customers.failed + results.dogs.failed + results.appointments.failed
          },
          tables: {
            'Customer': { 
              success: results.customers.success, 
              failed: results.customers.failed 
            },
            'Dog': { 
              success: results.dogs.success, 
              failed: results.dogs.failed 
            },
            'Appointment': { 
              success: results.appointments.success, 
              failed: results.appointments.failed 
            }
          }
        },
        // Format errors to be more readable for frontend display
        errorsByTable: [
          {
            tableName: 'Customer',
            count: results.customers.failed,
            items: results.customers.errors
          },
          {
            tableName: 'Dog',
            count: results.dogs.failed,
            items: results.dogs.errors
          },
          {
            tableName: 'Appointment',
            count: results.appointments.failed,
            items: results.appointments.errors
          }
        ].filter(tableReport => tableReport.count > 0) // Only include tables with errors
      };

      // Create a message summarizing the import
      const totalSuccess = detailedReport.summary.total.success;
      const totalFailed = detailedReport.summary.total.failed;
      
      let statusMessage;
      if (totalFailed === 0) {
        statusMessage = `Import successful: ${totalSuccess} records imported without errors.`;
      } else if (totalSuccess === 0) {
        statusMessage = `Import failed: All ${totalFailed} records failed to import.`;
      } else {
        statusMessage = `Import partially successful: ${totalSuccess} records imported, ${totalFailed} records failed.`;
      }

      res.json({
        status: totalFailed > 0 ? 'partial' : 'success',
        message: statusMessage,
        report: detailedReport
      });
    } catch (error: any) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Transaction error:', error);
      
      // Also send error details to frontend
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to import backup due to a transaction error',
        error: error.message,
        details: 'The transaction was rolled back - no data was imported.'
      });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to import backup',
      error: error.message,
      details: 'An error occurred before database operations could begin.'
    });
  }
};

/**
 * Clear all non-static data from the database
 */
export const clearDatabase = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Clear tables in reverse order of dependencies
    const tablesToClear = [
      'ServiceAppointmentDog',
      'DogDogbreed',
      'AdditionalHour',
      'AppointmentDog',
      'Appointment',
      'Dog',
      'Customer'
    ];

    for (const table of tablesToClear) {
      await connection.execute(`DELETE FROM ${table}`);
    }

    await connection.commit();
    res.json({ message: 'Database cleared successfully' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error clearing database:', error);
    res.status(500).json({ 
      error: 'Failed to clear database',
      details: error.message 
    });
  } finally {
    connection.release();
  }
}; 