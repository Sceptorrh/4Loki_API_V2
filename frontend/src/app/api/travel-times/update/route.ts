import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(`Making travel times update request with:`, JSON.stringify(body, null, 2));
    
    const url = `${BASE_URL}/api/v1/travel-times/update`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Travel times update failed with status: ${response.status}`);
      return NextResponse.json(
        { message: `Failed to update travel times: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating travel times:`, error);
    return NextResponse.json(
      { message: `Error updating travel times: ${error}` },
      { status: 500 }
    );
  }
} 