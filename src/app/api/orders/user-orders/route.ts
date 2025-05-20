import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

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

// สร้าง instance ของ PrismaClient
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    console.log('User orders API called');
    
    // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
    const authToken = req.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ' },
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
    
    console.log('User ID from token:', userId);
    
    // ดึงข้อมูลจาก query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const status = url.searchParams.get('status') || undefined;
    const paymentStatus = url.searchParams.get('paymentStatus') || undefined;
    const dateFrom = url.searchParams.get('dateFrom') || undefined;
    const dateTo = url.searchParams.get('dateTo') || undefined;
    const search = url.searchParams.get('search') || undefined;
    
    console.log('Query params:', { page, limit, status, paymentStatus, dateFrom, dateTo, search });
    
    // คำนวณการแบ่งหน้า
    const skip = (page - 1) * limit;
    
    // สร้างเงื่อนไขสำหรับการกรอง
    const where: any = { 
      userId: parseInt(userId.toString()) 
    };
    
    // เพิ่มเงื่อนไขตาม query parameters
    if (status) {
      where.status = status as OrderStatus;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus as PaymentStatus;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        // เพิ่มอีก 1 วันเพื่อให้รวมวันสุดท้าย
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } }
      ];
    }
    
    // นับจำนวนคำสั่งซื้อทั้งหมดของผู้ใช้ตามเงื่อนไขที่กรอง
    const totalItems = await prisma.order.count({ where });
    
    const totalPages = Math.ceil(totalItems / limit);
    
    // ดึงข้อมูลคำสั่งซื้อของผู้ใช้ตามเงื่อนไขที่กรอง
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customerInfo: true,
        orderItems: true,
        shippingInfo: true,
        paymentInfo: true
      }
    });
    
    // ดึงข้อมูล payment confirmations สำหรับออเดอร์ทั้งหมด
    const orderNumbers = orders.map(order => order.orderNumber);
    const paymentConfirmations = await prisma.paymentConfirmation.findMany({
      where: {
        orderNumber: { in: orderNumbers }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // จัดกลุ่ม payment confirmations ตาม orderNumber
    const paymentConfirmationsByOrderNumber = paymentConfirmations.reduce((acc, pc) => {
      if (!acc[pc.orderNumber]) {
        acc[pc.orderNumber] = [];
      }
      acc[pc.orderNumber].push(pc);
      return acc;
    }, {} as Record<string, any[]>);
    
    // แปลงวันที่และแปลง BigInt เป็นสตริง
    const formattedOrders = orders.map((order: any) => {
      const formattedOrder = {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        shippingInfo: {
          ...order.shippingInfo,
          deliveryDate: order.shippingInfo?.deliveryDate instanceof Date ? 
            order.shippingInfo.deliveryDate.toISOString() : 
            order.shippingInfo?.deliveryDate
        },
        paymentConfirmations: paymentConfirmationsByOrderNumber[order.orderNumber] || []
      };
      
      // เพิ่ม log เพื่อตรวจสอบค่า deliveryDate
      console.log('User Order - DeliveryDate:', 
        order.orderNumber,
        order.shippingInfo?.deliveryDate, 
        typeof order.shippingInfo?.deliveryDate,
        '--> Converted to:',
        formattedOrder.shippingInfo?.deliveryDate,
        typeof formattedOrder.shippingInfo?.deliveryDate
      );
      
      return formattedOrder;
    });
    
    // แปลง BigInt เป็นสตริง
    const safeOrders = convertBigIntToString(formattedOrders);
    
    return NextResponse.json({
      success: true,
      orders: safeOrders,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in user orders API endpoint:', error);
    
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