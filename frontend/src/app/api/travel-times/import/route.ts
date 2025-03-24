import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ExcelRow {
  Direction: string;
  Duration: number;
  Distance: number;
  Date: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;

function convertExcelDate(excelDate: number): Date {
  // Excel's date system has two epochs:
  // 1. 1900 date system (most common)
  // 2. 1904 date system (less common, mainly used in older Mac Excel versions)
  
  // We'll use the 1900 system
  const daysOffset = 25569; // Days between 1900-01-01 and 1970-01-01
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
  return new Date((excelDate - daysOffset) * millisecondsPerDay);
}

function formatDate(date: Date): string {
  // Format date as YYYY-MM-DD HH:mm:ss
  return date.toISOString()
    .replace('T', ' ')    // Replace T with space
    .replace(/\.\d+Z$/, ''); // Remove milliseconds and timezone
}

function validateRow(row: Record<string, unknown>, rowIndex: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for missing fields
  if (!row.Direction) {
    errors.push(`Row ${rowIndex + 1}: Missing Direction`);
  } else if (!['home_to_work', 'work_to_home'].includes(String(row.Direction))) {
    errors.push(`Row ${rowIndex + 1}: Invalid Direction "${row.Direction}". Must be "home_to_work" or "work_to_home"`);
  }

  if (!row.Duration) {
    errors.push(`Row ${rowIndex + 1}: Missing Duration`);
  } else if (isNaN(Number(row.Duration)) || Number(row.Duration) <= 0) {
    errors.push(`Row ${rowIndex + 1}: Invalid Duration "${row.Duration}". Must be a positive number`);
  }

  if (!row.Distance) {
    errors.push(`Row ${rowIndex + 1}: Missing Distance`);
  } else if (isNaN(Number(row.Distance)) || Number(row.Distance) < 0) {
    errors.push(`Row ${rowIndex + 1}: Invalid Distance "${row.Distance}". Must be a non-negative number`);
  }

  if (!row.Date) {
    errors.push(`Row ${rowIndex + 1}: Missing Date`);
  } else {
    // Try to handle both Excel numeric dates and regular date strings
    let validDate: Date | null = null;
    
    if (typeof row.Date === 'number') {
      // Handle Excel numeric date
      validDate = convertExcelDate(row.Date);
    } else {
      // Handle string date
      validDate = new Date(String(row.Date));
    }
    
    if (isNaN(validDate.getTime())) {
      errors.push(`Row ${rowIndex + 1}: Invalid Date "${row.Date}". Must be a valid date`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    if (rawData.length === 0) {
      return NextResponse.json(
        { message: 'Excel file is empty or contains no data rows' },
        { status: 400 }
      );
    }

    // Validate headers
    const expectedHeaders = ['Direction', 'Duration', 'Distance', 'Date'];
    const actualHeaders = Object.keys(rawData[0]);
    const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { message: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate all rows
    const allErrors: string[] = [];
    const validRows: ExcelRow[] = [];

    rawData.forEach((row, index) => {
      const validation = validateRow(row, index);
      if (!validation.isValid) {
        allErrors.push(...validation.errors);
      } else {
        // Convert Excel date to ISO string format if it's a number
        const dateValue = typeof row.Date === 'number' 
          ? formatDate(convertExcelDate(row.Date))
          : String(row.Date);

        validRows.push({
          Direction: String(row.Direction),
          Duration: Number(row.Duration),
          Distance: Number(row.Distance),
          Date: dateValue
        });
      }
    });

    if (allErrors.length > 0) {
      return NextResponse.json(
        { 
          message: 'Validation errors found in Excel file:',
          errors: allErrors
        },
        { status: 400 }
      );
    }

    // Send data to backend
    const response = await fetch(`${BASE_URL}/api/v1/travel-times/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ travelTimes: validRows }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import travel times');
    }

    // Create a TransformStream to handle the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process the response stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              await writer.write(encoder.encode(line + '\n'));
            }
          }
        }
        await writer.close();
      } catch (error) {
        await writer.abort(error);
      }
    })();

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error importing travel times:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to import travel times' },
      { status: 500 }
    );
  }
} 