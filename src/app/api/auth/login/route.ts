import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, users, users_isAdmin } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

// Define SafeUser type for the response
type SafeUser = {
  id: number;
  email: string;
  name: string; // Constructed from firstName and lastName
  isAdmin: users_isAdmin;
  createdAt: Date;
  updatedAt: Date;
};

// Use a single PrismaClient instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to avoid multiple instances during hot reloading
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;
    
    console.log('Login attempt:', { email });
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email }
    });
    
    // Debug: Log isAdmin value from DB
    console.log('user.isAdmin from DB:', user?.isAdmin);
    
    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // Create JWT token with ID converted to string
    const tokenPayload = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };

    const token = sign(tokenPayload, JWT_SECRET, { 
      expiresIn: rememberMe ? '30d' : '24h' 
    });
    
    // Set cookie expiration
    const cookieExpires = new Date();
    cookieExpires.setDate(cookieExpires.getDate() + (rememberMe ? 30 : 1));
    
    // Create safe user object without sensitive data
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    // Format the response
    const response = NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        ...safeUser,
        isAdmin: String(safeUser.isAdmin) === 'true'
      }
    });
    
    // Set cookie in response
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: cookieExpires,
      path: '/'
    });
    
    console.log('Login successful:', email);
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
