import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET - ดึงรายการ discount codes
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ Authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ Admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ในการเข้าถึง' },
        { status: 403 }
      );
    }

    const discountCodes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: discountCodes
    });

  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้าง discount code ใหม่
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ Admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ในการเข้าถึง' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Received discount data:', body);
    
    const { code, type, value, minAmount, maxDiscount, description, maxUses, startDate, endDate, status } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!code || !type || value === undefined || value === null || !description) {
      console.log('Missing required fields:', { code, type, value, description });
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (รหัส, ประเภท, ค่าส่วนลด, คำอธิบาย)' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทส่วนลด
    if (!['percentage', 'fixed'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'ประเภทส่วนลดไม่ถูกต้อง (ต้องเป็น percentage หรือ fixed)' },
        { status: 400 }
      );
    }

    // ตรวจสอบค่าส่วนลด
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      console.log('Invalid value:', value, 'converted to:', numValue);
      return NextResponse.json(
        { success: false, error: 'ค่าส่วนลดต้องเป็นตัวเลขที่มากกว่า 0' },
        { status: 400 }
      );
    }

    // ตรวจสอบเปอร์เซ็นต์
    if (type === 'percentage' && numValue > 100) {
      return NextResponse.json(
        { success: false, error: 'ส่วนลดแบบเปอร์เซ็นต์ต้องไม่เกิน 100%' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ารหัสซ้ำหรือไม่
    const existingCode = await prisma.discountCode.findFirst({
      where: { code: code.toUpperCase() }
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'รหัสส่วนลดนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: numValue,
        minAmount: minAmount ? (typeof minAmount === 'string' ? parseFloat(minAmount) : Number(minAmount)) : 0,
        maxDiscount: maxDiscount ? (typeof maxDiscount === 'string' ? parseFloat(maxDiscount) : Number(maxDiscount)) : null,
        description,
        maxUses: maxUses ? (typeof maxUses === 'string' ? parseInt(maxUses) : Number(maxUses)) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active',
        createdBy: decoded.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'สร้างรหัสส่วนลดเรียบร้อยแล้ว',
      data: discountCode
    });

  } catch (error: any) {
    console.error('Error creating discount code:', error);
    
    // ตรวจสอบ Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'รหัสส่วนลดนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: `เกิดข้อผิดพลาดในการสร้างรหัสส่วนลด: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}