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

/**
 * DELETE handler for removing a user by ID (admin only)
 */
export const DELETE = withAdminAuth(async (req: NextRequest, 
  { params }: { params: { id: string } }) => {
  try {
    const userId = params.id;
    
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { success: false, message: 'ต้องระบุรหัสผู้ใช้งานที่ต้องการลบ' },
        { status: 400 }
      );
    }
    
    const userIdNumber = parseInt(userId);
    
    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const user = await prisma.users.findUnique({
      where: { id: userIdNumber }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้งานที่ต้องการลบ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้มีคำสั่งซื้อที่เชื่อมโยงหรือไม่
    try {
      const relatedOrders = await prisma.order.count({
        where: { userId: userIdNumber }
      });
      
      if (relatedOrders > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'ไม่สามารถลบผู้ใช้งานนี้ได้เนื่องจากมีประวัติการสั่งซื้อ',
            details: `ผู้ใช้งานนี้มีคำสั่งซื้อ ${relatedOrders} รายการ`
          },
          { status: 400 }
        );
      }
    } catch (orderError) {
      console.warn('Error checking related orders:', orderError);
      // ถ้าตาราง order ไม่มีอยู่ หรือไม่มี field userId ให้ข้ามไป
    }
    
    // ลบผู้ใช้ด้วย Prisma client โดยตรง
    try {
      await prisma.users.delete({
        where: { id: userIdNumber }
      });
      
      return NextResponse.json({
        success: true,
        message: 'ลบผู้ใช้งานเรียบร้อยแล้ว'
      });
    } catch (deleteError: any) {
      console.error('Error deleting user:', deleteError);
      
      // ถ้าเป็น Foreign key constraint error
      if (deleteError.message && deleteError.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'ไม่สามารถลบผู้ใช้งานนี้ได้เนื่องจากมีข้อมูลที่เกี่ยวข้องอยู่ในระบบ',
            details: 'กรุณาติดต่อผู้ดูแลระบบเพื่อลบข้อมูลที่เกี่ยวข้องก่อน'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'ไม่สามารถลบผู้ใช้งานได้',
          error: deleteError.message || String(deleteError)
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in DELETE user endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน',
        error: error.message || String(error)
      },
      { status: 500 }
    );
  }
}); 