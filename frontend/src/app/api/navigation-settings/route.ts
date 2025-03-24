import { NextResponse } from 'next/server';
import { API_URL } from '@/config/api';

export async function GET() {
  try {
    const url = `${API_URL}/api/navigation-settings`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch navigation settings: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching navigation settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch navigation settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = `${API_URL}/api/navigation-settings`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save navigation settings: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving navigation settings:', error);
    return NextResponse.json(
      { message: 'Failed to save navigation settings' },
      { status: 500 }
    );
  }
} 