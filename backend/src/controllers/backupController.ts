import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { downloadFromDrive } from '../services/google/drive';
import { Writable } from 'stream';

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
  appointmentDogs: { success: number; failed: number; errors: ErrorDetail[] };
  additionalHours: { success: number; failed: number; errors: ErrorDetail[] };
  dogDogbreeds: { success: number; failed: number; errors: ErrorDetail[] };
  serviceAppointmentDogs: { success: number; failed: number; errors: ErrorDetail[] };
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
    { name: 'name', type: 'string', required: true, maxLength: 255 },
    { name: 'contactperson', type: 'string', required: false, maxLength: 255 },
    { name: 'email', type: 'string', required: false, maxLength: 255 },
    { name: 'phone', type: 'string', required: false, maxLength: 50 },
    { name: 'notities', type: 'string', required: false, maxLength: 500 },
    { name: 'isallowcontactshare', type: 'string', required: false, maxLength: 10 },
    { name: 'createdon', type: 'date', required: false },
    { name: 'updatedon', type: 'date', required: false }
  ],
  Dog: [
    { name: 'name', type: 'string', required: true, maxLength: 255 },
    { name: 'breed', type: 'string', required: false, maxLength: 255 },
    { name: 'Birthday', type: 'date', required: false },
    { name: 'weight', type: 'number', required: false },
    { name: 'CustomerId', type: 'number', required: true },
    { name: 'Allergies', type: 'string', required: false },
    { name: 'ServiceNote', type: 'string', required: false },
    { name: 'DogSizeId', type: 'string', required: false, maxLength: 50 }
  ],
  Appointment: [
    { name: 'Date', type: 'date', required: true },
    { name: 'TimeStart', type: 'string', required: true, maxLength: 10 },
    { name: 'TimeEnd', type: 'string', required: true, maxLength: 10 },
    { name: 'DateEnd', type: 'date', required: false },
    { name: 'ActualDuration', type: 'number', required: false },
    { name: 'CustomerId', type: 'number', required: true },
    { name: 'AppointmentStatusId', type: 'string', required: true, maxLength: 50 },
    { name: 'Note', type: 'string', required: false, maxLength: 500 },
    { name: 'SerialNumber', type: 'number', required: false },
    { name: 'IsPaidInCash', type: 'boolean', required: false }
  ],
  AppointmentDog: [
    { name: 'AppointmentId', type: 'number', required: true },
    { name: 'DogId', type: 'number', required: true },
    { name: 'Note', type: 'string', required: false }
  ],
  AdditionalHour: [
    { name: 'HourTypeId', type: 'string', required: false, maxLength: 20 },
    { name: 'Duration', type: 'number', required: true },
    { name: 'Date', type: 'date', required: false },
    { name: 'Description', type: 'string', required: false },
    { name: 'IsExported', type: 'boolean', required: false }
  ],
  DogDogbreed: [
    { name: 'DogId', type: 'number', required: true },
    { name: 'DogbreedId', type: 'string', required: true, maxLength: 50 }
  ],
  ServiceAppointmentDog: [
    { name: 'AppointmentDogId', type: 'number', required: true },
    { name: 'ServiceId', type: 'string', required: true, maxLength: 50 },
    { name: 'Price', type: 'number', required: false }
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

  // Special handling for AppointmentDog table
  if (tableName === 'AppointmentDog') {
    // Check for AppointmentId
    const hasAppointmentId = 
      rowData.AppointmentId !== undefined || 
      rowData.appointmentid !== undefined || 
      rowData.appointmentId !== undefined;
      
    if (!hasAppointmentId || 
        (rowData.AppointmentId === null && 
         rowData.appointmentid === null && 
         rowData.appointmentId === null)) {
      errors.push({
        field: 'AppointmentId',
        error: `AppointmentDog record is missing required appointment ID reference`,
        value: null
      });
    }
    
    // Check for DogId
    const hasDogId = 
      rowData.DogId !== undefined || 
      rowData.dogid !== undefined || 
      rowData.dogId !== undefined;
      
    if (!hasDogId || 
        (rowData.DogId === null && 
         rowData.dogid === null && 
         rowData.dogId === null)) {
      errors.push({
        field: 'DogId',
        error: `AppointmentDog record is missing required dog ID reference`,
        value: null
      });
    }
  }

  // Special handling for ServiceAppointmentDog table
  if (tableName === 'ServiceAppointmentDog') {
    // Check for AppointmentDogId
    const hasAppointmentDogId = 
      rowData.AppointmentDogId !== undefined || 
      rowData.appointmentdogid !== undefined || 
      rowData.appointmentDogId !== undefined;
      
    if (!hasAppointmentDogId || 
        (rowData.AppointmentDogId === null && 
         rowData.appointmentdogid === null && 
         rowData.appointmentDogId === null)) {
      errors.push({
        field: 'AppointmentDogId',
        error: `ServiceAppointmentDog record is missing required appointmentDog ID reference`,
        value: null
      });
    }
    
    // Check for ServiceId
    const hasServiceId = 
      rowData.ServiceId !== undefined || 
      rowData.serviceid !== undefined || 
      rowData.serviceId !== undefined;
      
    if (!hasServiceId || 
        (rowData.ServiceId === null && 
         rowData.serviceid === null && 
         rowData.serviceId === null)) {
      errors.push({
        field: 'ServiceId',
        error: `ServiceAppointmentDog record is missing required service ID reference`,
        value: null
      });
    }
  }

  // Regular schema validation for all fields
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

  // Special handling for IsExported field - convert to boolean
  if (fieldName && fieldName.toLowerCase() === 'isexported') {
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
      return null;
    }
    return dateString.toISOString().split('T')[0];
  }
  
  // If it's already in YYYY-MM-DD format, check for old dates
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    if (year < 1910) {
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
      

      // Find the index of the CustomerId column (case insensitive)
      const customerIdIndex = headers.findIndex(h => 
        typeof h === 'string' && h.toLowerCase() === 'customerid'
      );
      

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
            } else if (cell.type === 2 && typeof cell.value === 'number') { // NumberValue enum
              // For numeric values, check if this might be a time value (for time columns)
              const headerName = header.toLowerCase();
              if (headerName.includes('time') || headerName.includes('start') || headerName.includes('end')) {
                // If the value is small (less than 1), it's likely a time value (fraction of day)
                if (cell.value < 1) {
          
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
 * Process a single row of data for a specific table
 * Returns a result object instead of throwing errors
 */
async function processTableRow(tableName: string, row: any, rowNumber: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the row first
    const validationResult = validateRow(tableName, row, rowNumber);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.errors.map(e => `${e.field}: ${e.error}`).join(', ')
      };
    }

    // Insert the row into the database
    await db.query(`INSERT INTO ${tableName} SET ?`, [row]);
    return { success: true };
  } catch (error: any) {
    // Handle specific MySQL errors more gracefully
    if (error.code === 'ER_DUP_ENTRY') {
      let errorMessage = `Duplicate entry for ${tableName}`;
      
      // Add more details for Customer table duplicates
      if (tableName === 'Customer') {
        const customerDetails = [];
        // Check for name in both cases (name and Name)
        const name = row.name || row.Name;
        const email = row.email || row.Email;
        const phone = row.phone || row.Phone;
        
        if (name) customerDetails.push(`Name: ${name}`);
        if (email) customerDetails.push(`Email: ${email}`);
        if (phone) customerDetails.push(`Phone: ${phone}`);
        
        errorMessage = `Duplicate customer entry at row ${rowNumber}${customerDetails.length > 0 ? ' - ' + customerDetails.join(', ') : ''}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Import data from a backup file
 */
export const importBackup = async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const workbook = new ExcelJS.Workbook();
  const buffer = req.file.buffer;

  try {
    await workbook.xlsx.load(buffer);
    
    const results: ImportResults = {
      customers: { success: 0, failed: 0, errors: [] },
      dogs: { success: 0, failed: 0, errors: [] },
      appointments: { success: 0, failed: 0, errors: [] },
      appointmentDogs: { success: 0, failed: 0, errors: [] },
      additionalHours: { success: 0, failed: 0, errors: [] },
      dogDogbreeds: { success: 0, failed: 0, errors: [] },
      serviceAppointmentDogs: { success: 0, failed: 0, errors: [] }
    };

    // Track missing sheets
    const missingSheets: string[] = [];
    
    // Check for expected tables that aren't in the workbook
    NON_STATIC_TABLES.forEach(tableName => {
      if (!workbook.getWorksheet(tableName)) {
        missingSheets.push(tableName);
      }
    });

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

      // Map table names to results object keys
      const tableMapping: Record<string, keyof ImportResults> = {
        'customer': 'customers',
        'dog': 'dogs',
        'appointment': 'appointments',
        'appointmentdog': 'appointmentDogs',
        'additionalhour': 'additionalHours',
        'dogdogbreed': 'dogDogbreeds',
        'serviceappointmentdog': 'serviceAppointmentDogs'
      };

      const resultKey = tableMapping[tableNameLower];
      if (!resultKey) {
        console.warn(`Unknown table type: ${tableName}`);
        continue;
      }

      const tableResults = results[resultKey];
      if (!tableResults) {
        console.warn(`No results object for table ${tableName}`);
        continue;
      }

      // Process each row in the table
      const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            // Use convertNullValue to properly handle special fields like IsPaidInCash
            rowData[header] = convertNullValue(cell.value, header);
          }
        });

        // Process the row and handle the result
        // Pass the actual Excel row number (add 2 because we start from row 2 and i is 0-based)
        const result = await processTableRow(tableName, rowData, i + 2);
        if (result.success) {
          tableResults.success++;
        } else {
          tableResults.failed++;
          tableResults.errors.push({
            message: result.error || 'Unknown error',
            details: rowData,
            errorType: 'ProcessingError'
          });
        }
      }
    }

    // Prepare response
    const response = {
      message: 'Import completed successfully',
      report: {
        summary: {
          total: {
            success: Object.values(results).reduce((sum, r) => sum + r.success, 0),
            failed: Object.values(results).reduce((sum, r) => sum + r.failed, 0)
          },
          tables: Object.entries(results).reduce((acc, [key, value]) => ({
            ...acc,
            [key.charAt(0).toUpperCase() + key.slice(1)]: {
              success: value.success,
              failed: value.failed
            }
          }), {}),
          missingSheets
        },
        errorsByTable: Object.entries(results)
          .filter(([_, value]) => value.failed > 0)
          .map(([key, value]) => ({
            tableName: key.charAt(0).toUpperCase() + key.slice(1),
            count: value.failed,
            items: value.errors
          }))
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import backup',
      details: error.message 
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

/**
 * Import data from a Google Drive backup file
 */
export const importDriveBackup = async (req: Request, res: Response) => {
  const { fileId } = req.body;
  
  if (!fileId) {
    return res.status(400).json({ error: 'No file ID provided' });
  }

  try {
    // Download the file from Google Drive as a buffer
    const fileBuffer = await downloadFromDrive(fileId, req);
    
    // Create a workbook from the buffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    const results: ImportResults = {
      customers: { success: 0, failed: 0, errors: [] },
      dogs: { success: 0, failed: 0, errors: [] },
      appointments: { success: 0, failed: 0, errors: [] },
      appointmentDogs: { success: 0, failed: 0, errors: [] },
      additionalHours: { success: 0, failed: 0, errors: [] },
      dogDogbreeds: { success: 0, failed: 0, errors: [] },
      serviceAppointmentDogs: { success: 0, failed: 0, errors: [] }
    };

    // Track missing sheets
    const missingSheets: string[] = [];
    
    // Check for expected tables that aren't in the workbook
    NON_STATIC_TABLES.forEach(tableName => {
      if (!workbook.getWorksheet(tableName)) {
        missingSheets.push(tableName);
      }
    });

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

      // Map table names to results object keys
      const tableMapping: Record<string, keyof ImportResults> = {
        'customer': 'customers',
        'dog': 'dogs',
        'appointment': 'appointments',
        'appointmentdog': 'appointmentDogs',
        'additionalhour': 'additionalHours',
        'dogdogbreed': 'dogDogbreeds',
        'serviceappointmentdog': 'serviceAppointmentDogs'
      };

      const resultKey = tableMapping[tableNameLower];
      if (!resultKey) {
        console.warn(`Unknown table type: ${tableName}`);
        continue;
      }

      const tableResults = results[resultKey];
      if (!tableResults) {
        console.warn(`No results object for table ${tableName}`);
        continue;
      }

      // Process each row in the table
      for (const row of worksheet.getRows(2, worksheet.rowCount - 1) || []) {
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            // Use convertNullValue to properly handle special fields like IsPaidInCash
            rowData[header] = convertNullValue(cell.value, header);
          }
        });

        // Process the row and handle the result
        const result = await processTableRow(tableName, rowData, row.number);
        if (result.success) {
          tableResults.success++;
        } else {
          tableResults.failed++;
          tableResults.errors.push({
            message: result.error || 'Unknown error',
            details: rowData,
            errorType: 'ProcessingError'
          });
        }
      }
    }

    // Prepare the response
    const response = {
      message: 'Import completed successfully',
      report: {
        summary: {
          total: {
            success: Object.values(results).reduce((sum, r) => sum + r.success, 0),
            failed: Object.values(results).reduce((sum, r) => sum + r.failed, 0)
          },
          tables: Object.entries(results).reduce((acc, [key, value]) => ({
            ...acc,
            [key.charAt(0).toUpperCase() + key.slice(1)]: {
              success: value.success,
              failed: value.failed
            }
          }), {}),
          missingSheets
        },
        errorsByTable: Object.entries(results)
          .filter(([_, value]) => value.failed > 0)
          .map(([key, value]) => ({
            tableName: key.charAt(0).toUpperCase() + key.slice(1),
            count: value.failed,
            items: value.errors
          }))
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import backup',
      details: error.message 
    });
  }
};

/**
 * Preview data from a Google Drive backup file
 */
export const previewDriveBackup = async (req: Request, res: Response) => {
  const { fileId } = req.body;
  
  if (!fileId) {
    return res.status(400).json({ error: 'No file ID provided' });
  }

  try {
    // Download the file from Google Drive as a buffer
    const fileBuffer = await downloadFromDrive(fileId, req);
    
    // Create a workbook from the buffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    
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

      // Process each row
      const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
      preview[tableName] = rows.map((row, index) => {
        const rowData: any = {};
        
        // First get the raw CustomerId directly if it exists
        const customerIdIndex = headers.findIndex(h => 
          typeof h === 'string' && h.toLowerCase() === 'customerid'
        );
        const rawCustomerId = customerIdIndex !== -1 ? row.getCell(customerIdIndex + 1).text : null;
        if (rawCustomerId && rawCustomerId.trim() !== '') {
          // Convert potential numeric string to number for database
          rowData['CustomerId'] = isNaN(Number(rawCustomerId)) ? rawCustomerId : Number(rawCustomerId);
        }
        
        // Then populate the rest of the fields
        headers.forEach((header, colIndex) => {
          if (header.toLowerCase() !== 'customerid') { // Skip the CustomerId field as we've handled it
            const cell = row.getCell(colIndex + 1);
            let value;
            
            // Check cell type to handle different types of data correctly
            if (cell.type === 4) { // DateValue enum in ExcelJS
              // Handle date values
              value = cell.value; // Get the Date object
            } else if (cell.type === 2 && typeof cell.value === 'number') { // NumberValue enum
              // For numeric values, check if this might be a time value (for time columns)
              const headerName = header.toLowerCase();
              if (headerName.includes('time') || headerName.includes('start') || headerName.includes('end')) {
                // If the value is small (less than 1), it's likely a time value (fraction of day)
                if (cell.value < 1) {
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
 * Generate a data backup of all non-static tables
 */
export const generateBackup = async (req: Request, res: Response | Writable) => {
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
    
    // Set response headers if this is a direct response
    if ('setHeader' in res) {
      const date = new Date().toISOString().split('T')[0];
      const filename = `4loki_backup_${date}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    }
    
    // Write to response using the provided write function
    await workbook.xlsx.write(res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error('Error generating backup:', error);
    throw new AppError('Failed to generate backup', 500);
  }
}; 