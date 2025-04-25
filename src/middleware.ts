import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// Interface for decoded token
interface DecodedToken {
  id: string | number;
  email: string;
  isAdmin: boolean | 'true' | 'false';
  iat: number;
  exp: number;
}

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
  
  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // For the login page, we'll allow access regardless of token status
  // This prevents redirect loops and allows users to log in again if needed
  if (pathname === '/login') {
    // Continue to login page without redirecting
    return NextResponse.next();
  }
  
  // Check if the requested path is an admin path
  if (adminPaths.some(path => pathname.startsWith(path))) {
    // Check for auth token
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token is found, redirect to login page
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Verify and decode the token
      const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';
      const decoded = verify(token, JWT_SECRET) as DecodedToken;
      
      // Check if user is admin
      const isAdmin = decoded.isAdmin === true || decoded.isAdmin === 'true';
      
      if (!isAdmin) {
        // If not admin, redirect to home page
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // If admin, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // If token verification fails, redirect to login page
      console.error('Admin auth error in middleware:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // For non-admin paths, proceed normally
  return NextResponse.next();
}
