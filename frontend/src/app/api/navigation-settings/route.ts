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
  // Extract base URL from API_URL (remove any trailing path)
  const baseUrl = API_URL.split('/api')[0];
  const url = `${baseUrl}/api/navigation-settings`;
  
  try {
    const body = await request.json();
    console.log(`Making POST request to: ${url} with body:`, JSON.stringify(body, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`POST response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed with status: ${response.status}, URL: ${url}, Response: ${errorText}`);
      return NextResponse.json(
        { message: `Failed to save settings: ${response.status}. Response: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`POST response data:`, data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error saving navigation settings:`, error);
    return NextResponse.json(
      { message: `Error saving navigation settings: ${error}` },
      { status: 500 }
    );
  }
} 