import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

/**
 * GET handler for fetching all users (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('search') || undefined;
    const roleFilter = url.searchParams.get('role') || undefined;
    const showInactive = url.searchParams.get('showInactive') === 'true';
    
    // สร้าง query conditions
    const where: any = {};
    
    // เพิ่มเงื่อนไขค้นหา
    if (searchTerm) {
      where.OR = [
        { email: { contains: searchTerm } },
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } }
      ];
    }
    
    // กรองตามบทบาท
    if (roleFilter) {
      where.isAdmin = roleFilter.toLowerCase() === 'admin' ? 'true' : 'false';
    }
    
    // กรองตามสถานะการยืนยันอีเมล
    // หากต้องการแสดงเฉพาะผู้ที่ยืนยันอีเมลแล้ว (showInactive = false)
    if (showInactive === false) {
      where.emailVerifiedAt = { not: null };
    }
    
    // ดึงข้อมูลผู้ใช้
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error in users API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
    } else {
      errorDetails = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for removing a user (admin only)
 */
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    // แยกรหัสผู้ใช้จาก URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];
    
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