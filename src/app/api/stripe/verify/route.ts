import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูล session_id' },
        { status: 400 }
      );
    }

    // ค้นหา Order ที่มี stripeSessionId ตรงกับ sessionId
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: sessionId
      },
      include: {
        paymentInfo: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลคำสั่งซื้อสำหรับ session นี้' },
        { status: 404 }
      );
    }

    // ตรวจสอบสถานะการชำระเงิน
    const isPaymentConfirmed = 
      (order.paymentStatus === 'CONFIRMED') || 
      (order.paymentInfo && order.paymentInfo.status === 'CONFIRMED');

    if (isPaymentConfirmed) {
      return NextResponse.json({
        success: true,
        orderNumber: order.orderNumber,
        transactionId: sessionId,
        paymentStatus: 'CONFIRMED'
      });
    } else {
      // ถ้ายังไม่ได้รับการยืนยันการชำระเงิน
      return NextResponse.json({
        success: false, 
        message: 'รอการยืนยันการชำระเงินจาก Stripe webhook',
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus
      });
    }
  } catch (error) {
    console.error('Error verifying Stripe payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน' 
      },
      { status: 500 }
    );
  }
} 