import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface GoogleContact {
  names?: Array<{
    displayName?: string;
  }>;
  emailAddresses?: Array<{
    value?: string;
  }>;
  phoneNumbers?: Array<{
    value?: string;
  }>;
}

export async function GET(request: Request) {
  try {
    // Get the token from the cookie
    const cookieStore = cookies();
    const token = cookieStore.get('google_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Send search request
    const response = await axios.get(
      'https://people.googleapis.com/v1/people:searchContacts',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          query: query,
          readMask: 'names,emailAddresses,phoneNumbers',
          pageSize: 100
        }
      }
    );

    return NextResponse.json({
      contacts: response.data.results || []
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch contacts',
          details: error.response?.data?.error?.message || error.message
        },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
} 