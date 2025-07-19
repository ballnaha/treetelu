import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code, orderId } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุรหัสส่วนลด' },
        { status: 400 }
      );
    }

    // ค้นหารหัสส่วนลดในฐานข้อมูล
    const discountCode = await prisma.discountCode.findFirst({
      where: {
        code: code.toUpperCase(),
        status: 'active'
      }
    });

    if (!discountCode) {
      return NextResponse.json(
        { success: false, message: 'รหัสส่วนลดไม่ถูกต้อง' },
        { status: 404 }
      );
    }

    // อัปเดตจำนวนการใช้งาน
    await prisma.discountCode.update({
      where: { id: discountCode.id },
      data: { 
        usedCount: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // บันทึกประวัติการใช้งานในอนาคต (ถ้าต้องการ)
    // สามารถเพิ่มตาราง discount_usage ได้ในอนาคต

    return NextResponse.json({
      success: true,
      message: 'บันทึกการใช้รหัสส่วนลดเรียบร้อย'
    });

  } catch (error) {
    console.error('Discount usage error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกการใช้รหัสส่วนลด' },
      { status: 500 }
    );
  }
}