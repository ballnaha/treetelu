import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

// GET /api/admin/categories/[id] - ดึงข้อมูลหมวดหมู่ตาม ID
export const GET = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const categoryId = parseInt(params.id);
    
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { message: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});

// PUT /api/admin/categories/[id] - อัปเดตข้อมูลหมวดหมู่
export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const categoryId = parseInt(params.id);
    const body = await req.json();
    const { categoryName, categoryDesc, status, priority, bestseller } = body;

    // ตรวจสอบว่ามีหมวดหมู่นี้อยู่หรือไม่
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!categoryName) {
      return NextResponse.json(
        { message: 'กรุณากรอกชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    // ตรวจสอบค่าที่ถูกต้องของ status และ bestseller
    if (status && !['on', 'off'].includes(status)) {
      return NextResponse.json(
        { message: 'ค่า status ต้องเป็น "on" หรือ "off" เท่านั้น' },
        { status: 400 }
      );
    }

    if (bestseller && !['on', 'off'].includes(bestseller)) {
      return NextResponse.json(
        { message: 'ค่า bestseller ต้องเป็น "on" หรือ "off" เท่านั้น' },
        { status: 400 }
      );
    }

    // อัปเดตข้อมูลหมวดหมู่
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        categoryName,
        categoryDesc,
        status: status ?? existingCategory.status,
        priority: priority ?? existingCategory.priority,
        bestseller: bestseller ?? existingCategory.bestseller
      }
    });

    return NextResponse.json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/categories/[id] - ลบหมวดหมู่
export const DELETE = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const categoryId = parseInt(params.id);

    // ตรวจสอบว่ามีหมวดหมู่นี้อยู่หรือไม่
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { message: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }

    // ค้นหาหรือสร้างหมวดหมู่ "ไม่ระบุหมวดหมู่"
    let uncategorizedCategory = await prisma.category.findFirst({
      where: { categoryName: 'ไม่ระบุหมวดหมู่' }
    });

    if (!uncategorizedCategory) {
      uncategorizedCategory = await prisma.category.create({
        data: {
          categoryName: 'ไม่ระบุหมวดหมู่',
          categoryDesc: 'หมวดหมู่สำหรับสินค้าที่ยังไม่ได้จัดหมวดหมู่',
          status: 'on',
          priority: 999,
          bestseller: 'off'
        }
      });
    }

    // ย้ายสินค้าทั้งหมดไปยังหมวดหมู่ "ไม่ระบุหมวดหมู่"
    await prisma.product.updateMany({
      where: { categoryId },
      data: { categoryId: uncategorizedCategory.id }
    });

    // ลบหมวดหมู่
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบหมวดหมู่เรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}); 