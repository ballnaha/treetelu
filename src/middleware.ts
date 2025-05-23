import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// อ่าน content type ของไฟล์
function getContentType(filename: string): string {
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else if (filename.endsWith('.png')) {
    return 'image/png';
  } else if (filename.endsWith('.gif')) {
    return 'image/gif';
  } else if (filename.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'application/octet-stream';
}

/**
 * Next.js middleware function
 * This runs before any route is processed
 */
export async function middleware(request: NextRequest) {
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
  
  console.log('Middleware processing path:', pathname);
  
  // ตรวจสอบว่าเป็นการเรียกไฟล์รูปภาพสินค้าหรือไม่
  if (pathname.startsWith('/images/product/') || pathname.startsWith('/images/blog/')) {
    // เลือกประเภทรูปภาพและกำหนด path prefix
    const imageType = pathname.startsWith('/images/product/') ? 'product' : 'blog';
    console.log(`Middleware: Handling ${imageType} image path:`, pathname);
    
    // สร้าง URL ใหม่ที่ชี้ไปที่ API route
    const url = request.nextUrl.clone();
    
    // แยกชื่อไฟล์และ query string
    const segments = pathname.split('/');
    const fileName = segments[segments.length - 1];
    
    // ตรวจสอบว่าชื่อไฟล์มี timestamp หรือไม่ และใช้ประโยชน์จากมัน
    const hasTimestamp = fileName.includes('_') && !isNaN(Number(fileName.split('_')[1]));
    
    // แก้ไข path และคงส่วน query string ไว้
    url.pathname = `/api/image/${pathname.substring(1)}`;
    
    console.log(`Middleware: Rewriting ${imageType} image to:`, url.pathname);
    
    // ตรวจสอบว่าเป็นคำขอจาก browser ที่มี Cache-Control: no-cache หรือไม่
    const cacheControl = request.headers.get('cache-control') || '';
    const noCacheBrowser = cacheControl.includes('no-cache') || cacheControl.includes('max-age=0');
    
    // เพิ่ม Cache-Control header ถ้าไฟล์มี timestamp (immutable)
    const headers = new Headers();
    
    if (hasTimestamp && !noCacheBrowser) {
      // รูปภาพที่มี timestamp ถือว่าเป็น immutable (ไม่เปลี่ยนแปลง)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (noCacheBrowser) {
      // ถ้าเป็นคำขอที่ระบุให้ไม่ใช้ cache
      url.searchParams.set('no-cache', 'true');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // รูปภาพทั่วไป
      headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
    
    // ทำการ rewrite URL พร้อม header
    return NextResponse.rewrite(url, { headers });
  }
  
  if (pathname.startsWith('/uploads/payment-slips/')) {
    console.log('Middleware: Handling payment slip path:', pathname);
    
    // สร้าง URL ใหม่ที่ชี้ไปที่ API route
    const url = request.nextUrl.clone();
    
    // แก้ไข path และคงส่วน query string ไว้
    url.pathname = `/api/image/${pathname.substring(1)}`;
    
    console.log('Middleware: Rewriting to:', url.pathname);
    
    // ตรวจสอบว่าเป็นคำขอจาก browser ที่มี Cache-Control: no-cache หรือไม่
    const cacheControl = request.headers.get('cache-control') || '';
    const noCacheBrowser = cacheControl.includes('no-cache') || cacheControl.includes('max-age=0');
    
    // ถ้าเป็นคำขอที่ระบุให้ไม่ใช้ cache ก็เพิ่ม query parameter
    if (noCacheBrowser) {
      url.searchParams.set('no-cache', 'true');
    }
    
    // ทำการ rewrite URL
    return NextResponse.rewrite(url);
  }
  
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

// กำหนด path patterns ที่จะให้ middleware นี้ทำงาน
export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/images/product/:path*',
    '/images/blog/:path*',
    '/uploads/payment-slips/:path*'
  ],
};
