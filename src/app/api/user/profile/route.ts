import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// สร้าง schema สำหรับตรวจสอบข้อมูลส่วนตัว
const profileSchema = z.object({
  firstName: z.string().min(1, "กรุณาระบุชื่อ"),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล")
  // ไม่มีฟิลด์อื่นใน schema ของ users
});

/**
 * GET - ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
 */
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const authResult = await validateUser(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { message: 'กรุณาล็อกอินก่อนใช้งาน' },
        { status: 401 }
      );
    }
    
    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await prisma.users.findUnique({
      where: {
        id: Number(authResult.userId)
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        isAdmin: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' },
      { status: 500 }
    );
  }
}

/**
 * PUT - อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
 */
export async function PUT(request: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const authResult = await validateUser(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { message: 'กรุณาล็อกอินก่อนใช้งาน' },
        { status: 401 }
      );
    }
    
    // รับข้อมูลที่ส่งมา
    const body = await request.json();
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูล
      const validatedData = profileSchema.parse(body);
      
      // อัปเดตข้อมูลในฐานข้อมูล
      const updatedUser = await prisma.users.update({
        where: {
          id: Number(authResult.userId)
        },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          isAdmin: true
        }
      });
      
      return NextResponse.json({ 
        message: 'อัปเดตข้อมูลสำเร็จ',
        user: updatedUser 
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { message: 'ข้อมูลไม่ถูกต้อง', errors: validationError.errors },
          { status: 400 }
        );
      }
      
      throw validationError;
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์' },
      { status: 500 }
    );
  }
} 