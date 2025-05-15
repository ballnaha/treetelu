import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { sendDiscordNotification, createOrderNotificationEmbed } from '@/utils/discordUtils';
import { format, addHours } from 'date-fns';
import thLocale from 'date-fns/locale/th';
import { getBangkokDateTime } from '@/utils/dateUtils';

// ตั้งค่า Resend API Key
const resend = new Resend(process.env.RESEND_API_KEY as string);

// ตรวจสอบการตั้งค่า environment variables
if (!process.env.RESEND_API_KEY) {
  console.warn('Warning: RESEND_API_KEY not configured. Email notifications will not work.');
}

if (!process.env.DISCORD_WEBHOOK_URL) {
  console.warn('Warning: DISCORD_WEBHOOK_URL not configured. Discord notifications will not work.');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      console.error('No session ID provided');
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }

    console.log('Checking session:', sessionId);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-04-30.basil',
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total
    });

    const orders = await prisma.$queryRaw<Array<{id: number, orderNumber: string}>>`
      SELECT o.id, o.orderNumber
      FROM orders o
      JOIN stripecheckout sc ON o.id = sc.orderId
      WHERE sc.sessionId = ${sessionId}
      LIMIT 1
    `;
    console.log('Found orders:', orders);

    if (!orders.length) {
      console.error('No order found for session:', sessionId);
      return NextResponse.json({ error: 'No order found' }, { status: 404 });
    }

    const order = orders[0];
    console.log('Processing order:', order);

    if (session.status === 'complete' && session.payment_status === 'paid') {
      console.log('Session is complete and paid, updating order status');
      
      // สร้างเวลาปัจจุบันของไทย
      const thaiDateTime = getBangkokDateTime();
      
      await prisma.$transaction([
        prisma.$executeRaw`
          UPDATE orders 
          SET status = 'PAID', 
              paymentStatus = 'CONFIRMED',
              updatedAt = ${thaiDateTime}
          WHERE id = ${order.id}
        `,
        prisma.$executeRaw`
          UPDATE payment_info 
          SET status = 'CONFIRMED',
              paymentDate = ${thaiDateTime},
              updatedAt = ${thaiDateTime}
          WHERE orderId = ${order.id}
        `,
        prisma.$executeRaw`
          UPDATE stripecheckout 
          SET status = 'paid',
              amount = ${session.amount_total ? session.amount_total / 100 : 0},
              payment_method = ${session.payment_method_types ? session.payment_method_types[0] : 'card'},
              updatedAt = ${thaiDateTime}
          WHERE sessionId = ${sessionId}
        `
      ]);
      console.log('Order status updated successfully');
      
      // ดึงข้อมูลคำสั่งซื้อและรายละเอียดเพื่อใช้ในการส่งอีเมล
      const orderDetails = await prisma.$queryRaw`
        SELECT o.*, 
               c.firstName AS customerFirstName, 
               c.lastName AS customerLastName,
               c.email AS customerEmail,
               c.phone AS customerPhone
        FROM orders o
        JOIN customer_info c ON o.id = c.orderId
        WHERE o.id = ${order.id}
        LIMIT 1
      `;
      
      console.log('Order details retrieved for notifications:', orderDetails);
      
      if (orderDetails && Array.isArray(orderDetails) && orderDetails.length > 0) {
        const orderDetail = orderDetails[0] as any;
        
        // ดึงรายการสินค้าในคำสั่งซื้อ
        const orderItems = await prisma.$queryRaw`
          SELECT oi.*, p.productName AS productName, p.productImg AS productImg
          FROM order_items oi
          JOIN product p ON oi.productId = p.id
          WHERE oi.orderId = ${order.id}
        ` as any[];
        
        // ดึงข้อมูลการจัดส่ง
        const shippingInfo = await prisma.$queryRaw`
          SELECT * FROM shipping_info
          WHERE orderId = ${order.id}
          LIMIT 1
        `;
        
        if (shippingInfo && Array.isArray(shippingInfo) && shippingInfo.length > 0) {
          // สร้างข้อมูลคำสั่งซื้อสำหรับใช้ในการส่งอีเมลและแจ้งเตือน Discord
          const orderData = {
            orderNumber: orderDetail.orderNumber,
            customerInfo: {
              firstName: orderDetail.customerFirstName,
              lastName: orderDetail.customerLastName,
              email: orderDetail.customerEmail,
              phone: orderDetail.customerPhone
            },
            shippingInfo: shippingInfo[0],
            items: orderItems.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productImg: item.productImg ? `/images/product/${item.productImg}` : null,
              quantity: item.quantity,
              unitPrice: parseFloat(item.unitPrice)
            })),
            paymentMethod: 'STRIPE',
            discount: parseFloat(orderDetail.discountAmount || 0),
            discountCode: orderDetail.discountCode || "",
            paymentStatus: 'CONFIRMED'
          };
          
          // ส่งอีเมลยืนยันการชำระเงินสำเร็จ
          try {
            console.log('Sending order confirmation email...');
            const emailResult = await sendOrderConfirmationEmail(orderData);
            console.log('Email sending result:', emailResult);
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }
          
          // ส่งการแจ้งเตือนไปยัง Discord
          try {
            console.log('Sending Discord notification...');
            
            // ตรวจสอบว่าได้มีการส่ง Discord notification สำหรับคำสั่งซื้อนี้ไปแล้วหรือไม่
            // โดยตรวจสอบจากตาราง log_notification ถ้ามี หรือดูจาก updatedAt ของ order
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 นาทีที่ผ่านมา
            
            // ดึงประวัติการอัพเดต order ในช่วง 5 นาทีที่ผ่านมา (อาจมีการส่ง webhook แล้ว)
            const recentUpdates = await prisma.$queryRaw`
              SELECT COUNT(*) as count FROM payment_info 
              WHERE orderId = ${order.id} 
              AND status = 'CONFIRMED' 
              AND updatedAt > ${fiveMinutesAgo}
            `;
            
            let notificationCount = 0;
            if (recentUpdates && Array.isArray(recentUpdates) && recentUpdates.length > 0) {
              notificationCount = Number(recentUpdates[0].count || 0);
            }
            
            if (notificationCount > 1) {
              console.log(`Skip sending Discord notification: Order ${order.id} was recently updated, notification was likely sent by webhook already`);
            } else {
              // ส่งการแจ้งเตือนไปยัง Discord ตามปกติ
              const embed = createOrderNotificationEmbed({
                ...orderData,
                id: order.id
              });
              const discordResult = await sendDiscordNotification(embed);
              console.log('Discord notification result:', discordResult);
            }
          } catch (discordError) {
            console.error('Error sending Discord notification:', discordError);
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      orderNumber: order.orderNumber,
      status: session.status,
      payment_status: session.payment_status
    });

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับส่งอีเมลแจ้งเตือนการสั่งซื้อสำเร็จ
async function sendOrderConfirmationEmail(orderData: any) {
  try {
    console.log('Starting to send order confirmation email...');
    
    // คำนวณราคารวมทั้งหมด
    const subtotal = Number(orderData.items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0));
    
    // คำนวณค่าจัดส่ง: ฟรีค่าจัดส่งเมื่อซื้อสินค้ามากกว่าหรือเท่ากับ 1,500 บาท
    const shippingCost = subtotal >= 1500 ? 0 : 100;
    
    // คำนวณส่วนลด (ถ้ามี)
    const discount = Number(orderData.discount || 0);
    
    // คำนวณยอดรวมทั้งสิ้น (หักส่วนลดด้วย)
    const totalAmount = subtotal + shippingCost - discount;

    // แปลงวันที่จัดส่งเป็น UTC+7
    const deliveryDate = orderData.shippingInfo.deliveryDate 
      ? addHours(new Date(orderData.shippingInfo.deliveryDate), 7)
      : null;

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
              ${orderData.items.map((item: any) => {
                // แปลง URL รูปภาพให้เป็น absolute URL
                let imageUrl = 'https://via.placeholder.com/80';
                if (item.productImg) {
                  if (item.productImg.startsWith('http')) {
                    imageUrl = item.productImg;
                  } else {
                    imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${item.productImg}`;
                  }
                }
                
                const itemTotal = Number(item.unitPrice) * Number(item.quantity);
                
                return `
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                      <img 
                        src="${imageUrl}" 
                        alt="${item.productName}"
                        style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;"
                        onerror="this.src='https://via.placeholder.com/80'"
                      />
                      <div>
                        <div style="font-weight: bold; padding-left: 10px;">${item.productName}</div>
                        <div style="color: #666; font-size: 0.9em; padding-left: 10px;">จำนวน: ${item.quantity} ชิ้น</div>
                        <div style="color: #666; font-size: 0.9em; padding-left: 10px;">ราคาต่อชิ้น: ฿${Number(item.unitPrice).toLocaleString()}</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align: right; vertical-align: top; padding: 10px 0;">
                    ฿${itemTotal.toLocaleString()}
                  </td>
                </tr>
              `}).join('')}
              <tr style="border-top: 1px solid #eee;">
                <td style="padding: 10px 0;">ยอดรวมสินค้า</td>
                <td style="text-align: right; padding: 10px 0;">฿${subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">ค่าจัดส่ง</td>
                <td style="text-align: right; padding: 10px 0;">${shippingCost === 0 ? 'ฟรี' : `฿${shippingCost.toLocaleString()}`}</td>
              </tr>
              ${orderData.discount && Number(orderData.discount) > 0 ? `
              <tr>
                <td style="padding: 10px 0;">ส่วนลด ${orderData.discountCode ? `(${orderData.discountCode})` : ''}</td>
                <td style="text-align: right; padding: 10px 0; color: #e53935;">-฿${Number(orderData.discount).toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #24B493; font-weight: bold;">
                <td style="padding: 10px 0;">รวมทั้งสิ้น</td>
                <td style="text-align: right; padding: 10px 0;">฿${totalAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #24B493;">ข้อมูลการชำระเงิน</h3>
            <p style="margin: 0;">
              การชำระเงินผ่าน Stripe เรียบร้อยแล้ว<br>
              สถานะ: ชำระเงินแล้ว
            </p>
          </div>

          <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">รายละเอียดการจัดส่ง</h3>
            <p style="margin: 5px 0; color: #34495e;">
              <strong>ผู้รับ:</strong> ${orderData.shippingInfo.receiverName || orderData.customerInfo.firstName} ${orderData.shippingInfo.receiverLastname || orderData.customerInfo.lastName}
            </p>
           
            <p style="margin: 5px 0; color: #34495e;">
              <strong>เบอร์โทรศัพท์:</strong> ${orderData.shippingInfo.receiverPhone || orderData.customerInfo.phone}
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
        </div>
      `;

    console.log('Sending email to:', orderData.customerInfo.email);
    
    // ส่งอีเมลด้วย Resend
    const emailResult = await resend.emails.send({
      from: 'Treetelu - ต้นไม้ในกระถาง <no-reply@treetelu.com>',
      to: orderData.customerInfo.email,
      subject: 'ยืนยันการชำระเงินสำเร็จ - ' + orderData.orderNumber,
      html: emailContent,
    });

    console.log('Email sent successfully:', emailResult);
    return { success: true, message: 'ส่งอีเมลสำเร็จ', data: emailResult };
  } catch (error) {
    console.error('การส่งอีเมลล้มเหลว:', error);
    return { success: false, message: 'การส่งอีเมลล้มเหลว', error: error };
  }
} 