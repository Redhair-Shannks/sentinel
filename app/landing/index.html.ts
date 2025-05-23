import { NextRequest, NextResponse } from 'next/server';

// This is a server-side route handler that serves the static HTML
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/landing/index.html', request.url));
} 