import { NextRequest, NextResponse } from 'next/server';
import { syncTravelAndCleaningTimes } from '@/lib/actions/additionalHoursActions';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'startDate and endDate are required',
          details: 'Please provide both start and end dates in YYYY-MM-DD format'
        },
        { status: 400 }
      );
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid date format',
          details: 'Dates must be in YYYY-MM-DD format'
        },
        { status: 400 }
      );
    }
    
    // Execute the sync action
    const result = await syncTravelAndCleaningTimes(startDate, endDate);
    
    return NextResponse.json({
      success: true,
      ...result,
      message: `Successfully processed ${result.processedDates} dates: ${result.travelTimesAdded} travel times added, ${result.travelTimesUpdated} updated, ${result.cleaningTimesAdded} cleaning times added`
    });
  } catch (error) {
    console.error('Error syncing travel and cleaning times:', error);
    
    // Provide a user-friendly error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    const detailedMessage = error instanceof Error && error.stack 
      ? error.stack.split('\n').slice(0, 3).join('\n')
      : 'No detailed information available';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync travel and cleaning times',
        message: errorMessage,
        details: detailedMessage
      },
      { status: 500 }
    );
  }
} 