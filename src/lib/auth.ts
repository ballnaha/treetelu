import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

interface DecodedToken {
  id: string | number;
  email: string;
  name?: string;
  isAdmin: boolean | 'true' | 'false';
  iat: number;
  exp: number;
}

/**
 * ฟังก์ชันสำหรับตรวจสอบสิทธิ์ admin ที่ใช้ในฝั่ง server
 * สามารถใช้กับ API route handlers ได้
 */
export async function validateAdminUser(request: NextRequest): Promise<{
  isAdmin: boolean;
  userId?: string | number;
  error?: string;
}> {
  try {
    // ดึง token จาก header ก่อน
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // ถ้าไม่มีใน header ให้ดึงจาก cookie
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }
    
    // ถ้าไม่มี token ทั้งใน header และ cookie แสดงว่าไม่ใช่ admin
    if (!token) {
      console.log('No auth token found in header or cookie');
      return { isAdmin: false, error: 'ไม่พบ token การยืนยันตัวตน' };
    }
    
    // ตรวจสอบ token
    const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    const isAdmin = typeof decoded.isAdmin === 'boolean'
      ? decoded.isAdmin
      : decoded.isAdmin === 'true';
    
    if (!isAdmin) {
      return { isAdmin: false, error: 'ไม่มีสิทธิ์เข้าถึงข้อมูล admin' };
    }
    
    // ส่งข้อมูลกลับไปหาก user เป็น admin
    return { 
      isAdmin: true,
      userId: decoded.id
    };
    
  } catch (error) {
    console.error('Admin validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { isAdmin: false, error: errorMessage };
  }
} 