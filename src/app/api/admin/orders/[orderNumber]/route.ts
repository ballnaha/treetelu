import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

/**
 * Helper function to convert BigInt values to strings in an object
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
 * GET handler for fetching a single order by order number (admin only)
 */
export const GET = withAdminAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) => {
  try {
    const { orderNumber } = await params;
    console.log('Fetching order by orderNumber:', orderNumber);

    const order = await prisma.order.findFirst({
      where: { orderNumber: orderNumber },
      include: {
        customerInfo: true,
        orderItems: {
          include: {
            product: true
          }
        },
        shippingInfo: true,
        paymentInfo: true
      }
    });

    if (!order) {
      console.log('Order not found for orderNumber:', orderNumber);
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลคำสั่งซื้อ' },
        { status: 404 }
      );
    }

    // ดึงข้อมูล payment confirmations ที่เกี่ยวข้องกับออเดอร์นี้
    const paymentConfirmations = await prisma.paymentConfirmation.findMany({
      where: { orderNumber: order.orderNumber },
      orderBy: { createdAt: 'desc' }
    });

    // Format dates and convert BigInt values to strings
    const formattedOrder = {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingInfo: {
        ...order.shippingInfo,
        deliveryDate: order.shippingInfo?.deliveryDate instanceof Date ? 
          order.shippingInfo.deliveryDate.toISOString() : order.shippingInfo?.deliveryDate
      },
      paymentConfirmations: paymentConfirmations || []
    };

    // Convert BigInt values to strings
    const safeOrder = convertBigIntToString(formattedOrder);

    console.log('Found order:', {
      orderNumber: safeOrder.orderNumber,
      status: safeOrder.status,
      paymentStatus: safeOrder.paymentStatus
    });

    return NextResponse.json({
      success: true,
      order: safeOrder
    });
  } catch (error) {
    console.error('Error fetching order by orderNumber:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
});
