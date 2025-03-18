import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET() {
  const url = `${API_URL}/navigation-settings/api-key`;
  
  console.log(`Making request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 } // Don't cache this request
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      return NextResponse.json(
        { apiKey: null, message: `API request failed with status: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching API key: ${error}`);
    return NextResponse.json(
      { apiKey: null, message: `Error fetching API key: ${error}` },
      { status: 500 }
    );
  }
} 