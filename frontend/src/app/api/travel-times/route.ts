import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;

export async function GET() {
  try {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching travel times:`, error);
    return NextResponse.json(
      { message: `Error fetching travel times: ${error}` },
      { status: 500 }
    );
  }
} 