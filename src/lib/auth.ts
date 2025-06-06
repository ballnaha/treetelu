import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import { compare } from 'bcryptjs';

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
      : String(decoded.isAdmin) === 'true';
    
    if (!isAdmin) {
      console.log('User is not admin:', decoded);
      return { isAdmin: false, error: 'ไม่มีสิทธิ์เข้าถึงข้อมูล admin' };
    }
    
    console.log('User is authorized as admin:', decoded.id);
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

/**
 * ฟังก์ชันสำหรับตรวจสอบการเข้าสู่ระบบของผู้ใช้ทั่วไป (ไม่จำเป็นต้องเป็น admin)
 * สามารถใช้กับ API route handlers ได้
 */
export async function validateUser(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  userId?: string | number;
  email?: string;
  isAdmin?: boolean;
  error?: string;
}> {
  try {
    // ดึง token จาก header ก่อน
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // ถ้าไม่มีใน header ให้ดึงจาก cookie
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }
    
    // ถ้าไม่มี token ทั้งใน header และ cookie แสดงว่ายังไม่ได้ล็อกอิน
    if (!token) {
      console.log('No auth token found in header or cookie');
      return { isAuthenticated: false, error: 'ไม่พบ token การยืนยันตัวตน' };
    }
    
    // ตรวจสอบ token
    const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    
    // ตรวจสอบว่าเป็น admin หรือไม่ (เพื่อส่งข้อมูลกลับไป)
    const isAdmin = typeof decoded.isAdmin === 'boolean'
      ? decoded.isAdmin
      : String(decoded.isAdmin) === 'true';
    
    // ส่งข้อมูลผู้ใช้กลับไป
    return { 
      isAuthenticated: true,
      userId: decoded.id,
      email: decoded.email,
      isAdmin: isAdmin
    };
    
  } catch (error) {
    console.error('User validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { isAuthenticated: false, error: errorMessage };
  }
}

/**
 * ฟังก์ชันสำหรับตรวจสอบการเข้าสู่ระบบและสิทธิ์แอดมินในฝั่งไคลเอนต์
 * จะทำการ redirect ไปยังหน้า login หรือหน้าหลักตามสถานะของผู้ใช้
 */
export const checkAdminAuth = (
  user: any, 
  router: any, 
  getAuthToken: () => string | null
): { isChecking: boolean } => {
  // ถ้าไม่มีข้อมูลผู้ใช้ หรือไม่มี token
  if (!user || !getAuthToken()) {
    console.log('No user or token, redirecting to login page');
    router.push('/login');
    return { isChecking: true }; // กำลังตรวจสอบและ redirect
  }
  
  // ถ้ามีข้อมูลผู้ใช้ แต่ไม่ใช่แอดมิน
  if (!user.isAdmin) {
    console.log('User is not admin, redirecting to home page');
    router.push('/');
    return { isChecking: true }; // กำลังตรวจสอบและ redirect
  }
  
  return { isChecking: false }; // ผ่านการตรวจสอบ
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'อีเมล', type: 'email' },
        password: { label: 'รหัสผ่าน', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !(await compare(credentials.password, user.password))) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}; 