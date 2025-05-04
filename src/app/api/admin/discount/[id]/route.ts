import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateUser } from '@/lib/auth';

// Interface สำหรับข้อมูลรหัสส่วนลด
interface DiscountCode {
  id: number;
  code: string;
  type: string;
  value: string | number;
  minAmount: string | number;
  maxDiscount?: string | number;
  description: string;
  maxUses: number;
  usedCount: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

// ฟังก์ชันสำหรับดึงข้อมูลรหัสส่วนลดตาม ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const auth = await validateUser(request);
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล'
      }, { status: 401 });
    }

    const id = Number(context.params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        message: 'รหัสไม่ถูกต้อง'
      }, { status: 400 });
    }

    // ดึงข้อมูลรหัสส่วนลดตาม ID
    const discountCode = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes WHERE id = ${id} LIMIT 1
    `;

    if (!discountCode || discountCode.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบรหัสส่วนลด'
      }, { status: 404 });
    }

    // แปลงข้อมูลเพื่อป้องกันปัญหา BigInt serialization
    const discountData = {
      ...discountCode[0],
      id: Number(discountCode[0].id),
      value: parseFloat(String(discountCode[0].value)),
      minAmount: parseFloat(String(discountCode[0].minAmount)),
      maxDiscount: discountCode[0].maxDiscount ? parseFloat(String(discountCode[0].maxDiscount)) : null,
      maxUses: Number(discountCode[0].maxUses),
      usedCount: Number(discountCode[0].usedCount),
      createdBy: discountCode[0].createdBy ? Number(discountCode[0].createdBy) : null
    };

    return NextResponse.json({
      success: true,
      data: discountData
    });
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรหัสส่วนลด'
    }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับอัปเดตรหัสส่วนลด
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const auth = await validateUser(request);
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูล'
      }, { status: 401 });
    }

    const id = Number(context.params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        message: 'รหัสไม่ถูกต้อง'
      }, { status: 400 });
    }

    // ตรวจสอบว่ารหัสส่วนลดมีอยู่หรือไม่
    const existingCode = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes WHERE id = ${id} LIMIT 1
    `;
    
    if (!existingCode || existingCode.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบรหัสส่วนลด'
      }, { status: 404 });
    }

    // รับข้อมูลจาก request
    const data = await request.json();

    // แปลงค่าข้อมูลให้ถูกต้อง
    const value = parseFloat(String(data.value));
    const minAmount = parseFloat(String(data.minAmount));
    const maxDiscount = data.maxDiscount ? parseFloat(String(data.maxDiscount)) : null;
    const maxUses = parseInt(String(data.maxUses));
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;

    // อัปเดตข้อมูลรหัสส่วนลด
    await prisma.$executeRaw`
      UPDATE discount_codes
      SET code = ${data.code},
          type = ${data.type},
          value = ${value},
          minAmount = ${minAmount},
          maxDiscount = ${maxDiscount},
          description = ${data.description},
          maxUses = ${maxUses},
          status = ${data.status},
          startDate = ${startDate},
          endDate = ${endDate},
          updatedAt = NOW()
      WHERE id = ${id}
    `;

    // ดึงข้อมูลที่อัปเดตแล้ว
    const updatedDiscount = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes WHERE id = ${id} LIMIT 1
    `;

    // แปลงข้อมูลเพื่อป้องกันปัญหา BigInt serialization
    const updatedData = updatedDiscount.length > 0 ? {
      ...updatedDiscount[0],
      id: Number(updatedDiscount[0].id),
      value: parseFloat(String(updatedDiscount[0].value)),
      minAmount: parseFloat(String(updatedDiscount[0].minAmount)),
      maxDiscount: updatedDiscount[0].maxDiscount ? parseFloat(String(updatedDiscount[0].maxDiscount)) : null,
      maxUses: Number(updatedDiscount[0].maxUses),
      usedCount: Number(updatedDiscount[0].usedCount),
      createdBy: updatedDiscount[0].createdBy ? Number(updatedDiscount[0].createdBy) : null
    } : null;

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'อัปเดตรหัสส่วนลดเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตรหัสส่วนลด'
    }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับลบรหัสส่วนลด
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const auth = await validateUser(request);
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบข้อมูล'
      }, { status: 401 });
    }

    const id = Number(context.params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        message: 'รหัสไม่ถูกต้อง'
      }, { status: 400 });
    }

    // ตรวจสอบว่ารหัสส่วนลดมีอยู่หรือไม่
    const existingCode = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes WHERE id = ${id} LIMIT 1
    `;
    
    if (!existingCode || existingCode.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบรหัสส่วนลด'
      }, { status: 404 });
    }

    // ลบรหัสส่วนลด
    await prisma.$executeRaw`
      DELETE FROM discount_codes WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: 'ลบรหัสส่วนลดเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบรหัสส่วนลด'
    }, { status: 500 });
  }
} 