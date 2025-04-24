import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, users_isAdmin, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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

// Define validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    // Validate with Zod schema
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.errors;
      return NextResponse.json(
        { 
          error: errors[0].message || 'กรุณากรอกข้อมูลให้ครบถ้วน',
          errors: errors
        },
        { status: 400 }
      );
    }
    
    const { firstName, lastName, email, password } = result.data;
    console.log('Registration attempt:', { firstName, lastName, email });
    
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      // Create new user with properly typed data
      const newUser = await prisma.users.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          isAdmin: users_isAdmin.false // ให้เป็น false เพื่อความปลอดภัย
        }
      });
      
      console.log('User created successfully:', newUser.id);
      
      // Remove sensitive data from response
      const userResponse = {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        isAdmin: String(newUser.isAdmin) === 'true'
      };
      
      return NextResponse.json(
        { 
          success: true,
          message: 'สมัครสมาชิกสำเร็จ', 
          user: userResponse
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      
      // Handle unique constraint violation
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' },
            { status: 400 }
          );
        }
      }
      
      // Log the full error for debugging
      console.error('Full database error:', JSON.stringify(dbError, null, 2));
      
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}