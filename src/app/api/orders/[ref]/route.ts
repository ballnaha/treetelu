import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

type Params = { params: { ref: string } }

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const transactionId = params.ref;
    console.log('Fetching order for transactionId:', transactionId);

    const order = await prisma.order.findFirst({
      where: {
        paymentInfo: {
          transactionId: transactionId
        }
      },
      include: {
        customerInfo: true,
        paymentInfo: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      console.log('Order not found for transactionId:', transactionId);
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลคำสั่งซื้อ' },
        { status: 404 }
      );
    }

    console.log('Found order:', order.orderNumber);
    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      transactionId: order.paymentInfo?.transactionId
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
} 