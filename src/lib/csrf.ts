import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * สร้าง CSRF token ใหม่
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * ตั้งค่า CSRF token ใน cookie และ return token กลับไป
 */
export function setCsrfTokenCookie(response: NextResponse): string {
  const token = generateCsrfToken();
  
  // ตั้งค่า cookie สำหรับ CSRF token
  response.cookies.set({
    name: 'csrf_token',
    value: token,
    httpOnly: true, // JavaScript ไม่สามารถเข้าถึงได้
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict' // ป้องกัน cookie ถูกส่งในการร้องขอข้ามไซต์
  });
  
  return token;
}

/**
 * ตรวจสอบความถูกต้องของ CSRF token
 * tokenFromHeader - token ที่ส่งมาจาก header หรือ body ของ request
 * tokenFromCookie - token ที่เก็บไว้ใน cookie
 */
export function validateCsrfToken(tokenFromHeader: string, tokenFromCookie: string): boolean {
  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }
  
  return tokenFromHeader === tokenFromCookie;
}

/**
 * ฟังก์ชัน middleware สำหรับตรวจสอบ CSRF token
 * ใช้สำหรับ API routes ที่มีการเปลี่ยนแปลงข้อมูล (POST, PUT, DELETE)
 */
export function csrfProtection(handler: Function) {
  return async (req: Request) => {
    // ตรวจสอบว่าเป็น method ที่ต้องมีการตรวจสอบ CSRF หรือไม่
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      // ไม่จำเป็นต้องตรวจสอบสำหรับ methods ที่อ่านอย่างเดียว
      return handler(req);
    }
    
    // ดึง CSRF token จาก header
    const csrfToken = req.headers.get('X-CSRF-Token');
    
    // ดึง CSRF token จาก cookie
    // ใช้ cookie-parser หรือวิธีอื่นในการดึง cookie จาก request
    const cookieHeader = req.headers.get('cookie');
    let csrfCookie = '';
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      const csrfCookieStr = cookies.find(cookie => cookie.startsWith('csrf_token='));
      if (csrfCookieStr) {
        csrfCookie = csrfCookieStr.split('=')[1];
      }
    }
    
    // ตรวจสอบความถูกต้อง
    if (!validateCsrfToken(csrfToken as string, csrfCookie)) {
      return new Response(
        JSON.stringify({ message: 'การตรวจสอบ CSRF ล้มเหลว กรุณาลองใหม่อีกครั้ง' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // ถ้าตรวจสอบผ่านให้ดำเนินการต่อ
    return handler(req);
  };
} 