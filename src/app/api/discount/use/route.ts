import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateUser } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderId } = body;

    // ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่
    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุรหัสส่วนลด'
      }, { status: 400 });
    }

    // ค้นหารหัสส่วนลดในฐานข้อมูล
    const discountCode = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes WHERE code = ${code} LIMIT 1
    `;

    // ตรวจสอบว่าพบรหัสส่วนลดหรือไม่
    if (!discountCode || discountCode.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ไม่พบรหัสส่วนลด'
      }, { status: 404 });
    }

    const discount = discountCode[0];

    // แปลงข้อมูลเพื่อป้องกันปัญหา BigInt serialization
    const discountData = {
      id: Number(discount.id),
      code: discount.code,
      type: discount.type,
      value: parseFloat(String(discount.value)),
      minAmount: parseFloat(String(discount.minAmount)),
      maxDiscount: discount.maxDiscount ? parseFloat(String(discount.maxDiscount)) : null,
      description: discount.description,
      maxUses: Number(discount.maxUses),
      usedCount: Number(discount.usedCount),
      status: discount.status,
      startDate: discount.startDate,
      endDate: discount.endDate
    };

    // ตรวจสอบว่ารหัสยังสามารถใช้งานได้หรือไม่
    if (discount.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: 'รหัสส่วนลดนี้ไม่สามารถใช้งานได้'
      }, { status: 400 });
    }

    // ตรวจสอบจำนวนการใช้งาน
    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({
        success: false,
        message: 'รหัสส่วนลดนี้ถูกใช้งานครบจำนวนแล้ว'
      }, { status: 400 });
    }

    // เพิ่มจำนวนการใช้งาน
    await prisma.$executeRaw`
      UPDATE discount_codes 
      SET usedCount = usedCount + 1, 
          updatedAt = NOW() 
      WHERE code = ${code}
    `;

    // บันทึกประวัติการใช้งานส่วนลด (ถ้ามี order ID)
    if (orderId) {
      await prisma.$executeRaw`
        UPDATE orders 
        SET discountCode = ${code},
            updatedAt = NOW() 
        WHERE id = ${orderId}
      `;
    }

    return NextResponse.json({
      success: true,
      discount: discountData,
      message: 'อัปเดตการใช้งานรหัสส่วนลดเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error using discount code:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตการใช้งานรหัสส่วนลด'
    }, { status: 500 });
  }
} 