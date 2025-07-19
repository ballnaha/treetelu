import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุรหัสส่วนลด' },
        { status: 400 }
      );
    }

    if (!cartTotal || cartTotal <= 0) {
      return NextResponse.json(
        { success: false, message: 'ยอดสั่งซื้อไม่ถูกต้อง' },
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
        { success: false, message: 'รหัสส่วนลดไม่ถูกต้องหรือหมดอายุ' },
        { status: 404 }
      );
    }

    // ตรวจสอบวันหมดอายุ
    const now = new Date();
    if (discountCode.endDate && new Date(discountCode.endDate) < now) {
      return NextResponse.json(
        { success: false, message: 'รหัสส่วนลดหมดอายุแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวนการใช้งาน
    if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
      return NextResponse.json(
        { success: false, message: 'รหัสส่วนลดถูกใช้งานครบแล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบยอดขั้นต่ำ
    if (discountCode.minAmount && cartTotal < Number(discountCode.minAmount)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `ยอดสั่งซื้อขั้นต่ำ ฿${Number(discountCode.minAmount).toLocaleString()} เพื่อใช้รหัสส่วนลดนี้` 
        },
        { status: 400 }
      );
    }

    // คำนวณส่วนลด
    let discountAmount = 0;
    if (discountCode.type === 'percentage') {
      discountAmount = (cartTotal * Number(discountCode.value)) / 100;
      // จำกัดส่วนลดสูงสุด (ถ้ามี)
      if (discountCode.maxDiscount && discountAmount > Number(discountCode.maxDiscount)) {
        discountAmount = Number(discountCode.maxDiscount);
      }
    } else if (discountCode.type === 'fixed') {
      discountAmount = Number(discountCode.value);
      // ส่วนลดไม่เกินยอดสั่งซื้อ
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }

    const finalDiscountAmount = Math.round(discountAmount);
    console.log('Discount calculation:', {
      cartTotal,
      type: discountCode.type,
      value: Number(discountCode.value),
      calculatedDiscount: discountAmount,
      finalDiscountAmount
    });

    return NextResponse.json({
      success: true,
      discount: {
        code: discountCode.code,
        type: discountCode.type,
        value: Number(discountCode.value),
        discountAmount: finalDiscountAmount,
        description: discountCode.description
      }
    });

  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด' },
      { status: 500 }
    );
  }
}