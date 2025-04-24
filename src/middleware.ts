import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware function
 * This runs before any route is processed
 */
export function middleware(request: NextRequest) {
  // Define admin-only paths
  const adminPaths = [
    '/admin',
    '/admin/orders',
    '/admin/products',
    '/admin/users',
    '/admin/categories',
  ];
  
  // Get the pathname from the request URL
  const { pathname } = request.nextUrl;
  
  // Check if user is logged in
  const token = request.cookies.get('auth_token')?.value;
  const isLoggedIn = !!token;
  
  // If user is logged in and trying to access login page, redirect to home page
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Check if the requested path is an admin path
  if (adminPaths.some(path => pathname.startsWith(path))) {
    // Check for auth token
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token is found, redirect to login page
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // For middleware, we'll just check if the token exists
    // The actual admin verification will happen in the API routes
    // This is because the Edge Runtime doesn't support the crypto module
    
    // Allow the request to proceed
    return NextResponse.next();
  }
  
  // For non-admin paths, proceed normally
  return NextResponse.next();
}
