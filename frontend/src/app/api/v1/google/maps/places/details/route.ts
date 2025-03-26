import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const place_id = searchParams.get('place_id');

    if (!place_id) {
      return NextResponse.json({ message: 'Place ID is required' }, { status: 400 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/google/maps/places/details?place_id=${encodeURIComponent(place_id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in place details:', error);
    return NextResponse.json(
      { message: 'Failed to get place details' },
      { status: 500 }
    );
  }
} 