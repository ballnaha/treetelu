import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';
import prisma from '@/lib/prisma';

// นำเข้า enum ที่ต้องการใช้งาน
type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

// const prisma = new PrismaClient();

/**
 * Helper function to convert BigInt values to strings in an object
 * This is needed because JSON.stringify cannot serialize BigInt values
 */
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

/**
 * GET handler for fetching all orders (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  console.log('Admin orders API called');
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const dateFrom = url.searchParams.get('dateFrom') || undefined;
    const dateTo = url.searchParams.get('dateTo') || undefined;
    
    console.log('Query params:', { page, limit, status, search, dateFrom, dateTo });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where: any = {};
    
    if (status) {
      where.status = status as OrderStatus;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        // Add one day to include the end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerInfo: { firstName: { contains: search } } },
        { customerInfo: { lastName: { contains: search } } },
        { customerInfo: { email: { contains: search } } },
        { customerInfo: { phone: { contains: search } } }
      ];
    }
    
    // Count total orders matching the filter
    const totalItems = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    
    // Fetch orders with pagination and include related data
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
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedOrders = orders.map((order: any) => {
      // Create a new object with formatted dates
      const formattedOrder = {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      };
      return formattedOrder;
    });
    
    // Convert BigInt values to strings
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
    console.error('Error in orders API endpoint:', error);
    
    // Add more detailed error information
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
});

/**
 * PUT handler for updating an order status (admin only)
 */
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { orderId, status, paymentStatus } = body;
    
    console.log('Update order request:', { orderId, status, paymentStatus });
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // Validate status values
    const validOrderStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (status && !validOrderStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { success: false, message: 'สถานะคำสั่งซื้อไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    const validPaymentStatuses: PaymentStatus[] = ['PENDING', 'CONFIRMED', 'REJECTED'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus as PaymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'สถานะการชำระเงินไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status as OrderStatus;
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus as PaymentStatus;
    }
    
    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updateData,
      include: {
        customerInfo: true,
        orderItems: true,
        shippingInfo: true,
        paymentInfo: true
      }
    });
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedOrder = {
      ...updatedOrder,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString()
    };
    
    // Convert BigInt values to strings
    const safeOrder = convertBigIntToString(formattedOrder);
    
    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อเรียบร้อย',
      order: safeOrder
    });
  } catch (error) {
    console.error('Error in update order endpoint:', error);
    
    let errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ',
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for deleting an order (admin only)
 */
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    console.log('Delete order request:', { orderId });
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // Delete related records first (to maintain referential integrity)
    // 1. Delete order items
    await prisma.orderItem.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 2. Delete customer info
    await prisma.customerInfo.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 3. Delete shipping info
    await prisma.shippingInfo.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 4. Delete payment info
    await prisma.paymentInfo.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 5. Finally delete the order
    const deletedOrder = await prisma.order.delete({
      where: { id: parseInt(orderId) }
    });
    
    return NextResponse.json({
      success: true,
      message: 'ลบคำสั่งซื้อเรียบร้อยแล้ว',
      order: convertBigIntToString(deletedOrder)
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ' },
      { status: 500 }
    );
  }
});
