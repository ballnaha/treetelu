import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { setCsrfTokenCookie } from '@/lib/csrf';

// Define SafeUser type for the response
type SafeUser = {
  id: number;
  email: string;
  name: string; // Constructed from firstName and lastName
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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
    const isAdminValue = typeof user.isAdmin === 'boolean' ? user.isAdmin : user.isAdmin === 'true';
    
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      isAdmin: isAdminValue
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
      isAdmin: isAdminValue,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    // Format the response
    const response = NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        ...safeUser,
        isAdmin: safeUser.isAdmin
      },
      token: token
    });
    
    // Set cookie in response
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      expires: cookieExpires,
      path: '/'
    });
    
    // สร้างและตั้งค่า CSRF token
    const csrfToken = setCsrfTokenCookie(response);
    
    // สร้าง response ใหม่ที่มี CSRF token รวมอยู่ใน JSON
    const finalResponse = NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        ...safeUser,
        isAdmin: safeUser.isAdmin
      },
      token: token,
      csrfToken: csrfToken // เพิ่ม CSRF token ใน JSON response
    }, {
      status: 200,
      headers: response.headers,
      statusText: 'OK'
    });
    
    // คัดลอก cookies จาก response เดิม
    response.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie);
    });
    
    console.log('Login successful:', email);
    console.log('Token generated for user');
    console.log('CSRF token generated and included in JSON response');
    
    return finalResponse;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
