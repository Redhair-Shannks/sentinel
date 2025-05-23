import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get cookie header directly
  const cookieHeader = request.headers.get('cookie') || '';
  
  // Look for Clerk-related cookies
  const hasClerkCookies = 
    cookieHeader.includes('__session') || 
    cookieHeader.includes('__clerk') || 
    cookieHeader.includes('__client');
  
  // Return authentication status
  return NextResponse.json({
    isAuthenticated: hasClerkCookies,
    cookieHeader,
    hasClerkCookies
  });
} 