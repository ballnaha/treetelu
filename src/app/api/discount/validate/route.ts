import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

// ฟังก์ชันสำหรับตรวจสอบความถูกต้องของรหัสส่วนลด
export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await request.json();
    const { code, cartTotal } = body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!code || !cartTotal) {
      return NextResponse.json({
        success: false,
        message: "กรุณาระบุรหัสส่วนลดและยอดรวมสินค้า"
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
        message: "ไม่พบรหัสส่วนลดนี้ในระบบ"
      }, { status: 404 });
    }

    const discount = discountCode[0];

    // ตรวจสอบสถานะของรหัสส่วนลด
    if (discount.status !== "active") {
      return NextResponse.json({
        success: false,
        message: "รหัสส่วนลดนี้ไม่สามารถใช้งานได้"
      }, { status: 400 });
    }

    // ตรวจสอบวันหมดอายุ
    if (discount.endDate && new Date() > new Date(discount.endDate)) {
      return NextResponse.json({
        success: false,
        message: "รหัสส่วนลดนี้หมดอายุแล้ว"
      }, { status: 400 });
    }

    // ตรวจสอบวันเริ่มใช้งาน
    if (discount.startDate && new Date() < new Date(discount.startDate)) {
      return NextResponse.json({
        success: false,
        message: "รหัสส่วนลดนี้ยังไม่เริ่มใช้งาน"
      }, { status: 400 });
    }

    // ตรวจสอบจำนวนการใช้งาน
    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({
        success: false,
        message: "รหัสส่วนลดนี้ถูกใช้งานครบจำนวนแล้ว"
      }, { status: 400 });
    }

    // ตรวจสอบยอดขั้นต่ำ
    const minAmount = parseFloat(String(discount.minAmount));
    if (cartTotal < minAmount) {
      return NextResponse.json({
        success: false,
        message: `ยอดสั่งซื้อขั้นต่ำสำหรับรหัสส่วนลดนี้คือ ${minAmount.toLocaleString()} บาท`
      }, { status: 400 });
    }

    // คำนวณส่วนลด
    let discountAmount = 0;
    const discountValue = parseFloat(String(discount.value));
    const maxDiscount = discount.maxDiscount ? parseFloat(String(discount.maxDiscount)) : null;

    if (discount.type === "percentage") {
      // ส่วนลดเป็นเปอร์เซ็นต์
      discountAmount = cartTotal * (discountValue / 100);
      
      // ตรวจสอบกับส่วนลดสูงสุด (ถ้ามี)
      if (maxDiscount !== null && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else if (discount.type === "fixed") {
      // ส่วนลดเป็นจำนวนเงินคงที่
      discountAmount = discountValue;
      
      // ส่วนลดต้องไม่เกินยอดรวม
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }

    // ปัดเศษทศนิยมเป็น 2 ตำแหน่ง
    discountAmount = Math.round(discountAmount * 100) / 100;

    // แปลงข้อมูลเพื่อป้องกันปัญหา BigInt serialization
    const discountData = {
      id: Number(discount.id),
      code: discount.code,
      type: discount.type,
      value: discountValue,
      minAmount: minAmount,
      maxDiscount: maxDiscount,
      description: discount.description,
      maxUses: Number(discount.maxUses),
      usedCount: Number(discount.usedCount),
      status: discount.status
    };

    return NextResponse.json({
      success: true,
      discount: discountData,
      discountAmount: discountAmount,
      message: "รหัสส่วนลดถูกต้อง"
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด"
    }, { status: 500 });
  }
} 