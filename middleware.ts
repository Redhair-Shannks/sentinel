import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export function middleware(request: NextRequest) {
  // Check for public routes
  const publicRoutes = [
    "/landing",
    "/sign-in",
    "/sign-up",
    "/auth-callback",
    "/api/getTranscript",
    "/api/summary",
    "/api/webhook",
    "/api/auth-status",
    "/api/user"
  ];
  
  // Check for static files in landing directory
  const isLandingAsset = request.nextUrl.pathname.startsWith('/landing/');
  
  // Check for static files
  const isStaticFile = request.nextUrl.pathname.match(
    /\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|ico|html|json)$/i
  ) || request.nextUrl.pathname.startsWith('/_next/');
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(`${route}/`)
  );
  
  // Allow public routes, landing assets and static files
  if (isPublicRoute || isStaticFile || isLandingAsset) {
    return NextResponse.next();
  }
  
  // Home page redirects to landing
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Check for session cookie in request headers - enhanced detection
  const cookieHeader = request.headers.get('cookie') || '';
  
  // Look for ANY Clerk-related cookies
  const isAuthenticated = 
    cookieHeader.includes('__session') || 
    cookieHeader.includes('__clerk') || 
    cookieHeader.includes('__client');
  
  // For debugging - log cookie info to server console
  console.log(`Auth check for ${request.nextUrl.pathname} - Result: ${isAuthenticated}`);
  
  // Protected routes - check authentication
  if (!isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    // Add a redirect_url parameter
    signInUrl.searchParams.set("redirect_url", "/auth-callback");
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and API routes
    "/((?!_next|api/getTranscript|api/summary|api/webhook|api/auth-status).*)",
  ],
}; 