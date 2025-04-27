import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// สร้าง schema สำหรับตรวจสอบข้อมูลการเปลี่ยนรหัสผ่าน
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณาระบุรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร"),
  confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่",
  path: ["confirmPassword"],
});

/**
 * POST - เปลี่ยนรหัสผ่านของผู้ใช้ที่ล็อกอินอยู่
 */
export async function POST(request: NextRequest) {
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
      const validatedData = changePasswordSchema.parse(body);
      
      // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
      const user = await prisma.users.findUnique({
        where: {
          id: Number(authResult.userId)
        },
        select: {
          id: true,
          password: true
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { message: 'ไม่พบข้อมูลผู้ใช้' },
          { status: 404 }
        );
      }
      
      // ตรวจสอบรหัสผ่านปัจจุบัน
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
          { status: 400 }
        );
      }
      
      // เข้ารหัสรหัสผ่านใหม่
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      
      // อัปเดตรหัสผ่าน
      await prisma.users.update({
        where: {
          id: Number(authResult.userId)
        },
        data: {
          password: hashedPassword
        }
      });
      
      return NextResponse.json({ 
        message: 'เปลี่ยนรหัสผ่านสำเร็จ'
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
    console.error('Error changing password:', error);
    
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' },
      { status: 500 }
    );
  }
} 