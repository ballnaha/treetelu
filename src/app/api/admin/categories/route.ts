import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

/**
 * GET handler for fetching all categories (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  console.log('Admin categories API called');
  try {
    // Fetch all categories
    const categories = await prisma.category.findMany({
      orderBy: { priority: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error in categories API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่';
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

// POST /api/admin/categories - เพิ่มหมวดหมู่ใหม่
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    // รับข้อมูลจาก request body
    const body = await req.json();
    const { categoryName, categoryDesc, status, priority, bestseller } = body;

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

    // สร้างหมวดหมู่ใหม่
    const category = await prisma.category.create({
      data: {
        categoryName,
        categoryDesc,
        status: status ?? 'off',
        priority: priority ?? 0,
        bestseller: bestseller ?? 'off'
      }
    });

    return NextResponse.json({ 
      success: true,
      category 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});
