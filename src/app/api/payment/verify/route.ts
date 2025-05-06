import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBangkokDateTime } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    // รับค่า charge_id จาก query parameter
    const url = new URL(request.url);
    const chargeId = url.searchParams.get('charge_id');
    
    if (!chargeId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสการชำระเงิน (charge_id)' },
        { status: 400 }
      );
    }
    
    // สร้าง Omise instance
    const omise = require('omise')({
      publicKey: process.env.OMISE_PUBLIC_KEY,
      secretKey: process.env.OMISE_SECRET_KEY,
    });
    
    // ตรวจสอบสถานะการชำระเงินจาก Omise
    const charge = await omise.charges.retrieve(chargeId);
    
    if (!charge) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการชำระเงิน' },
        { status: 404 }
      );
    }
    
    // ค้นหา order จาก paymentReference (charge_id)
    const order = await prisma.order.findFirst({
      where: {
        paymentInfo: {
          transactionId: chargeId
        }
      },
      include: {
        paymentInfo: true
      }
    });
    
    // ถ้าไม่พบ order จาก paymentInfo ให้ลองค้นหาจาก metadata
    if (!order && charge.metadata && charge.metadata.order_id && charge.metadata.order_id !== 'pending') {
      // ค้นหาด้วย order_id หรือ orderNumber
      const orderFromMetadata = await prisma.order.findFirst({
        where: {
          OR: [
            { id: parseInt(charge.metadata.order_id) },
            { orderNumber: charge.metadata.order_id }
          ]
        },
        include: {
          paymentInfo: true
        }
      });
      
      if (orderFromMetadata) {
        // ถ้าพบ order แต่ยังไม่มีข้อมูลใน paymentInfo ให้สร้างใหม่
        if (!orderFromMetadata.paymentInfo) {
          await prisma.paymentInfo.create({
            data: {
              orderId: orderFromMetadata.id,
              paymentMethod: 'CREDIT_CARD',
              transactionId: chargeId,
              amount: parseInt(charge.amount) / 100, // แปลงจากสตางค์เป็นบาท
              status: charge.status === 'successful' ? 'CONFIRMED' : 'PENDING',
              paymentDate: charge.status === 'successful' ? new Date() : null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        } 
        // ถ้ามีข้อมูลใน paymentInfo อยู่แล้ว ให้อัพเดท
        else {
          await prisma.paymentInfo.update({
            where: {
              id: orderFromMetadata.paymentInfo.id
            },
            data: {
              status: charge.status === 'successful' ? 'CONFIRMED' : 'PENDING',
              paymentDate: charge.status === 'successful' ? new Date() : null,
              updatedAt: new Date()
            }
          });
        }
        
        // อัพเดทสถานะการชำระเงินในตาราง order ด้วย
        if (charge.status === 'successful') {
          await prisma.order.update({
            where: {
              id: orderFromMetadata.id
            },
            data: {
              paymentStatus: 'CONFIRMED',
              updatedAt: getBangkokDateTime()
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          message: charge.status === 'successful' ? 'การชำระเงินสำเร็จ' : 'รอการชำระเงิน',
          orderNumber: orderFromMetadata.orderNumber,
          status: charge.status
        });
      }
    }
    
    // กรณีพบ order จาก paymentInfo
    if (order && order.paymentInfo) {
      // อัพเดทสถานะการชำระเงิน
      if (charge.status === 'successful' && order.paymentInfo.status !== 'CONFIRMED') {
        // อัพเดทสถานะใน paymentInfo
        await prisma.paymentInfo.update({
          where: {
            id: order.paymentInfo.id
          },
          data: {
            status: 'CONFIRMED',
            paymentDate: getBangkokDateTime(),
            updatedAt: getBangkokDateTime()
          }
        });
        
        // อัพเดทสถานะใน order
        await prisma.order.update({
          where: {
            id: order.id
          },
          data: {
            paymentStatus: 'CONFIRMED',
            updatedAt: getBangkokDateTime()
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: charge.status === 'successful' ? 'การชำระเงินสำเร็จ' : 'รอการชำระเงิน',
        orderNumber: order.orderNumber,
        status: charge.status
      });
    } else if (order && !order.paymentInfo && charge.status === 'successful') {
      // กรณีพบ order แต่ไม่มี paymentInfo และการชำระเงินสำเร็จ
      // สร้าง paymentInfo ใหม่
      await prisma.paymentInfo.create({
        data: {
          orderId: order.id,
          paymentMethod: 'CREDIT_CARD',
          transactionId: chargeId,
          amount: parseInt(charge.amount) / 100,
          status: 'CONFIRMED',
          paymentDate: getBangkokDateTime(),
          createdAt: new Date(),
          updatedAt: getBangkokDateTime()
        }
      });
      
      // อัพเดทสถานะใน order
      await prisma.order.update({
        where: {
          id: order.id
        },
        data: {
          paymentStatus: 'CONFIRMED',
          updatedAt: getBangkokDateTime()
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'การชำระเงินสำเร็จ',
        orderNumber: order.orderNumber,
        status: charge.status
      });
    }
    
    // กรณีไม่พบ order แต่การชำระเงินสำเร็จ (อาจเกิดจาก race condition หรือ webhook ยังไม่ได้ประมวลผล)
    if (charge.status === 'successful') {
      return NextResponse.json({
        success: true,
        message: 'การชำระเงินสำเร็จแต่ไม่พบข้อมูลคำสั่งซื้อ กรุณาติดต่อเจ้าหน้าที่',
        status: charge.status
      });
    }
    
    // กรณีอื่นๆ
    return NextResponse.json({
      success: false,
      message: 'ไม่พบข้อมูลคำสั่งซื้อที่เกี่ยวข้องกับการชำระเงินนี้',
      status: charge.status
    });
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน'
      },
      { status: 500 }
    );
  }
} 