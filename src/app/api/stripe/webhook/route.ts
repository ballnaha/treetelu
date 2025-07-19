import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { format, addHours } from 'date-fns';
import { th as thLocale } from 'date-fns/locale';
import { createOrderNotificationEmbed, sendDiscordNotification } from '@/utils/discordUtils';
import { Resend } from 'resend';
import { getBangkokDateTime, convertToBangkokTime } from '@/utils/dateUtils';
import { PaymentMethod } from '@prisma/client';
import { calculateShippingCost } from '@/utils/shippingUtils';

// สร้าง Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// สร้าง Resend instance สำหรับส่งอีเมล
const resend = new Resend(process.env.RESEND_API_KEY || '');

// กำหนด interface สำหรับข้อมูลสินค้า
interface OrderItem {
  productId: number;
  productName: string;
  productImg?: string;
  quantity: number;
  unitPrice: number | string;
}

// กำหนด interface สำหรับ OrderItem จาก database
interface DbOrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImg?: string | null;
  quantity: number;
  unitPrice: any; // Decimal จาก Prisma
  totalPrice: any; // Decimal จาก Prisma
  createdAt: Date;
  updatedAt: Date;
}

// ฟังก์ชันสำหรับส่งอีเมลยืนยันคำสั่งซื้อ
const sendOrderConfirmationEmail = async (orderData: any, paymentInfo?: any) => {
  try {
    console.log('Sending order confirmation email for:', {
      orderNumber: orderData.orderNumber,
      email: orderData.customerInfo?.email
    });
    
    // คำนวณราคารวมทั้งหมด
    const subtotal = Number(orderData.items.reduce((sum: number, item: OrderItem) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0));
    
    // คำนวณค่าจัดส่งจากการตั้งค่าในฐานข้อมูล
    const shippingCost = await calculateShippingCost(subtotal);
    
    // คำนวณส่วนลด (ถ้ามี)
    const discount = Number(orderData.discount || 0);
    
    // คำนวณยอดรวมทั้งสิ้น (หักส่วนลดด้วย)
    const totalAmount = subtotal + shippingCost - discount;

    // แปลงวันที่จัดส่งเป็น UTC+7
    const deliveryDate = orderData.shippingInfo.deliveryDate 
      ? addHours(new Date(orderData.shippingInfo.deliveryDate), 7)
      : null;

    // กำหนดข้อความวิธีการชำระเงินที่เหมาะสม
    let paymentMethodText = 'บัตรเครดิต/เดบิต (Stripe)';
    
    // ตรวจสอบประเภทการชำระเงิน
    if (orderData.paymentMethod === 'PROMPTPAY' || orderData.stripePaymentMethodType === 'promptpay') {
      paymentMethodText = 'พร้อมเพย์ (Stripe)';
    } else if (orderData.paymentMethod === 'CREDIT_CARD' || orderData.stripePaymentMethodType === 'card') {
      paymentMethodText = 'บัตรเครดิต/เดบิต (Stripe)';
    } else if (orderData.paymentMethod === 'BANK_TRANSFER') {
      paymentMethodText = 'โอนเงินผ่านธนาคาร';
    }

    const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/logo.webp" alt="Treetelu Logo" style="max-width: 150px; height: auto;"/>
          </div>
          <h1 style="color: #24B493; font-size: 24px;">ขอบคุณสำหรับคำสั่งซื้อ</h1>
          
          <div style="background-color: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 4px; text-align: center;">
            <p style="margin: 0; font-size: 16px;">
              <strong>เลขที่คำสั่งซื้อ:</strong> <span style="color: #24B493;">${orderData.orderNumber}</span>
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2>รายการสินค้า</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">สินค้า</th>
                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">จำนวน</th>
                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">ราคา/ชิ้น</th>
                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">รวม</th>
              </tr>
              ${orderData.items.map((item: OrderItem) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName}</td>
                  <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${Number(item.unitPrice).toLocaleString()} บาท</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${(Number(item.unitPrice) * item.quantity).toLocaleString()} บาท</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">รวมค่าสินค้า:</td>
                <td style="padding: 8px; text-align: right;">${subtotal.toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">ค่าจัดส่ง:</td>
                <td style="padding: 8px; text-align: right;">${shippingCost === 0 ? 'ฟรี' : `${shippingCost.toLocaleString()} บาท`}</td>
              </tr>
              ${discount > 0 ? `
                <tr>
                  <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">ส่วนลด${orderData.discountCode ? ` (${orderData.discountCode})` : ''}:</td>
                  <td style="padding: 8px; text-align: right;">-${discount.toLocaleString()} บาท</td>
                </tr>
              ` : ''}
              <tr style="background-color: #f5f5f5;">
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">ยอดรวมทั้งสิ้น:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #24B493;">${totalAmount.toLocaleString()} บาท</td>
              </tr>
            </table>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border-radius: 4px;">
            <h2 style="color: #2e7d32; margin-top: 0;">🎉 ชำระเงินสำเร็จแล้ว!</h2>
            <p style="margin: 5px 0;">
              ขอบคุณสำหรับการสั่งซื้อ เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว
              ทางร้านจะดำเนินการจัดส่งสินค้าให้คุณโดยเร็วที่สุด
            </p>
            <p style="margin: 5px 0; color: #2e7d32;">
              <strong>วิธีการชำระเงิน:</strong> ${paymentMethodText}
            </p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
            <h2 style="margin-top: 0;">ข้อมูลการจัดส่ง</h2>
            <p style="margin: 5px 0; color: #34495e;">
              <strong>ชื่อผู้รับ:</strong> ${orderData.shippingInfo.receiverName} ${orderData.shippingInfo.receiverLastname}
            </p>
            
            <p style="margin: 5px 0; color: #34495e;">
              <strong>เบอร์โทรศัพท์:</strong> ${orderData.shippingInfo.receiverPhone}
            </p>
            
            <p style="margin: 5px 0; color: #34495e;">
              <strong>ที่อยู่:</strong> ${orderData.shippingInfo.addressLine}
            </p>
            
            ${orderData.shippingInfo.tambonName !== 'จัดส่งให้ผู้รับโดยตรง' || orderData.shippingInfo.amphureName !== 'จัดส่งให้ผู้รับโดยตรง' || orderData.shippingInfo.provinceName !== 'จัดส่งให้ผู้รับโดยตรง' ? `
            <p style="margin: 5px 0; color: #34495e;">
              <strong>ตำบล/แขวง:</strong> ${orderData.shippingInfo.tambonName || '-'}
            </p>
           
            <p style="margin: 5px 0; color: #34495e;">
              <strong>อำเภอ/เขต:</strong> ${orderData.shippingInfo.amphureName || '-'}
            </p>
           
            <p style="margin: 5px 0; color: #34495e;">
              <strong>จังหวัด:</strong> ${orderData.shippingInfo.provinceName || '-'}
            </p>
            
            <p style="margin: 5px 0; color: #34495e;">
              <strong>รหัสไปรษณีย์:</strong> ${orderData.shippingInfo.zipCode || '-'}
            </p>
            ` : ''}

            ${deliveryDate ? `
              <p style="margin: 5px 0; color: #34495e;">
                <strong>วันที่จัดส่ง:</strong> ${format(deliveryDate, 'dd MMMM yyyy', { locale: thLocale })}
              </p>
            ` : ''}
          </div>
          
          <div style="margin: 20px 0; text-align: center; color: #666;">
            <p>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราที่ <a href="mailto:info@treetelu.com" style="color: #24B493;">info@treetelu.com</a> หรือ Line: <strong>@treetelu</strong></p>
          </div>
        </div>
      `;

    // ส่งอีเมลด้วย Resend
    await resend.emails.send({
      from: 'Treetelu - ต้นไม้ในกระถาง <no-reply@treetelu.com>',
      to: orderData.customerInfo?.email || 'info@treetelu.com',
      subject: 'ขอบคุณสำหรับคำสั่งซื้อ #' + orderData.orderNumber + ' (ชำระเงินสำเร็จ)',
      html: emailContent,
    });

    // ตรวจสอบว่าส่งอีเมลได้สำเร็จหรือไม่
    return { success: true, message: 'ส่งอีเมลสำเร็จ' };
  } catch (error) {
    console.error('การส่งอีเมลล้มเหลว:', error);
    return { success: false, message: 'การส่งอีเมลล้มเหลว' };
  }
};

// เพิ่มฟังก์ชันสำหรับแปลง productId
async function transformProductId(stripeProductId: string): Promise<number> {
  try {
    // ตรวจสอบว่า stripeProductId มีค่าหรือไม่
    if (!stripeProductId || typeof stripeProductId !== 'string') {
      console.log('Empty or invalid productId from Stripe');
      return 1; // ค่าเริ่มต้น
    }
    
    // ตรวจสอบว่ามี metadata.productId หรือไม่
    let productId = parseInt(stripeProductId);
    
    // ถ้าไม่มี productId ที่ถูกต้อง ให้หาสินค้าแรกในระบบ
    if (isNaN(productId) || productId <= 0) {
      console.log('Invalid productId from Stripe:', stripeProductId);
      // ถ้าไม่มี productId ที่ถูกต้อง ให้ใช้สินค้าแรกในระบบ
      try {
        const firstProduct = await prisma.product.findFirst({
          orderBy: {
            id: 'asc'
          }
        });
        
        if (firstProduct) {
          console.log('Using first product instead:', firstProduct.id, firstProduct.productName);
          return firstProduct.id;
        } else {
          console.error('No products found in the system');
          return 1; // ใช้ ID=1 เป็นค่าเริ่มต้น (ควรมีในระบบ)
        }
      } catch (dbError) {
        console.error('Error finding first product:', dbError);
        return 1; // ใช้ ID=1 เป็นค่าเริ่มต้น
      }
    }
    
    // ตรวจสอบว่า productId นี้มีอยู่จริงในฐานข้อมูลหรือไม่
    try {
      const product = await prisma.product.findUnique({
        where: {
          id: productId
        }
      });
      
      if (!product) {
        console.log('Product not found with ID:', productId);
        // ถ้าไม่พบ ให้ใช้สินค้าแรกในระบบ
        const firstProduct = await prisma.product.findFirst({
          orderBy: {
            id: 'asc'
          }
        });
        
        if (firstProduct) {
          console.log('Using first product instead:', firstProduct.id, firstProduct.productName);
          return firstProduct.id;
        } else {
          console.error('No products found in the system');
          return 1; // ใช้ ID=1 เป็นค่าเริ่มต้น (ควรมีในระบบ)
        }
      }
      
      console.log('Found product with ID:', productId, product.productName);
      return productId;
    } catch (dbError) {
      console.error('Error checking product ID:', dbError);
      return 1; // ใช้ ID=1 เป็นค่าเริ่มต้น
    }
  } catch (error) {
    console.error('Error transforming productId:', error);
    return 1; // ใช้ ID=1 เป็นค่าเริ่มต้น (ควรมีในระบบ)
  }
}

// Webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') || '';
    
    // ตรวจสอบ webhook signature เพื่อยืนยันว่าเป็นคำขอจาก Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    // จัดการ event ตามประเภท
    switch (event.type) {
      case 'checkout.session.completed': {
        const sessionData = event.data.object as Stripe.Checkout.Session;
        
        // ตรวจสอบว่ามี session id หรือไม่
        if (!sessionData.id) {
          console.error('No session ID found in webhook event');
          return NextResponse.json(
            { error: 'No session ID found in webhook event' },
            { status: 400 }
          );
        }
        
        // สกัดข้อมูลสำคัญจาก metadata
        const metadata = sessionData.metadata || {};
        const orderId = metadata.order_id || '';
        const orderNumber = metadata.order_number || '';
        
        console.log('Webhook received: checkout.session.completed', {
          sessionId: sessionData.id,
          orderId,
          orderNumber
        });
        
        // ค้นหา Order จากฐานข้อมูล ตามลำดับความสำคัญ:
        // 1. ค้นหาจาก stripeSessionId
        // 2. ค้นหาจาก metadata.order_id 
        // 3. ค้นหาจาก metadata.order_number
        let order = null;
        
        // 1. ค้นหาจาก stripeSessionId
        order = await prisma.order.findFirst({
          where: {
            stripeSessionId: sessionData.id,
          },
          include: {
            orderItems: true,
            customerInfo: true,
            shippingInfo: true
          }
        });
        
        // 2. ถ้าไม่พบ ให้ค้นหาจาก order_id ใน metadata
        if (!order && orderId) {
          try {
            const orderIdNum = parseInt(orderId);
            if (!isNaN(orderIdNum)) {
              order = await prisma.order.findUnique({
                where: {
                  id: orderIdNum
                },
                include: {
                  orderItems: true,
                  customerInfo: true,
                  shippingInfo: true
                }
              });
              
              // ถ้าพบ order แต่ยังไม่มี stripeSessionId ให้อัพเดต
              if (order && !order.stripeSessionId) {
                await prisma.order.update({
                  where: { id: order.id },
                  data: { stripeSessionId: sessionData.id }
                });
              }
            }
          } catch (error) {
            console.error(`Error finding order by ID ${orderId}:`, error);
          }
        }
        
        // 3. ถ้ายังไม่พบ ให้ค้นหาจาก order_number ใน metadata
        if (!order && orderNumber) {
          order = await prisma.order.findFirst({
            where: {
              orderNumber: orderNumber
            },
            include: {
              orderItems: true,
              customerInfo: true,
              shippingInfo: true
            }
          });
          
          // ถ้าพบ order แต่ยังไม่มี stripeSessionId ให้อัพเดต
          if (order && !order.stripeSessionId) {
            await prisma.order.update({
              where: { id: order.id },
              data: { stripeSessionId: sessionData.id }
            });
          }
        }
        
        // กรณีพบ Order ให้อัพเดตสถานะการชำระเงิน
        if (order) {
          console.log(`Found order with ID: ${order.id}, orderNumber: ${order.orderNumber}, updating payment status`);
          
          // ตัวแปรสำหรับเก็บข้อมูลวิธีการชำระเงิน
          let paymentMethod = 'CREDIT_CARD' as PaymentMethod; // ค่าเริ่มต้น
          let stripePaymentMethodType = 'card'; // ค่าเริ่มต้น
          
          // ตรวจสอบจาก payment_method_types โดยตรง
          if (sessionData.payment_method_types?.includes('promptpay')) {
            paymentMethod = 'PROMPTPAY' as PaymentMethod;
            stripePaymentMethodType = 'promptpay';
          }
          
          // ตรวจสอบจาก payment_method_types ใน metadata
          if (metadata.payment_method_types) {
            // อาจเป็น array หรือ string
            const paymentMethodTypes = typeof metadata.payment_method_types === 'string'
              ? metadata.payment_method_types.split(',')
              : Array.isArray(metadata.payment_method_types) 
                ? metadata.payment_method_types 
                : [metadata.payment_method_types];
            
            // ตรวจดูว่าใช้ method อะไรจริงๆ
            if (paymentMethodTypes.includes('promptpay') && 
                (metadata.payment_method === 'promptpay' || metadata.payment_type === 'promptpay')) {
              paymentMethod = 'PROMPTPAY' as PaymentMethod;
              stripePaymentMethodType = 'promptpay';
            } else if ((paymentMethodTypes.includes('card') || paymentMethodTypes.includes('credit_card')) && 
                      (metadata.payment_method === 'card' || metadata.payment_type === 'card')) {
              paymentMethod = 'CREDIT_CARD' as PaymentMethod;
              stripePaymentMethodType = 'card';
            } else if (paymentMethodTypes.includes('promptpay')) {
              // ถ้ามีแค่ promptpay ใน payment_method_types แต่ไม่มีใน payment_method หรือ payment_type
              paymentMethod = 'PROMPTPAY' as PaymentMethod;
              stripePaymentMethodType = 'promptpay';
            } else if (paymentMethodTypes.includes('card')) {
              // ถ้ามีแค่ card ใน payment_method_types แต่ไม่มีใน payment_method หรือ payment_type
              paymentMethod = 'CREDIT_CARD' as PaymentMethod;
              stripePaymentMethodType = 'card';
            }
          }
        
          // อัพเดทสถานะการชำระเงินและประเภทการชำระเงิน
          await prisma.order.update({
            where: {
              id: order.id,
            },
            data: {
              paymentStatus: 'CONFIRMED',
              status: 'PAID',
              paymentMethod: paymentMethod,
              stripePaymentMethodType: stripePaymentMethodType,
              updatedAt: getBangkokDateTime(),
            },
          });
        
          // สร้างข้อมูลการชำระเงิน
          let paymentInfo = await prisma.paymentInfo.findFirst({
            where: {
              orderId: order.id,
            },
          });
          
          if (paymentInfo) {
            // อัพเดทข้อมูลการชำระเงินที่มีอยู่แล้ว
            await prisma.paymentInfo.update({
              where: {
                id: paymentInfo.id,
              },
              data: {
                status: 'CONFIRMED',
                paymentDate: getBangkokDateTime(),
                transactionId: sessionData.id,
                paymentMethod: paymentMethod,
                bankName: paymentMethod === 'PROMPTPAY' ? 'พร้อมเพย์' : 'บัตรเครดิต/เดบิต',
                slipUrl: null,
                updatedAt: getBangkokDateTime(),
              },
            });
          } else {
            // สร้างข้อมูลการชำระเงินใหม่
            await prisma.paymentInfo.create({
              data: {
                orderId: order.id,
                paymentMethod: paymentMethod,
                transactionId: sessionData.id,
                amount: parseFloat(order.totalAmount.toString()),
                status: 'CONFIRMED',
                paymentDate: getBangkokDateTime(),
                bankName: paymentMethod === 'PROMPTPAY' ? 'พร้อมเพย์' : 'บัตรเครดิต/เดบิต',
                slipUrl: null,
                createdAt: getBangkokDateTime(),
                updatedAt: getBangkokDateTime(),
              },
            });
          }
          
          console.log(`Updated payment status for order: ${order.id}`);
          
          // ส่งอีเมลยืนยันการชำระเงิน
          try {
            const orderData = {
              ...order,
              items: order.orderItems.map((item: DbOrderItem) => ({
                productId: item.productId,
                productName: item.productName,
                productImg: item.productImg,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice.toString())
              })),
              discount: parseFloat(order.discount.toString()),
              discountCode: order.discountCode,
              stripePaymentMethodType: stripePaymentMethodType
            };
            
            console.log('Sending email notification for Stripe payment');
            const emailResult = await sendOrderConfirmationEmail(orderData);
            if (!emailResult.success) {
              console.warn('Payment confirmed but email sending failed:', emailResult.message);
            }
          } catch (emailError) {
            console.error('Error sending payment confirmation email:', emailError);
            // ไม่คืนค่า error ถ้าการส่งอีเมลล้มเหลว เพราะการชำระเงินยังคงสำเร็จ
          }
          
          // ส่งการแจ้งเตือนไปยัง Discord
          if (process.env.DISCORD_WEBHOOK_URL) {
            try {
              // ค้นหาข้อมูลการชำระเงินเพื่อตรวจสอบว่ามีการส่ง notification ไปแล้วหรือไม่
              const paymentInfo = await prisma.paymentInfo.findFirst({
                where: { orderId: order.id },
                orderBy: { updatedAt: 'desc' }
              });
    
              let discordSent = false;
              
              // ตรวจสอบว่ามีการส่ง Discord notification ไปแล้วหรือไม่
              if (paymentInfo) {
                // ถ้า transactionId ตรงกับ payment_intent.id และสถานะเป็น CONFIRMED แสดงว่าส่งไปแล้ว
                if (paymentInfo.transactionId === sessionData.id && paymentInfo.status === 'CONFIRMED') {
                  console.log(`Discord notification already sent for order ${order.id} with session ${sessionData.id}`);
                  discordSent = true;
                }
              }
              
              // ส่ง Discord notification เฉพาะเมื่อยังไม่เคยส่ง
              if (!discordSent) {
                console.log(`Sending Discord notification for order ${order.id} with session ${sessionData.id}`);
                // ตรวจสอบว่าเป็น promptpay หรือ card จริงๆ
                const isPromptpay = paymentMethod === 'PROMPTPAY' || 
                                   (order.stripePaymentMethodType === 'promptpay');
                
                // สร้างข้อมูลสำหรับ Discord embed
                const orderDataForDiscord = {
                  ...order,
                  items: order.orderItems.map((item: DbOrderItem) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: parseFloat(item.unitPrice.toString())
                  })),
                  customerInfo: order.customerInfo || {},
                  shippingInfo: order.shippingInfo || {},
                  paymentMethod: isPromptpay ? 'PROMPTPAY' : 'CREDIT_CARD',
                  discount: parseFloat(order.discount.toString()),
                  discountCode: order.discountCode,
                  stripePaymentMethodType: paymentMethod === 'PROMPTPAY' ? 'promptpay' : 'card'
                };
                
                // ใช้ createOrderNotificationEmbed แทนการสร้าง embed เอง
                const paymentEmbed = await createOrderNotificationEmbed(orderDataForDiscord);
                
                console.log('Sending Discord notification for Stripe payment - DIRECT', {
                  webhookUrl: !!process.env.DISCORD_WEBHOOK_URL,
                  orderNumber: order.orderNumber,
                  sessionId: sessionData.id,
                  hasItems: order.orderItems?.length > 0
                });
                
                // ส่ง Discord notification
                const discordResult = await sendDiscordNotification(paymentEmbed);
                console.log('Discord notification result:', discordResult ? 'success' : 'failed');
                
                // บันทึกว่าส่ง Discord notification แล้ว
                if (discordResult) {
                  // อัพเดต paymentInfo ถ้ามี
                  if (paymentInfo) {
                    await prisma.paymentInfo.update({
                      where: { id: paymentInfo.id },
                      data: {
                        updatedAt: getBangkokDateTime()
                      }
                    });
                    
                    console.log(`Updated payment info ${paymentInfo.id} with discord notification status for order ${order.id}`);
                  }
                }
              }
            } catch (discordError) {
              console.error('Error in Discord notification process:', discordError);
            }
          }
          
          return NextResponse.json({ success: true });
        } else {
          // ถ้าไม่พบคำสั่งซื้อในฐานข้อมูล ให้สร้าง pending_payment
          console.log(`No order found for session ID: ${sessionData.id} or in metadata`);
          
          // สร้าง pending_payment เพื่อเก็บข้อมูลไว้ก่อน
          try {
            // ดึงข้อมูลลูกค้าจาก metadata
            const customerName = metadata.customer_name || '';
            const customerEmail = metadata.customer_email || '';
            const customerPhone = metadata.customer_phone || '';
            
            // สร้าง pending_payment
            await prisma.pendingPayment.create({
              data: {
                charge_id: sessionData.id,
                payment_method: sessionData.payment_method_types?.includes('promptpay') ? 'PROMPTPAY' as PaymentMethod : 'CREDIT_CARD' as PaymentMethod,
                amount: sessionData.amount_total ? sessionData.amount_total / 100 : 0,
                status: 'CONFIRMED',
                metadata: sessionData.metadata || {},
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                created_at: getBangkokDateTime(),
                updated_at: getBangkokDateTime()
              }
            });
            
            console.log(`Created pending_payment for session ID: ${sessionData.id}`);
          } catch (pendingPaymentError) {
            console.error('Error creating pending_payment:', pendingPaymentError);
          }
          
          return NextResponse.json(
            { message: 'Payment received but no order found. Created pending_payment record.' },
            { status: 200 }
          );
        }
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // ตรวจสอบวิธีการชำระเงินที่แท้จริง
        let paymentMethod = 'CREDIT_CARD' as PaymentMethod; // ค่าเริ่มต้น
        let paymentMethodType = 'card'; // ค่าเริ่มต้น
        
        // ตรวจสอบจาก payment_method_types โดยตรง
        if (paymentIntent.payment_method_options) {
          if (paymentIntent.payment_method_options.promptpay) {
            paymentMethod = 'PROMPTPAY' as PaymentMethod;
            paymentMethodType = 'promptpay';
          } else if (paymentIntent.payment_method_options.card) {
            paymentMethod = 'CREDIT_CARD' as PaymentMethod;
            paymentMethodType = 'card';
          }
        }
        
        console.log(`Webhook: Payment intent succeeded: ${paymentIntent.id}, method: ${paymentMethod}`);
        
        // ค้นหา session ID จาก metadata ของ payment intent
        const metadata = paymentIntent.metadata || {};
        const sessionId = paymentIntent.id || '';
        const orderId = metadata.order_id || '';
        const orderNumber = metadata.order_number || '';
        
        // ค้นหา Order ที่เกี่ยวข้องจากฐานข้อมูล - ใช้ลำดับความสำคัญเดียวกับ checkout.session.completed
        let order = null;
        
        // 1. ค้นหาจาก orderId ที่บันทึกใน metadata
        if (orderId) {
          try {
            const orderIdNum = parseInt(orderId);
            if (!isNaN(orderIdNum)) {
              order = await prisma.order.findFirst({
                where: {
                  id: orderIdNum
                },
                include: {
                  orderItems: true,
                  customerInfo: true,
                  shippingInfo: true
                }
              });
            }
          } catch (error) {
            console.error(`Error finding order by ID ${orderId}:`, error);
          }
        }
        
        // 2. ถ้าไม่พบจาก orderId ให้ค้นหาจาก orderNumber
        if (!order && orderNumber) {
          order = await prisma.order.findFirst({
            where: {
              orderNumber: orderNumber
            },
            include: {
              orderItems: true,
              customerInfo: true,
              shippingInfo: true
            }
          });
        }
        
        // 3. ถ้าไม่พบจาก orderNumber ให้ค้นหาจาก stripeSessionId
        if (!order && sessionId) {
          order = await prisma.order.findFirst({
            where: {
              stripeSessionId: sessionId
            },
            include: {
              orderItems: true,
              customerInfo: true,
              shippingInfo: true
            }
          });
        }
        
        // กรณีพบ Order ให้อัพเดตสถานะเป็นชำระเงินแล้ว
        if (order) {
          console.log(`Found order: ${order.orderNumber} for payment intent: ${paymentIntent.id}, updating payment status`);
          
          // อัพเดตสถานะการชำระเงินและสถานะคำสั่งซื้อ
          await prisma.order.update({
            where: {
              id: order.id
            },
            data: {
              paymentStatus: 'CONFIRMED',
              status: 'PAID',
              paymentMethod: paymentMethod,
              stripePaymentMethodType: paymentMethodType,
              updatedAt: getBangkokDateTime()
            }
          });
          
          // สร้างหรืออัพเดตข้อมูลการชำระเงิน
          const existingPaymentInfo = await prisma.paymentInfo.findFirst({
            where: {
              orderId: order.id
            }
          });
          
          if (existingPaymentInfo) {
            // อัพเดตข้อมูลการชำระเงินที่มีอยู่แล้ว
            await prisma.paymentInfo.update({
              where: {
                id: existingPaymentInfo.id
              },
              data: {
                status: 'CONFIRMED',
                paymentDate: getBangkokDateTime(),
                transactionId: paymentIntent.id,
                paymentMethod: paymentMethod,
                bankName: paymentMethod === 'PROMPTPAY' ? 'พร้อมเพย์' : 'บัตรเครดิต/เดบิต',
                slipUrl: null,
                updatedAt: getBangkokDateTime(),
              }
            });
          } else {
            // สร้างข้อมูลการชำระเงินใหม่
            await prisma.paymentInfo.create({
              data: {
                orderId: order.id,
                paymentMethod: paymentMethod,
                transactionId: paymentIntent.id,
                amount: parseFloat(order.totalAmount.toString()),
                status: 'CONFIRMED',
                paymentDate: getBangkokDateTime(),
                bankName: paymentMethod === 'PROMPTPAY' ? 'พร้อมเพย์' : 'บัตรเครดิต/เดบิต',
                slipUrl: null,
                createdAt: getBangkokDateTime(),
                updatedAt: getBangkokDateTime(),
              }
            });
          }
          
          console.log(`Updated payment status for order: ${order.id}`);
          
          // ส่งอีเมลยืนยันการชำระเงิน
          try {
            const orderData = {
              ...order,
              items: order.orderItems.map((item: DbOrderItem) => ({
                productId: item.productId,
                productName: item.productName,
                productImg: item.productImg,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice.toString())
              })),
              discount: parseFloat(order.discount.toString()),
              discountCode: order.discountCode,
              stripePaymentMethodType: paymentMethodType
            };
            
            console.log('Sending email notification for payment_intent.succeeded');
            const emailResult = await sendOrderConfirmationEmail(orderData);
            if (!emailResult.success) {
              console.warn('Payment confirmed but email sending failed:', emailResult.message);
            }
          } catch (emailError) {
            console.error('Error sending payment confirmation email:', emailError);
          }
          
          // ส่งการแจ้งเตือนไปยัง Discord
          if (process.env.DISCORD_WEBHOOK_URL) {
            try {
              // ค้นหาข้อมูลการชำระเงินเพื่อตรวจสอบว่ามีการส่ง notification ไปแล้วหรือไม่
              const paymentInfo = await prisma.paymentInfo.findFirst({
                where: { orderId: order.id },
                orderBy: { updatedAt: 'desc' }
              });
    
              let discordSent = false;
              
              // ตรวจสอบว่ามีการส่ง Discord notification ไปแล้วหรือไม่
              if (paymentInfo) {
                // ถ้า transactionId ตรงกับ payment_intent.id และสถานะเป็น CONFIRMED แสดงว่าส่งไปแล้ว
                if (paymentInfo.transactionId === paymentIntent.id && paymentInfo.status === 'CONFIRMED') {
                  console.log(`Discord notification already sent for order ${order.id} with payment intent ${paymentIntent.id}`);
                  discordSent = true;
                }
              }
              
              // ส่ง Discord notification เฉพาะเมื่อยังไม่เคยส่ง
              if (!discordSent) {
                console.log(`Sending Discord notification for order ${order.id} with payment intent ${paymentIntent.id}`);
                // ตรวจสอบว่าเป็น promptpay หรือ card จริงๆ
                const isPromptpay = paymentMethodType === 'promptpay' || 
                                   (order.stripePaymentMethodType === 'promptpay');
                
                // สร้างข้อมูลสำหรับ Discord embed
                const orderDataForDiscord = {
                  ...order,
                  items: order.orderItems.map((item: DbOrderItem) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: parseFloat(item.unitPrice.toString())
                  })),
                  customerInfo: order.customerInfo || {},
                  shippingInfo: order.shippingInfo || {},
                  paymentMethod: isPromptpay ? 'PROMPTPAY' : 'CREDIT_CARD',
                  discount: parseFloat(order.discount.toString()),
                  discountCode: order.discountCode,
                  stripePaymentMethodType: paymentMethodType === 'promptpay' ? 'promptpay' : 'card'
                };
                
                // ใช้ createOrderNotificationEmbed แทนการสร้าง embed เอง
                const paymentEmbed = await createOrderNotificationEmbed(orderDataForDiscord);
                
                console.log('Sending Discord notification for payment_intent.succeeded - DIRECT', {
                  webhookUrl: !!process.env.DISCORD_WEBHOOK_URL,
                  orderNumber: order.orderNumber,
                  paymentIntentId: paymentIntent.id,
                  hasItems: order.orderItems?.length > 0
                });
                
                // ส่ง Discord notification
                const discordResult = await sendDiscordNotification(paymentEmbed);
                console.log('Discord notification result:', discordResult ? 'success' : 'failed');
                
                // บันทึกว่าส่ง Discord notification แล้ว
                if (discordResult) {
                  // อัพเดต paymentInfo ถ้ามี
                  if (paymentInfo) {
                    await prisma.paymentInfo.update({
                      where: { id: paymentInfo.id },
                      data: {
                        updatedAt: getBangkokDateTime()
                      }
                    });
                    
                    console.log(`Updated payment info ${paymentInfo.id} with discord notification status for order ${order.id}`);
                  }
                }
              }
            } catch (discordError) {
              console.error('Error in Discord notification process:', discordError);
            }
          }
          
          return NextResponse.json({ success: true, received: true });
        } else {
          console.log(`No order found for payment intent: ${paymentIntent.id}, checking pending_payments...`);
          
          // ถ้าไม่พบ Order ให้ตรวจสอบข้อมูลใน PendingPayment
          let pendingPayment = await prisma.pendingPayment.findFirst({
            where: {
              charge_id: sessionId
            }
          });
          
          // ถ้าไม่พบ pendingPayment ให้สร้างใหม่
          if (!pendingPayment) {
            console.log(`Creating new pending payment for payment intent: ${paymentIntent.id}`);
            
            pendingPayment = await prisma.pendingPayment.create({
              data: {
                charge_id: paymentIntent.id,
                payment_method: paymentMethod,
                amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
                status: 'CONFIRMED',
                metadata: paymentIntent.metadata || {},
                customer_name: paymentIntent.metadata?.customer_name || '',
                customer_email: paymentIntent.metadata?.customer_email || '',
                customer_phone: paymentIntent.metadata?.customer_phone || '',
                created_at: getBangkokDateTime(),
                updated_at: getBangkokDateTime()
              }
            });
          } else {
            // อัพเดต PendingPayment ที่มีอยู่แล้ว
            console.log(`Updating existing pending payment: ${pendingPayment.id}`);
            
            await prisma.pendingPayment.update({
              where: {
                id: pendingPayment.id
              },
              data: {
                status: 'CONFIRMED',
                payment_method: paymentMethod,
                // แก้ไขปัญหา spread metadata
                // ใช้การตรวจสอบแบบปลอดภัยแทน
                updated_at: getBangkokDateTime()
              }
            });
          }
          
          console.log(`Pending payment processed: ${pendingPayment.id}`);
        }
        
        // ส่งคำตอบกลับ
        return NextResponse.json({ success: true, received: true });
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 