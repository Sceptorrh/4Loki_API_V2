import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create the template data
    const templateData = [
      ['Direction', 'Duration', 'Distance', 'Date'],
      ['home_to_work', '30', '10.5', '2024-03-20 08:00:00'],
      ['work_to_home', '35', '11.2', '2024-03-20 17:00:00']
    ];
    
    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Travel Times');
    
    // Generate the Excel file buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Create response with the Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="travel-times-template.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { message: 'Error generating template' },
      { status: 500 }
    );
  }
} 