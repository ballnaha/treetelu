import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * บันทึก log ลงไฟล์
 * @param data ข้อมูลที่ต้องการบันทึก
 * @param prefix คำนำหน้าชื่อไฟล์
 */
const logToFile = async (data: any, prefix: string = 'omise-webhook') => {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    
    // สร้างโฟลเดอร์ logs ถ้ายังไม่มี
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${prefix}-${timestamp}.json`);
    
    await fs.promises.writeFile(logFile, JSON.stringify(data, null, 2));
    console.log(`Logged data to ${logFile}`);
  } catch (err) {
    console.error('Error writing log file:', err);
  }
};

/**
 * Webhook handler สำหรับรับเหตุการณ์จาก Omise
 * มีหน้าที่รับข้อมูลจาก Omise webhook เมื่อมีการชำระเงินสำเร็จ
 * จะอัพเดทสถานะการชำระเงินในฐานข้อมูลโดยไม่กระทบกับ user flow บนหน้าเว็บ
 */
export async function POST(request: NextRequest) {
  try {
    // บันทึก log แสดงว่า webhook ถูกเรียก
    console.log('====== Webhook called at', new Date().toISOString(), '======');
    
    // รับข้อมูล webhook จาก Omise
    const body = await request.json();
    
    // เพิ่ม logging เพื่อเก็บข้อมูล webhook ทั้งหมด
    await logToFile(body, 'omise-webhook-full');
    
    // ตรวจสอบว่าเป็น event ที่เกี่ยวข้องกับการชำระเงินหรือไม่
    if (!body || !body.key) {
      console.log('Invalid webhook payload, missing key');
      return NextResponse.json({ success: false, message: 'Invalid webhook payload' }, { status: 400 });
    }
    
    console.log('Received Omise webhook:', body.key, 'at', new Date().toISOString());
    
    // ตรวจสอบประเภทของ event
    // charge.complete - สำหรับการชำระเงินที่เสร็จสมบูรณ์ (รวมการจัดการ 3DS)
    if (body.key === 'charge.complete') {
      // ข้อมูลการชำระเงิน
      const charge = body.data;
      if (!charge || !charge.id) {
        console.log('Invalid charge data, missing charge id');
        return NextResponse.json({ success: false, message: 'Invalid charge data' }, { status: 400 });
      }
      
      console.log('[charge.complete] Processing charge:', charge.id);
      console.log('[charge.complete] Charge status:', charge.status);
      console.log('[charge.complete] Charge amount:', charge.amount / 100, 'THB');
      console.log('[charge.complete] Authorized:', charge.authorized);
      console.log('[charge.complete] Paid:', charge.paid);
      console.log('[charge.complete] Metadata:', JSON.stringify(charge.metadata));
      
      // สำหรับบัตรเครดิต หลังจากผ่าน 3DS สถานะจะเป็น successful
      const isSuccessful = charge.status === 'successful';
      
      // ถ้าไม่สำเร็จก็ไม่ต้องทำอะไร
      if (!isSuccessful) {
        console.log('[charge.complete] Charge is not successful, no action needed');
        return NextResponse.json({ success: true, message: 'Charge not successful, no action taken' });
      }
      
      // บันทึก log ข้อมูลการชำระเงินสำเร็จ
      await logToFile({
        event: 'charge.complete',
        chargeId: charge.id,
        status: charge.status,
        amount: charge.amount / 100,
        metadata: charge.metadata,
        timestamp: new Date().toISOString()
      }, 'omise-payment-success');
      
      // ค้นหา order ที่เกี่ยวข้องกับการชำระเงินนี้โดยใช้หลายวิธี
      let order = null;
      let paymentInfo = null;
      
      // 1. ค้นหาจาก payment_info.transactionId
      try {
        paymentInfo = await prisma.paymentInfo.findFirst({
          where: {
            transactionId: charge.id
          },
          include: {
            order: true
          }
        });
        
        if (paymentInfo?.order) {
          console.log('[charge.complete] Found order via payment_info:', paymentInfo.order.id);
          order = paymentInfo.order;
        }
      } catch (err) {
        console.error('[charge.complete] Error searching payment_info:', err);
      }
      
      // 2. ถ้าไม่เจอ ให้ค้นหาจาก metadata
      if (!order && charge.metadata && charge.metadata.order_id) {
        try {
          // ถ้า order_id เป็น 'pending' แสดงว่ายังไม่มีการเชื่อมโยงกับ order ในฐานข้อมูล
          if (charge.metadata.order_id !== 'pending') {
            // พยายามแปลงเป็นตัวเลข
            let orderId: any = charge.metadata.order_id;
            try {
              orderId = parseInt(charge.metadata.order_id);
            } catch (e) {
              // ถ้าแปลงไม่ได้ ให้ใช้ค่าเดิม
            }
            
            // ค้นหาด้วย id หรือ orderNumber
            order = await prisma.order.findFirst({
              where: {
                OR: [
                  { id: typeof orderId === 'number' ? orderId : undefined },
                  { orderNumber: typeof orderId === 'string' ? orderId : undefined }
                ]
              },
              include: {
                paymentInfo: true
              }
            });
            
            if (order) {
              console.log('[charge.complete] Found order via metadata:', order.id);
              if (order.paymentInfo) {
                paymentInfo = order.paymentInfo;
              }
            }
          }
        } catch (err) {
          console.error('[charge.complete] Error searching by metadata:', err);
        }
      }
      
      // 3. ถ้าไม่เจอ ให้ค้นหาจาก orderNumber ใน charge.description (ถ้ามี)
      if (!order && charge.description) {
        try {
          // ดึง orderNumber จาก description หากมีรูปแบบที่เข้าใจได้
          const orderNumberMatch = charge.description.match(/[A-Z0-9]{10,}/);
          if (orderNumberMatch) {
            const possibleOrderNumber = orderNumberMatch[0];
            
            order = await prisma.order.findFirst({
              where: {
                orderNumber: possibleOrderNumber
              },
              include: {
                paymentInfo: true
              }
            });
            
            if (order) {
              console.log('[charge.complete] Found order via description:', order.id);
              if (order.paymentInfo) {
                paymentInfo = order.paymentInfo;
              }
            }
          }
        } catch (err) {
          console.error('[charge.complete] Error searching by description:', err);
        }
      }
      
      // ถ้าพบ order ให้อัพเดทสถานะการชำระเงิน
      if (order) {
        console.log('[charge.complete] Processing payment for order:', order.id, order.orderNumber);
        
        try {
          // 1. อัพเดทสถานะการชำระเงินในตาราง order
          await prisma.order.update({
            where: {
              id: order.id
            },
            data: {
              paymentStatus: 'CONFIRMED',
              updatedAt: new Date()
            }
          });
          
          console.log('[charge.complete] Updated order.paymentStatus to CONFIRMED');
          
          // 2. อัพเดทหรือสร้าง payment_info
          if (paymentInfo) {
            // อัพเดท payment_info ที่มีอยู่แล้ว
            await prisma.paymentInfo.update({
              where: {
                id: paymentInfo.id
              },
              data: {
                status: 'CONFIRMED',
                paymentDate: new Date(),
                transactionId: charge.id, // อัพเดท transactionId อีกครั้งเพื่อความแน่ใจ
                updatedAt: new Date()
              }
            });
            console.log('[charge.complete] Updated existing payment_info');
          } else {
            // สร้าง payment_info ใหม่
            await prisma.paymentInfo.create({
              data: {
                orderId: order.id,
                paymentMethod: 'CREDIT_CARD', // บัตรเครดิตสำหรับ 3DS
                transactionId: charge.id,
                amount: parseFloat((charge.amount / 100).toFixed(2)),
                status: 'CONFIRMED',
                paymentDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log('[charge.complete] Created new payment_info');
          }
          
          return NextResponse.json({
            success: true,
            message: 'Payment confirmed and order updated successfully',
            orderId: order.id,
            orderNumber: order.orderNumber
          });
        } catch (err) {
          console.error('[charge.complete] Error updating order/payment_info:', err);
          await logToFile({
            event: 'charge.complete.error',
            error: err,
            charge: charge,
            order: order,
            timestamp: new Date().toISOString()
          }, 'omise-payment-error');
          
          return NextResponse.json({
            success: false,
            message: 'Error updating order status',
            error: err instanceof Error ? err.message : String(err)
          }, { status: 500 });
        }
      } 
      // กรณีไม่พบ order แต่พบว่ามี metadata.order_id เป็น pending
      else if (charge.metadata && charge.metadata.order_id === 'pending') {
        console.log('[charge.complete] Order ID is pending, saving charge details for later processing');
        
        // บันทึกข้อมูลการชำระเงินสำเร็จที่ยังไม่มี order
        await logToFile({
          event: 'charge.complete.pending_order',
          chargeId: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          metadata: charge.metadata,
          timestamp: new Date().toISOString()
        }, 'omise-payment-pending');
        
        // พยายามบันทึกลงในตาราง pending_payments ถ้ามี
        try {
          // ใช้การเรียกตรงๆถึงฐานข้อมูลเพื่อแก้ปัญหาการเข้าถึงโมเดล
          const result = await prisma.$executeRaw`
            INSERT INTO pending_payments (
              charge_id, amount, payment_method, status, metadata, processed, created_at, updated_at
            ) VALUES (
              ${charge.id}, 
              ${parseFloat((charge.amount / 100).toFixed(2))}, 
              'CREDIT_CARD', 
              'CONFIRMED', 
              ${JSON.stringify(charge)}, 
              false, 
              NOW(), 
              NOW()
            )
          `;
          console.log('[charge.complete] Saved to pending_payments table:', result);
        } catch (err) {
          console.log('[charge.complete] Could not save to pending_payments table:', err);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Payment received but order not yet fully created, saved for later processing',
          chargeId: charge.id
        });
      }
      // กรณีไม่พบ order ที่เกี่ยวข้อง
      else {
        console.log('[charge.complete] Order not found for charge:', charge.id);
        
        // บันทึกข้อมูลการชำระเงินที่ไม่พบ order
        await logToFile({
          event: 'charge.complete.order_not_found',
          chargeId: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          metadata: charge.metadata,
          timestamp: new Date().toISOString()
        }, 'omise-payment-no-order');
        
        return NextResponse.json({ 
          success: false,
          message: 'Order not found for this charge',
          chargeId: charge.id
        }, { status: 404 });
      }
    }
    
    // สำหรับการชำระเงินผ่าน PromptPay ที่สำเร็จ
    else if (body.key === 'source.complete' && body.data && body.data.flow === 'offline' && body.data.type === 'promptpay') {
      console.log('[source.complete] PromptPay payment completed:', body.data);
      
      try {
        // สร้าง Omise instance
        const omise = require('omise')({
          publicKey: process.env.OMISE_PUBLIC_KEY,
          secretKey: process.env.OMISE_SECRET_KEY,
        });
        
        // ต้องค้นหา charge ที่เกี่ยวข้องกับ source นี้
        console.log('[source.complete] Looking for charges linked to source:', body.data.id);
        
        // เพิ่ม timestamp ในการค้นหาเพื่อลดปัญหาการใช้ cache
        const timestamp = Date.now();
        const charges = await omise.charges.list({ limit: 10, order: 'reverse_chronological', _t: timestamp });
        
        // ค้นหา charge ที่ใช้ source นี้
        const charge = charges.data.find((c: any) => 
          c.source?.id === body.data.id || 
          (c.metadata && c.metadata.source_id === body.data.id)
        );

        if (charge) {
          console.log('[source.complete] Found charge linked to this source:', charge.id);
          console.log('[source.complete] Charge status:', charge.status);
          console.log('[source.complete] Charge amount:', charge.amount / 100, 'THB');

          // ค้นหา order และ payment info
          let order = null;
          let paymentInfo = null;
          
          // 1. ค้นหา order จาก paymentInfo ที่มี transactionId เท่ากับ charge id
          try {
            paymentInfo = await prisma.paymentInfo.findFirst({
              where: {
                transactionId: charge.id
              },
              include: {
                order: true
              }
            });
            
            if (paymentInfo?.order) {
              order = paymentInfo.order;
              console.log('[source.complete] Found order via payment_info:', order.id);
              
              // อัพเดทสถานะการชำระเงิน
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: 'CONFIRMED',
                  updatedAt: new Date()
                }
              });
              
              // อัพเดท payment info
              await prisma.paymentInfo.update({
                where: { id: paymentInfo.id },
                data: {
                  status: 'CONFIRMED',
                  paymentDate: new Date(),
                  updatedAt: new Date()
                }
              });
              
              console.log('[source.complete] Updated order and payment info for PromptPay payment');
              
              return NextResponse.json({
                success: true,
                message: 'PromptPay payment confirmed and order updated',
                orderId: order.id,
                orderNumber: order.orderNumber
              });
            }
          } catch (err) {
            console.error('[source.complete] Error searching payment_info:', err);
          }
          
          // 2. ถ้าไม่พบจาก paymentInfo ให้ค้นหาโดยตรงจาก order
          if (!order) {
            order = await prisma.order.findFirst({
              where: {
                paymentInfo: {
                  transactionId: charge.id
                }
              }
            });
            
            if (order) {
              console.log('[source.complete] Found order via paymentInfo:', order.id);
              
              // อัพเดทสถานะการชำระเงิน
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: 'CONFIRMED',
                  updatedAt: new Date()
                }
              });
              
              // สร้าง payment info ถ้ายังไม่มี
              const paymentInfoExists = await prisma.paymentInfo.findUnique({
                where: { orderId: order.id }
              });
              
              if (!paymentInfoExists) {
                await prisma.paymentInfo.create({
                  data: {
                    orderId: order.id,
                    paymentMethod: 'PROMPTPAY',
                    transactionId: charge.id,
                    amount: parseFloat((charge.amount / 100).toFixed(2)),
                    status: 'CONFIRMED',
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                });
              }
              
              console.log('[source.complete] Updated order for PromptPay payment');
              
              return NextResponse.json({
                success: true,
                message: 'PromptPay payment confirmed and order updated',
                orderId: order.id,
                orderNumber: order.orderNumber
              });
            }
          }
          
          // กรณีไม่พบ order ให้บันทึกลงในตาราง pending_payment เพื่อรอการประมวลผลในภายหลัง
          // ตรวจสอบว่ามีข้อมูลใน pending_payment แล้วหรือไม่
          const pendingPayment = await prisma.pendingPayment.findFirst({
            where: { charge_id: charge.id }
          });
          
          if (pendingPayment) {
            // อัพเดทสถานะถ้าพบ
            await prisma.pendingPayment.update({
              where: { id: pendingPayment.id },
              data: {
                status: 'CONFIRMED',
                updated_at: new Date()
              }
            });
            
            console.log('[source.complete] Updated existing pending payment for PromptPay');
            
            // เพิ่ม log ข้อมูลเพื่อการดีบัก
            await logToFile({
              event: 'promptpay.payment.pending_updated',
              charge_id: charge.id,
              amount: charge.amount / 100,
              metadata: charge.metadata,
              timestamp: new Date().toISOString()
            }, 'omise-promptpay-pending');
          } else {
            // สร้าง pending payment ใหม่
            try {
              await prisma.pendingPayment.create({
                data: {
                  charge_id: charge.id,
                  amount: charge.amount / 100,
                  payment_method: 'PROMPTPAY',
                  status: 'CONFIRMED',
                  metadata: charge,
                  processed: false,
                  created_at: new Date(),
                  updated_at: new Date()
                }
              });
              
              console.log('[source.complete] Created new pending payment for PromptPay');
              
              // เพิ่ม log ข้อมูลเพื่อการดีบัก
              await logToFile({
                event: 'promptpay.payment.pending_created',
                charge_id: charge.id,
                amount: charge.amount / 100,
                metadata: charge.metadata,
                timestamp: new Date().toISOString()
              }, 'omise-promptpay-pending');
            } catch (err) {
              console.error('[source.complete] Error creating pending payment:', err);
            }
          }
        } else {
          console.log('[source.complete] No charges found for PromptPay source:', body.data.id);
        }
      } catch (error) {
        console.error('[source.complete] Error processing PromptPay webhook:', error);
      }
      
      await logToFile(body.data, 'omise-promptpay-complete');
      return NextResponse.json({ success: true, message: 'PromptPay webhook received' });
    }
    
    // รองรับ event ประเภทอื่นๆ
    return NextResponse.json({ success: true, message: 'Webhook received but no action taken' });
    
  } catch (error) {
    console.error('Error processing Omise webhook:', error);
    await logToFile({
      event: 'webhook.error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, 'omise-webhook-error');
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, 
      { status: 500 }
    );
  }
} 