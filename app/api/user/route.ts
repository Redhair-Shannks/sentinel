import { NextRequest, NextResponse } from 'next/server';

// Simple API endpoint to verify auth
export async function GET(request: NextRequest) {
  // Check for session cookie in request headers
  const cookieHeader = request.headers.get('cookie') || '';
  const hasSessionCookie = cookieHeader.includes('__session=') || cookieHeader.includes('__clerk_db_jwt=');
  
  if (!hasSessionCookie) {
    return NextResponse.json(
      { error: "Unauthorized", isSignedIn: false },
      { status: 401 }
    );
  }

  // User has authentication cookies
  return NextResponse.json({
    username: "User", 
    isSignedIn: true
  });
} 