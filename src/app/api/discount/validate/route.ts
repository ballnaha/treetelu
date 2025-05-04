import { NextRequest, NextResponse } from 'next/server';

// Mock discount codes for demonstration
// ในระบบจริงควรเก็บข้อมูลนี้ในฐานข้อมูล
const DISCOUNT_CODES = [
  { 
    code: 'WELCOME10', 
    type: 'percentage', 
    value: 10, 
    minAmount: 500, 
    maxDiscount: 1000,
    description: 'ลด 10% เมื่อสั่งซื้อขั้นต่ำ 500 บาท (สูงสุด 1,000 บาท)'
  },
  { 
    code: 'TREE200', 
    type: 'fixed', 
    value: 200, 
    minAmount: 1000,
    description: 'ลด 200 บาท เมื่อสั่งซื้อขั้นต่ำ 1,000 บาท'
  },

];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;
    
    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุรหัสส่วนลด'
      }, { status: 400 });
    }
    
    // ค้นหารหัสส่วนลด (ไม่สนใจตัวพิมพ์ใหญ่-เล็ก)
    const discount = DISCOUNT_CODES.find(
      item => item.code.toLowerCase() === code.toLowerCase()
    );
    
    if (!discount) {
      return NextResponse.json({
        success: false,
        message: 'รหัสส่วนลดไม่ถูกต้อง'
      }, { status: 400 });
    }
    
    // ตรวจสอบจำนวนขั้นต่ำ
    if (cartTotal < discount.minAmount) {
      return NextResponse.json({
        success: false,
        message: `รหัสส่วนลดนี้ใช้ได้กับการสั่งซื้อขั้นต่ำ ${discount.minAmount.toLocaleString()} บาท`
      }, { status: 400 });
    }
    
    // คำนวณจำนวนส่วนลด
    let discountAmount = 0;
    
    if (discount.type === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;
      
      // ตรวจสอบส่วนลดสูงสุด (ถ้ามี)
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      // ส่วนลดแบบตายตัว
      discountAmount = discount.value;
    }
    
    // ส่วนลดไม่ควรมากกว่ายอดรวม
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }
    
    return NextResponse.json({
      success: true,
      code: discount.code,
      discountAmount,
      description: discount.description
    });
    
  } catch (error) {
    console.error('Error validating discount code:', error);
    
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด'
    }, { status: 500 });
  }
} 