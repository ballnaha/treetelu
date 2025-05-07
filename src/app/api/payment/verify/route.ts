import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBangkokDateTime } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    // รับค่าต่างๆ จาก query parameter
    const url = new URL(request.url);
    const chargeId = url.searchParams.get('charge_id') || 
                     url.searchParams.get('id') || 
                     url.searchParams.get('token');
    
    if (!chargeId) {
      console.log('API: Missing charge_id parameter');
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสการชำระเงิน (charge_id หรือ token)' },
        { status: 400 }
      );
    }
    
    console.log(`API: Verifying payment with ID: ${chargeId}`);
    
    // สร้าง Omise instance
    const omise = require('omise')({
      publicKey: process.env.OMISE_PUBLIC_KEY,
      secretKey: process.env.OMISE_SECRET_KEY,
    });
    
    // ตรวจสอบสถานะการชำระเงินจาก Omise
    let charge;
    try {
      // เพิ่ม timestamp เพื่อหลีกเลี่ยงปัญหา caching
      const timestamp = new Date().getTime();
      charge = await omise.charges.retrieve(chargeId, { _timestamp: timestamp });
      console.log(`API: Retrieved charge information. Status: ${charge.status}`);
    } catch (omiseError: any) {
      console.error(`API: Error retrieving charge from Omise:`, omiseError);
      
      // ตรวจสอบในตาราง pending_payments ก่อน
      const pendingPayment = await prisma.pendingPayment.findFirst({
        where: {
          charge_id: chargeId
        }
      });
      
      if (pendingPayment) {
        // พบข้อมูลใน pending_payments
        console.log(`API: Found payment in pending_payments: ${pendingPayment.id}`);
        return NextResponse.json({
          success: true,
          message: 'ตรวจพบข้อมูลการชำระเงินที่รอดำเนินการ',
          status: pendingPayment.status === 'CONFIRMED' ? 'successful' : 'pending',
          data: {
            charge_id: pendingPayment.charge_id,
            amount: pendingPayment.amount,
            created_at: pendingPayment.created_at,
            payment_method: pendingPayment.payment_method
          }
        });
      }
      
      // ตรวจสอบว่ามีข้อมูลใน paymentInfo หรือไม่
      const paymentInfo = await prisma.paymentInfo.findFirst({
        where: {
          transactionId: chargeId
        },
        include: {
          order: true
        }
      });
      
      if (paymentInfo && paymentInfo.order) {
        console.log(`API: Found payment in paymentInfo: ${paymentInfo.id}`);
        return NextResponse.json({
          success: true,
          message: 'ตรวจพบข้อมูลการชำระเงินในระบบ',
          status: paymentInfo.status === 'CONFIRMED' ? 'successful' : 'pending',
          orderNumber: paymentInfo.order.orderNumber,
          order: {
            id: paymentInfo.order.id,
            orderNumber: paymentInfo.order.orderNumber,
            paymentStatus: paymentInfo.order.paymentStatus
          }
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'ไม่พบข้อมูลการชำระเงิน หรือข้อมูลไม่ถูกต้อง', 
          error: omiseError.message || 'Unknown error' 
        },
        { status: 404 }
      );
    }
    
    if (!charge) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการชำระเงิน' },
        { status: 404 }
      );
    }
    
    // ค้นหา order ที่เกี่ยวข้อง
    // 1. ค้นหาจาก payment_info ที่มี transactionId ตรงกับ charge.id
    const paymentInfo = await prisma.paymentInfo.findFirst({
      where: {
        transactionId: charge.id
      },
      include: {
        order: true
      }
    });
    
    // ถ้าพบ order ที่เกี่ยวข้องกับการชำระเงินนี้
    if (paymentInfo?.order) {
      const order = paymentInfo.order;
      console.log(`API: Found order via payment_info: ${order.id}`);
      
      return NextResponse.json({
        success: true,
        message: charge.status === 'successful' ? 'การชำระเงินสำเร็จ' : 'รอการชำระเงิน',
        orderNumber: order.orderNumber,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus
        },
        status: charge.status
      });
    }
    
    // ถ้าไม่พบ order แต่พบข้อมูลใน metadata
    if (charge.metadata && charge.metadata.order_id) {
      console.log(`API: Order not found in database but found in metadata: ${charge.metadata.order_id}`);
      
      // ถ้า order_id ใน metadata ไม่ใช่ 'pending'
      if (charge.metadata.order_id !== 'pending') {
        // พยายามค้นหา order
        try {
          const orderId = parseInt(charge.metadata.order_id);
          if (!isNaN(orderId)) {
            const order = await prisma.order.findUnique({
              where: { id: orderId }
            });
            
            if (order) {
              console.log(`API: Found order via metadata: ${order.id}`);
              return NextResponse.json({
                success: true,
                message: charge.status === 'successful' ? 'การชำระเงินสำเร็จ' : 'รอการชำระเงิน',
                orderNumber: order.orderNumber,
                order: {
                  id: order.id,
                  orderNumber: order.orderNumber,
                  paymentStatus: order.paymentStatus
                },
                status: charge.status
              });
            }
          }
        } catch (err) {
          console.error('API: Error converting order_id from metadata:', err);
        }
      }
    }
    
    // กรณีไม่พบ order แต่การชำระเงินสำเร็จหรืออยู่ระหว่างดำเนินการ
    // ตรวจสอบในตาราง pending_payments
    const pendingPayment = await prisma.pendingPayment.findFirst({
      where: {
        charge_id: charge.id
      }
    });
    
    if (pendingPayment) {
      console.log(`API: Found in pending_payments: ${pendingPayment.id}, Charge ID: ${pendingPayment.charge_id}`);
      
      // อัพเดทสถานะใน pending_payments ถ้าจำเป็น
      if (charge.status === 'successful' && pendingPayment.status !== 'CONFIRMED') {
        await prisma.pendingPayment.update({
          where: {
            id: pendingPayment.id
          },
          data: {
            status: 'CONFIRMED',
            updated_at: getBangkokDateTime()
          }
        });
        
        console.log(`API: Updated pending_payment status to CONFIRMED`);
      }
      
      return NextResponse.json({
        success: true,
        message: charge.status === 'successful' 
          ? 'การชำระเงินสำเร็จ กำลังรอสร้างคำสั่งซื้อ' 
          : 'รอการชำระเงิน',
        status: charge.status,
        pendingPayment: {
          id: pendingPayment.id,
          charge_id: pendingPayment.charge_id,
          amount: pendingPayment.amount,
          status: pendingPayment.status
        }
      });
    }
    
    // กรณีไม่พบข้อมูลในระบบและ charge ยังไม่สำเร็จ
    // ถ้าเป็นการชำระเงินสำเร็จแล้ว แต่ยังไม่มีข้อมูลในระบบ ให้สร้าง pending_payment
    if (charge.status === 'successful') {
      try {
        const newPendingPayment = await prisma.pendingPayment.create({
          data: {
            charge_id: charge.id,
            amount: parseFloat((charge.amount / 100).toFixed(2)),
            payment_method: charge.source?.type === 'promptpay' ? 'PROMPTPAY' : 'CREDIT_CARD',
            status: 'CONFIRMED',
            metadata: charge,
            processed: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        console.log(`API: Created new pending_payment: ${newPendingPayment.id} for charge: ${charge.id}`);
        
        return NextResponse.json({
          success: true,
          message: 'การชำระเงินสำเร็จ กำลังรอสร้างคำสั่งซื้อ',
          status: charge.status,
          pendingPayment: {
            id: newPendingPayment.id,
            charge_id: newPendingPayment.charge_id,
            amount: newPendingPayment.amount,
            status: newPendingPayment.status
          }
        });
      } catch (err) {
        console.error(`API: Error creating pending_payment:`, err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'อยู่ระหว่างรอการชำระเงิน',
      status: charge.status,
      charge: {
        id: charge.id,
        amount: parseFloat((charge.amount / 100).toFixed(2)),
        source_type: charge.source?.type
      }
    });
    
  } catch (error) {
    console.error('API: Error verifying payment:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 