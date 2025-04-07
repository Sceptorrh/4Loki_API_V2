import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get('day');
    const hour = searchParams.get('hour');
    
    if (!day || !hour) {
      return NextResponse.json(
        { message: 'Day and hour parameters are required' },
        { status: 400 }
      );
    }
    
    // Get all travel times
    const url = `${BASE_URL}/api/v1/travel-times`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 } // Don't cache this request
    });

    if (!response.ok) {
      console.error(`Failed to fetch travel times: ${response.status}`);
      return NextResponse.json(
        { message: `Failed to fetch travel times: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter by day and hour
    const dayNum = parseInt(day);
    const hourNum = parseInt(hour);
    
    const filteredData = data.filter((time: any) => 
      time.Day === dayNum && time.Hour === hourNum
    );
    
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error(`Error fetching travel times by day and hour:`, error);
    return NextResponse.json(
      { message: `Error fetching travel times: ${error}` },
      { status: 500 }
    );
  }
} 