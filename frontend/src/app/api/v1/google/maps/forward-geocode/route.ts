import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    const url = `${BASE_URL}/api/v1/google/maps/forward-geocode`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
      credentials: 'include', // Include cookies in the request
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: `Forward geocoding failed with status: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error with forward geocoding request:', error);
    return NextResponse.json(
      { message: `Error with forward geocoding request: ${error}` },
      { status: 500 }
    );
  }
} 