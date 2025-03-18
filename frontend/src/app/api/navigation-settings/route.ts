import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET() {
  const url = `${API_URL}/api/navigation-settings`;
  
  try {
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}, URL: ${url}`);
      return NextResponse.json(
        { message: `API request failed with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error fetching navigation settings: ${error}, URL: ${url}`);
    return NextResponse.json(
      { message: `Error fetching navigation settings: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const url = `${API_URL}/api/navigation-settings`;
  
  try {
    const body = await request.json();
    console.log(`Making POST request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}, URL: ${url}`);
      return NextResponse.json(
        { message: `API request failed with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error saving navigation settings: ${error}, URL: ${url}`);
    return NextResponse.json(
      { message: `Error saving navigation settings: ${error}` },
      { status: 500 }
    );
  }
} 