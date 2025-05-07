import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json(
      { success: false, message: 'กรุณาระบุรหัสคำสั่งซื้อ' },
      { status: 400 }
    );
  }
  
  // ค้นหาคำสั่งซื้อตาม ID
  let orderId: number;
  try {
    orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      throw new Error('Invalid order ID');
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' },
      { status: 400 }
    );
  }
  
  try {
    // ค้นหาคำสั่งซื้อ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
        finalAmount: true,
        paymentInfo: {
          select: {
            id: true,
            paymentMethod: true,
            transactionId: true,
            amount: true,
            status: true,
            paymentDate: true
          }
        }
      }
    });
    
    if (!order) {
      // ตรวจสอบว่ามีในตาราง pending_payments หรือไม่
      const pendingPayment = await prisma.pendingPayment.findFirst({
        where: {
          order_id: orderId
        }
      });
      
      if (pendingPayment) {
        return NextResponse.json({
          success: true,
          message: 'พบข้อมูลการชำระเงินที่รอการประมวลผล',
          id: orderId,
          orderNumber: null,
          paymentStatus: pendingPayment.status,
          pendingPaymentId: pendingPayment.id,
          pendingPaymentChargeId: pendingPayment.charge_id
        });
      }
      
      return NextResponse.json(
        { success: false, message: 'ไม่พบรายการสั่งซื้อ' },
        { status: 404 }
      );
    }
    
    // ส่งคืนสถานะการชำระเงิน
    return NextResponse.json({
      success: true,
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentInfo: order.paymentInfo ? {
        id: order.paymentInfo.id,
        method: order.paymentInfo.paymentMethod,
        transactionId: order.paymentInfo.transactionId,
        amount: order.paymentInfo.amount,
        status: order.paymentInfo.status,
        date: order.paymentInfo.paymentDate
      } : null
    });
  } catch (error) {
    console.error('Error checking order payment status:', error);
    
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน' },
      { status: 500 }
    );
  }
} 