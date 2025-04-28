import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema validation สำหรับข้อมูลผู้ใช้
const userUpdateSchema = z.object({
  firstName: z.string().min(1, { message: 'กรุณาระบุชื่อ' }),
  lastName: z.string().min(1, { message: 'กรุณาระบุนามสกุล' }),
  isAdmin: z.enum(['true', 'false']),
  emailVerified: z.boolean().optional(),
});

/**
 * GET handler สำหรับดึงข้อมูลผู้ใช้รายบุคคล (Admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const userId = params.id;
    
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { success: false, message: 'รหัสผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});

/**
 * PUT handler สำหรับอัปเดตข้อมูลผู้ใช้ (Admin only)
 */
export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const userId = params.id;
    
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { success: false, message: 'รหัสผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // รับข้อมูลที่ส่งมา
    const body = await req.json();
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูล
      const validatedData = userUpdateSchema.parse(body);
      
      // เตรียมข้อมูลสำหรับอัปเดต
      const updateData: any = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        isAdmin: validatedData.isAdmin
      };
      
      // หากมีการส่งค่า emailVerified มา ให้อัปเดต emailVerifiedAt
      if (validatedData.emailVerified !== undefined) {
        updateData.emailVerifiedAt = validatedData.emailVerified ? new Date() : null;
      }
      
      // อัปเดตข้อมูลในฐานข้อมูล
      const updatedUser = await prisma.users.update({
        where: { id: parseInt(userId) },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          emailVerifiedAt: true
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว',
        user: updatedUser
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'ข้อมูลไม่ถูกต้อง', 
            errors: validationError.errors 
          },
          { status: 400 }
        );
      }
      
      throw validationError;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}); 