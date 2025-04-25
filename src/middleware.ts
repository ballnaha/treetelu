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
    // ดึง token จาก cookie
    const token = request.cookies.get('auth_token')?.value;
    
    // ดึงข้อมูลจาก URL query parameters
    const url = new URL(request.url);
    const authParam = url.searchParams.get('auth');
    const debug = url.searchParams.get('debug');
    
    console.log('Middleware: URL path:', pathname);
    console.log('Middleware: Auth param:', authParam);
    console.log('Middleware: Debug mode:', !!debug);
    console.log('Middleware: Auth token in cookie:', !!token);
    
    // แสดงค่า cookie ทั้งหมดเพื่อการแก้ไขปัญหา
    console.log('Middleware: All cookies:', [...request.cookies.getAll()].map(c => c.name));
    
    // อนุญาตในกรณีมีการใช้ auth=token ใน URL
    if (authParam === 'token') {
      console.log('Middleware: Using token auth mode, allowing access');
      return NextResponse.next();
    }
    
    // อนุญาตในกรณี debug=1
    if (debug === '1') {
      console.log('Middleware: Debug mode enabled, allowing access');
      return NextResponse.next();
    }
    
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
