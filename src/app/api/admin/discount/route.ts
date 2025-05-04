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

// ฟังก์ชันเพื่อดึงข้อมูลรหัสส่วนลดทั้งหมด
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const auth = await validateUser(request);
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล'
      }, { status: 401 });
    }

    // ดึงข้อมูลรหัสส่วนลดทั้งหมด
    const discountCodes = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes ORDER BY createdAt DESC
    `;

    // แปลงข้อมูลเพื่อป้องกันปัญหา BigInt serialization
    const formattedData = discountCodes.map(code => ({
      ...code,
      id: Number(code.id),
      value: parseFloat(String(code.value)),
      minAmount: parseFloat(String(code.minAmount)),
      maxDiscount: code.maxDiscount ? parseFloat(String(code.maxDiscount)) : null,
      maxUses: Number(code.maxUses),
      usedCount: Number(code.usedCount),
      createdBy: code.createdBy ? Number(code.createdBy) : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรหัสส่วนลด'
    }, { status: 500 });
  }
}

// ฟังก์ชันเพื่อสร้างรหัสส่วนลดใหม่
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const auth = await validateUser(request);
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'ไม่มีสิทธิ์สร้างรหัสส่วนลด'
      }, { status: 401 });
    }

    // รับข้อมูลจาก request
    const data = await request.json();
    
    // แสดงข้อมูลที่ได้รับเพื่อการดีบั๊ก
    console.log('Received data:', JSON.stringify(data));

    // ตรวจสอบว่ารหัสส่วนลดมีอยู่แล้วหรือไม่
    const existingCode = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM discount_codes WHERE code = ${data.code} LIMIT 1
    `;

    if (existingCode.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'รหัสส่วนลดนี้มีอยู่ในระบบแล้ว'
      }, { status: 400 });
    }

    // แปลงข้อมูลให้เป็นรูปแบบที่ถูกต้อง
    const value = parseFloat(String(data.value));
    const minAmount = parseFloat(String(data.minAmount));
    const maxDiscount = data.maxDiscount ? parseFloat(String(data.maxDiscount)) : null;
    const maxUses = parseInt(String(data.maxUses));
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const now = new Date();
    
    try {
      // บันทึกข้อมูล
      await prisma.$executeRaw`
        INSERT INTO discount_codes (
          code, type, value, minAmount, maxDiscount, description, 
          maxUses, usedCount, status, startDate, endDate, createdBy, createdAt, updatedAt
        ) VALUES (
          ${data.code}, 
          ${data.type}, 
          ${value}, 
          ${minAmount}, 
          ${maxDiscount}, 
          ${data.description}, 
          ${maxUses},
          0,
          ${data.status},
          ${startDate},
          ${endDate},
          ${auth.userId ? parseInt(auth.userId.toString()) : null},
          NOW(),
          NOW()
        )
      `;
      
      console.log('Insert successful');

      // ดึงข้อมูลที่เพิ่งสร้าง
      const createdDiscount = await prisma.$queryRaw<DiscountCode[]>`
        SELECT * FROM discount_codes WHERE code = ${data.code} LIMIT 1
      `;

      // แปลงข้อมูลเพื่อป้องกันปัญหา BigInt serialization
      const discountData = createdDiscount.length > 0 ? {
        ...createdDiscount[0],
        id: Number(createdDiscount[0].id),
        value: parseFloat(String(createdDiscount[0].value)),
        minAmount: parseFloat(String(createdDiscount[0].minAmount)),
        maxDiscount: createdDiscount[0].maxDiscount ? parseFloat(String(createdDiscount[0].maxDiscount)) : null,
        maxUses: Number(createdDiscount[0].maxUses),
        usedCount: Number(createdDiscount[0].usedCount),
        createdBy: createdDiscount[0].createdBy ? Number(createdDiscount[0].createdBy) : null
      } : null;

      return NextResponse.json({
        success: true,
        data: discountData,
        message: 'สร้างรหัสส่วนลดเรียบร้อยแล้ว'
      });
    } catch (insertError: any) {
      console.error('Error during INSERT:', insertError.message);
      return NextResponse.json({
        success: false,
        message: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${insertError.message}`,
        error: insertError
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error creating discount code:', error);
    return NextResponse.json({
      success: false,
      message: `เกิดข้อผิดพลาดในการสร้างรหัสส่วนลด: ${error.message}`,
      error: error
    }, { status: 500 });
  }
} 