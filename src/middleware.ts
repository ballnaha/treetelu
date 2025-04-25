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
      console.log('Middleware: No auth token found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // ไม่ตรวจสอบ token ใน middleware เนื่องจากข้อจำกัดของ Edge Runtime
    // แทนที่จะตรวจสอบที่นี่ เราจะใช้ API /api/admin/check-auth ตรวจสอบในหน้า client แทน
    console.log('Middleware: Auth token found, allowing access to admin page');
    return NextResponse.next();
  }
  
  // For non-admin paths, proceed normally
  return NextResponse.next();
}
