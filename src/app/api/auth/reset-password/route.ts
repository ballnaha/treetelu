import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// สคีมาสำหรับตรวจสอบข้อมูลที่ส่งมา
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'ต้องระบุโทเค็น'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านยืนยันไม่ตรงกัน',
  path: ['confirmPassword']
});

/**
 * POST - รีเซ็ตรหัสผ่านของผู้ใช้
 */
export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลจากคำขอ
    const body = await request.json();
    
    // ตรวจสอบความถูกต้องของข้อมูล
    try {
      resetPasswordSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, message: 'ข้อมูลไม่ถูกต้อง', errors: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
    const { token, email, password } = body;
    
    // ตรวจสอบว่ามีผู้ใช้งานที่ใช้อีเมลนี้หรือไม่
    const user = await prisma.users.findUnique({
      where: { email }
    });
    
    // ถ้าไม่พบผู้ใช้
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 400 }
      );
    }
    
    // ดึงข้อมูลการรีเซ็ตรหัสผ่านโดยตรง
    const passwordReset = await prisma.$queryRaw`
      SELECT * FROM password_resets WHERE userId = ${user.id} AND token = ${token}
    `;
    
    // ถ้าไม่พบข้อมูลการรีเซ็ตรหัสผ่าน
    if (!passwordReset || !Array.isArray(passwordReset) || passwordReset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการรีเซ็ตรหัสผ่าน' },
        { status: 400 }
      );
    }
    
    const resetData = passwordReset[0] as any;
    
    // ตรวจสอบว่าโทเค็นหมดอายุหรือไม่
    const now = new Date();
    const expiresAt = new Date(resetData.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, message: 'โทเค็นหมดอายุแล้ว' },
        { status: 400 }
      );
    }
    
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // อัปเดตรหัสผ่านของผู้ใช้
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    // ลบข้อมูลการรีเซ็ตรหัสผ่าน
    await prisma.$executeRaw`
      DELETE FROM password_resets WHERE userId = ${user.id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ'
    });
    
  } catch (error) {
    console.error('Error in reset password endpoint:', error);
    
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    );
  }
} 