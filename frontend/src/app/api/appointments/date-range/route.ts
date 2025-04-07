import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'startDate and endDate parameters are required',
          message: 'Please provide both start and end dates in YYYY-MM-DD format'
        },
        { status: 400 }
      );
    }
    
    // Log the request for debugging
    console.log(`Fetching appointments from ${startDate} to ${endDate}`);
    console.log(`Base URL: ${BASE_URL}`);
    
    // Construct the URL properly
    const url = `${BASE_URL}/api/v1/appointments/date-range?startDate=${startDate}&endDate=${endDate}`;
    console.log(`Full URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 0 } // Don't cache this request
      });

      if (!response.ok) {
        console.error(`Failed to fetch appointments: ${response.status} ${response.statusText}`);
        
        // Try to get error details
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch (e) {
          errorDetails = 'Could not parse error response';
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: `Failed to fetch appointments: ${response.status}`,
            message: `The API returned an error: ${response.statusText}`,
            details: errorDetails
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Validate that we got an array
      if (!Array.isArray(data)) {
        console.error('API did not return an array:', data);
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid response format',
            message: 'The API did not return an array of appointments',
            details: JSON.stringify(data)
          },
          { status: 500 }
        );
      }
      
      console.log(`Retrieved ${data.length} appointments`);
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error(`Network error fetching appointments:`, fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Network error',
          message: 'Failed to connect to the appointments API',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error in appointments date-range API:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Server error',
        message: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 