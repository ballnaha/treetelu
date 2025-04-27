import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// นำเข้า function สำหรับแปลง BigInt
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntToString(obj[key]);
    }
    return result;
  }

  return obj;
}

// สร้าง instance ของ PrismaClient แบบง่าย
const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    console.log('Order detail API called for order:', params.orderNumber);
    
    // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
    const authToken = req.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดคำสั่งซื้อ' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบและถอดรหัส token
    const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';
    let decoded;
    
    try {
      decoded = verify(authToken, JWT_SECRET);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return NextResponse.json(
        { success: false, message: 'โทเค็นไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง' },
        { status: 401 }
      );
    }
    
    // ดึง userId จาก token
    const userId = (decoded as any).id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้ในโทเค็น' },
        { status: 401 }
      );
    }
    
    // ดึงข้อมูลคำสั่งซื้อจากเลขที่คำสั่งซื้อ
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: params.orderNumber,
        userId: parseInt(userId.toString()) // ตรวจสอบว่าคำสั่งซื้อเป็นของผู้ใช้นี้จริง
      },
      include: {
        customerInfo: true,
        orderItems: true,
        shippingInfo: true,
        paymentInfo: true
      }
    });
    
    // ตรวจสอบว่าพบคำสั่งซื้อหรือไม่
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลคำสั่งซื้อ หรือคุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' },
        { status: 404 }
      );
    }
    
    // ดึงข้อมูล payment confirmations
    const paymentConfirmations = await prisma.paymentConfirmation.findMany({
      where: {
        orderNumber: params.orderNumber
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // แปลงวันที่และแปลง BigInt เป็นสตริง
    const formattedOrder = {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paymentConfirmations: paymentConfirmations || []
    };
    
    // แปลง BigInt เป็นสตริง
    const safeOrder = convertBigIntToString(formattedOrder);
    
    return NextResponse.json({
      success: true,
      order: safeOrder
    });
  } catch (error) {
    console.error('Error in order detail API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
      console.error('Error details:', errorDetails, error.stack);
    } else {
      errorDetails = String(error);
      console.error('Unknown error type:', typeof error, error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 