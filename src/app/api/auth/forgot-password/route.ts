import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { validateEmail } from '@/utils/validationUtils';
import crypto from 'crypto';
import { Resend } from 'resend';

// ตั้งค่า Resend API
const resend = new Resend(process.env.RESEND_API_KEY);

// สคีมาสำหรับตรวจสอบข้อมูลที่ส่งมา
const forgotPasswordSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง')
});

/**
 * POST - รับคำขอลืมรหัสผ่าน
 */
export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลจากคำขอ
    const body = await request.json();
    
    // ตรวจสอบความถูกต้องของข้อมูล
    try {
      forgotPasswordSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, message: 'ข้อมูลไม่ถูกต้อง', errors: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
    const { email } = body;
    
    // ตรวจสอบว่ามีผู้ใช้งานที่ใช้อีเมลนี้หรือไม่
    const user = await prisma.users.findUnique({
      where: { email }
    });
    
    // ถ้าไม่พบผู้ใช้งาน ให้ส่งข้อความสำเร็จเหมือนกัน (เพื่อความปลอดภัย)
    if (!user) {
      console.log(`Reset password requested for non-existent email: ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'ถ้าอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้' 
      });
    }
    
    // สร้างโทเค็นรีเซ็ตรหัสผ่าน
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // กำหนดเวลาหมดอายุของโทเค็น (1 ชั่วโมง) เป็นเวลา UTC+7 (ประเทศไทย)
    const now = new Date();
    // สร้างวัตถุ Date ใหม่ที่ระบุเวลาในโซนเวลา UTC+7 (ประเทศไทย)
    const thaiTimeOffset = 7 * 60; // ประเทศไทย UTC+7 (7 ชั่วโมง คิดเป็นนาที)
    const tokenExpires = new Date(now.getTime() + 60 * 60 * 1000); // เพิ่ม 1 ชั่วโมง
    
    // ปรับค่า offset ในหน่วยนาทีให้เป็น UTC+7
    tokenExpires.setMinutes(tokenExpires.getMinutes() + thaiTimeOffset);
    
    console.log('Token expires at (Thailand time, UTC+7):', tokenExpires.toISOString());
    
    // ลบข้อมูลรีเซ็ตรหัสผ่านเดิม (ถ้ามี)
    await prisma.$executeRaw`
      DELETE FROM password_resets WHERE userId = ${user.id}
    `;
    
    // บันทึกโทเค็นลงในฐานข้อมูล
    await prisma.$executeRaw`
      INSERT INTO password_resets (userId, token, expiresAt, createdAt, updatedAt)
      VALUES (
        ${user.id}, 
        ${resetToken}, 
        ${tokenExpires}, 
        NOW(), 
        NOW()
      )
    `;
    
    // สร้าง URL สำหรับรีเซ็ตรหัสผ่าน
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // สร้าง HTML สำหรับอีเมล
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #24B493;">รีเซ็ตรหัสผ่าน</h1>
        
        <p>สวัสดีคุณ ${user.firstName} ${user.lastName},</p>
        
        <p>เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ คลิกที่ลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #24B493; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            รีเซ็ตรหัสผ่าน
          </a>
        </div>
        
        <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
        
        <p>ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน คุณสามารถละเลยอีเมลนี้ได้</p>
        
        <p style="color: #666; font-style: italic; margin-top: 30px;">
          ขอแสดงความนับถือ,<br>
          ทีมงาน TreeTelu ทรีเตลู - ต้นไม้ในกระถาง
        </p>
      </div>
    `;
    
    try {
      // ส่งอีเมล
      const { data, error } = await resend.emails.send({
        from: 'TreeTelu - ต้นไม้ในกระถาง <no-reply@treetelu.com>',
        to: email,
        subject: 'รีเซ็ตรหัสผ่าน | TreeTelu',
        html: htmlContent,
      });
      
      console.log('Email sent status:', data ? 'success' : 'failed');
      if (error) {
        console.error('Error sending reset password email:', error);
      }
    } catch (emailError) {
      console.error('Failed to send reset password email:', emailError);
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการส่งอีเมล' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ'
    });
    
  } catch (error) {
    console.error('Error in forgot password endpoint:', error);
    
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    );
  }
} 