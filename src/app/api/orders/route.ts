import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/utils/orderUtils';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getBangkokDateTime } from '@/utils/dateUtils';
import { Resend } from 'resend';
import { format, addHours } from 'date-fns';
import thLocale from 'date-fns/locale/th';
import { sendDiscordNotification, createOrderNotificationEmbed } from '@/utils/discordUtils';

// ตั้งค่า Resend API Key
const resend = new Resend(process.env.RESEND_API_KEY as string);

// สร้าง schema สำหรับตรวจสอบข้อมูลคำสั่งซื้อ
const orderSchema = z.object({
  customerInfo: z.object({
    firstName: z.string().min(2, 'กรุณาระบุชื่อให้ถูกต้อง'),
    lastName: z.string().min(2, 'กรุณาระบุนามสกุลให้ถูกต้อง'),
    email: z.string().email('กรุณาระบุอีเมลให้ถูกต้อง'),
    phone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง'),
    note: z.string().optional()
  }),
  shippingInfo: z.object({
    receiverName: z.string().min(2, 'กรุณาระบุชื่อผู้รับให้ถูกต้อง'),
    receiverLastname: z.string().min(2, 'กรุณาระบุนามสกุลผู้รับให้ถูกต้อง'),
    receiverPhone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ผู้รับให้ถูกต้อง'),
    addressLine: z.string().min(1, 'กรุณาระบุที่อยู่ให้ครบถ้วน'),
    addressLine2: z.string().optional(),
    provinceId: z.number(),
    provinceName: z.string(),
    amphureId: z.number(),
    amphureName: z.string(),
    tambonId: z.number(),
    tambonName: z.string(),
    zipCode: z.string().min(5, 'กรุณาระบุรหัสไปรษณีย์ให้ถูกต้อง'),
    deliveryDate: z.union([z.string(), z.date(), z.null()]).optional(),
    deliveryTime: z.string().optional(),
    cardMessage: z.string().optional(),
    additionalNote: z.string().optional()
  }),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    productImg: z.string().optional(),
    quantity: z.number().min(1, 'จำนวนสินค้าต้องมากกว่า 0'),
    unitPrice: z.number()
  })).min(1, 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'PROMPTPAY', 'COD']),
  userId: z.union([z.number(), z.string()]).optional(),
  discount: z.number().default(0),
  discountCode: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).optional(),
  paymentReference: z.string().optional(),
  omiseToken: z.string().optional(), // สำหรับ Omise token (card token หรือ charge id สำหรับ promptpay)
  returnUri: z.string().optional() // สำหรับกรณี 3DS redirect
});

// แทนที่ส่วนของการส่งอีเมลด้วย Resend
const sendOrderConfirmationEmail = async (orderData: any) => {
  try {
    // Debug: ตรวจสอบข้อมูล customerInfo และ email
    console.log('Debug - orderData.customerInfo:', JSON.stringify(orderData.customerInfo, null, 2));
    console.log('Debug - Email value:', orderData.customerInfo.email);
    
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
                    imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/product/${item.productImg}`;
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
              ${orderData.paymentMethod === 'CREDIT_CARD' ? `
              การชำระเงินด้วยบัตรเครดิต/เดบิตเรียบร้อยแล้ว<br>
              รหัสการชำระเงิน: ${orderData.paymentReference || '-'}<br>
              สถานะ: ชำระเงินแล้ว
              ` : orderData.paymentMethod === 'PROMPTPAY' ? `
              การชำระเงินด้วย PromptPay<br>
              รหัสการชำระเงิน: ${orderData.paymentReference || '-'}<br>
              สถานะ: ${orderData.paymentStatus === 'CONFIRMED' ? 'ชำระเงินแล้ว' : 'รอการชำระเงิน'}<br>
              ${orderData.paymentStatus !== 'CONFIRMED' ? 'กรุณาสแกน QR code เพื่อชำระเงิน' : ''}
              ` : `
              ธนาคารไทยพาณิชย์ (SCB)<br>
              เลขที่บัญชี: 264-221037-2<br>
              ชื่อบัญชี: นายธัญญา รัตนาวงศ์ไชยา<br>
              `}
            </p>
          </div>

          <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">รายละเอียดการจัดส่ง</h3>
            <p style="margin: 5px 0; color: #34495e;">
              <strong>ผู้รับ:</strong> ${orderData.shippingInfo.receiverName} ${orderData.shippingInfo.receiverLastname}
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
        </div>
      `;

    // ส่งอีเมลด้วย Resend
    await resend.emails.send({
      from: 'Treetelu - ต้นไม้ในกระถาง <no-reply@treetelu.com>',
      to: orderData.customerInfo.email,
      subject: 'ขอบคุณสำหรับคำสั่งซื้อ',
      html: emailContent,
    });

    // อัปเดตข้อมูลอินสแตนซ์หรือบันทึกข้อมูลลงฐานข้อมูลหรืออื่นๆตามความต้องการ
    // ตัวอย่าง: บันทึกข้อมูลลงฐานข้อมูล
    // await saveOrderToDatabase(orderData);

    // ตรวจสอบว่าส่งอีเมลได้สำเร็จหรือไม่
    return { success: true, message: 'ส่งอีเมลสำเร็จ' };
  } catch (error) {
    console.error('การส่งอีเมลล้มเหลว:', error);
    return { success: false, message: 'การส่งอีเมลล้มเหลว' };
  }
};

export async function POST(request: NextRequest) {
  try {
    // อ่านข้อมูลจาก request body
    const body = await request.json();
    
    // ตรวจสอบข้อมูลด้วย schema
    const validatedData = orderSchema.parse(body);
    
    // ถ้ามีการชำระเงินด้วยบัตรเครดิต/เดบิต (Omise)
    if (validatedData.paymentMethod === 'CREDIT_CARD' && validatedData.omiseToken) {
      try {
        // คำนวณยอดเงินทั้งหมด (รวมค่าจัดส่ง หักส่วนลด)
        const subtotal = validatedData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const shippingCost = subtotal >= 1500 ? 0 : 100; // ฟรีค่าจัดส่งเมื่อซื้อมากกว่า 1,500 บาท
        const discount = validatedData.discount || 0;
        const totalAmount = subtotal + shippingCost - discount;
        
        // เรียกใช้ Omise API เพื่อทำการชำระเงิน
        const omise = require('omise')({
          publicKey: process.env.OMISE_PUBLIC_KEY,
          secretKey: process.env.OMISE_SECRET_KEY,
        });
        
        // สร้าง charge ผ่าน Omise
        const charge = await omise.charges.create({
          amount: Math.round(totalAmount * 100), // แปลงเป็นสตางค์ (1 บาท = 100 สตางค์)
          currency: 'thb',
          card: validatedData.omiseToken,
          capture: true, // จัดเก็บเงินทันที
          return_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/orders/complete`,
          metadata: {
            order_id: 'pending', // ยังไม่มี order ID จึงใช้ pending ไปก่อน
            customer_email: validatedData.customerInfo.email,
            customer_name: `${validatedData.customerInfo.firstName} ${validatedData.customerInfo.lastName}`
          }
        });
        
        console.log('Credit card charge created:', {
          id: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          hasAuthorizeUri: !!charge.authorize_uri
        });
        
        // ตรวจสอบสถานะการชำระเงิน
        if (charge.status === 'successful') {
          // กรณีไม่ต้องทำ 3DS - เงินถูกเก็บเรียบร้อยแล้ว
          validatedData.paymentStatus = 'CONFIRMED';
        } else if (charge.status === 'pending' && charge.authorize_uri) {
          // กรณีต้องทำ 3DS - ต้องรอการยืนยันตัวตน
          validatedData.paymentStatus = 'PENDING'; // รอการยืนยันตัวตน 3DS
          
          // หมายเหตุ: ในกรณีนี้ ระบบจะต้องอาศัย webhook ในการอัพเดทสถานะการชำระเงินเป็น CONFIRMED หลังจากยืนยันตัวตนสำเร็จ
        } else {
          // กรณีการชำระเงินล้มเหลวด้วยเหตุผลอื่น
          validatedData.paymentStatus = 'REJECTED';
          return NextResponse.json(
            { success: false, message: 'การชำระเงินไม่สำเร็จ: ' + (charge.failure_message || 'กรุณาตรวจสอบข้อมูลบัตรและลองใหม่อีกครั้ง') },
            { status: 400 }
          );
        }
        
        // เพิ่มข้อมูลการชำระเงินลงในข้อมูลสำหรับสร้างคำสั่งซื้อ
        validatedData.paymentReference = charge.id; // เก็บ Omise Charge ID
        
        // ถ้ามีการทำ 3DS ให้เก็บ authorize_uri ไว้สำหรับ redirect ไปยังหน้ายืนยันตัวตน
        if (charge.authorize_uri) {
          // สร้าง order ก่อน แล้วจึง redirect ไปยังหน้ายืนยันตัวตน
          // โดยค่านี้จะถูกส่งกลับไปให้ client เพื่อทำการ redirect
          validatedData.returnUri = charge.authorize_uri;
        }
      } catch (omiseError: any) {
        console.error('Omise payment error:', omiseError);
        return NextResponse.json(
          { success: false, message: 'เกิดข้อผิดพลาดในการชำระเงิน: ' + (omiseError.message || 'กรุณาลองใหม่อีกครั้ง') },
          { status: 500 }
        );
      }
    }
    // ถ้ามีการชำระเงินด้วย PromptPay
    else if (validatedData.paymentMethod === 'PROMPTPAY' && validatedData.omiseToken) {
      try {
        // คำนวณยอดเงินทั้งหมด (รวมค่าจัดส่ง หักส่วนลด)
        const subtotal = validatedData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const shippingCost = subtotal >= 1500 ? 0 : 100; // ฟรีค่าจัดส่งเมื่อซื้อมากกว่า 1,500 บาท
        const discount = validatedData.discount || 0;
        const totalAmount = subtotal + shippingCost - discount;
        
        // เรียกใช้ Omise API เพื่อเช็คสถานะ charge
        const omise = require('omise')({
          publicKey: process.env.OMISE_PUBLIC_KEY,
          secretKey: process.env.OMISE_SECRET_KEY,
        });
        
        // ตรวจสอบ charge ที่ได้รับจาก client (validatedData.omiseToken คือ charge.id)
        const charge = await omise.charges.retrieve(validatedData.omiseToken);
        
        // ตรวจสอบว่า charge มีอยู่จริงและมียอดเงินตรงกัน
        const expectedAmount = Math.round(totalAmount * 100); // แปลงเป็นสตางค์
        if (!charge || charge.amount !== expectedAmount) {
          console.error('PromptPay charge validation failed:', {
            chargeId: validatedData.omiseToken,
            chargeAmount: charge ? charge.amount : null,
            expectedAmount
          });
          
          return NextResponse.json(
            { success: false, message: 'ข้อมูลการชำระเงินไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' },
            { status: 400 }
          );
        }
        
        // อัพเดท metadata ของ charge เพื่อเชื่อมกับ order ที่กำลังจะสร้าง
        await omise.charges.update(charge.id, {
          metadata: {
            ...charge.metadata,
            order_id: 'pending', // จะอัพเดทเป็น order ID จริงหลังจากสร้าง order
            customer_email: validatedData.customerInfo.email,
            customer_name: `${validatedData.customerInfo.firstName} ${validatedData.customerInfo.lastName}`
          }
        });
        
        // ในกรณีของ PromptPay สถานะจะเป็น pending จนกว่าลูกค้าจะสแกนจ่าย
        validatedData.paymentStatus = 'PENDING'; // รอการชำระเงิน
        validatedData.paymentReference = charge.id; // เก็บ Omise Charge ID
        
        // ใช้ webhook ในการติดตามสถานะการชำระเงิน (ต้องตั้งค่า webhook ที่ Omise dashboard)
      } catch (omiseError: any) {
        console.error('Omise PromptPay payment error:', omiseError);
        return NextResponse.json(
          { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล PromptPay: ' + (omiseError.message || 'กรุณาลองใหม่อีกครั้ง') },
          { status: 500 }
        );
      }
    }
    
    // สร้างคำสั่งซื้อใหม่
    const result = await createOrder(validatedData);
    
    if (!result.success || !result.order) {
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
        { status: 500 }
      );
    }
    
    // Generate order number from the order object
    const orderNumber = result.order.orderNumber as string;
    
    // ส่งอีเมลยืนยันคำสั่งซื้อ
    try {
      const emailResult = await sendOrderConfirmationEmail({
        ...validatedData,
        orderNumber
      });
      if (!emailResult.success) {
        console.warn('Order created but email sending failed:', emailResult.message);
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // ไม่คืนค่า error ถ้าการส่งอีเมลล้มเหลว แต่คำสั่งซื้อยังคงถูกสร้าง
    }
    
    // ส่งการแจ้งเตือนไปยัง Discord (ถ้ามีการตั้งค่า)
    try {
      if (process.env.DISCORD_WEBHOOK_URL) {
        // ตรวจสอบให้แน่ใจว่ามีข้อมูลที่จำเป็นสำหรับการส่งแจ้งเตือน
        const orderForNotification = {
          ...validatedData,
          ...result.order,
          orderNumber: orderNumber || result.order.orderNumber,
          items: validatedData.items // ใช้ items จาก validatedData เพราะในข้อมูลที่ได้จาก database อาจไม่มี
        };
        
        // Debug log
        console.log('Sending Discord notification with data structure:', 
          JSON.stringify({
            hasItems: !!orderForNotification.items,
            itemsCount: orderForNotification.items?.length || 0,
            orderNumber: orderForNotification.orderNumber
          }, null, 2)
        );
        
        const embed = createOrderNotificationEmbed(orderForNotification);
        await sendDiscordNotification(embed);
      }
    } catch (discordError) {
      console.error('Error sending Discord notification:', discordError);
      // ไม่คืนค่า error ถ้าการส่งแจ้งเตือน Discord ล้มเหลว
    }
    
    // Revalidate เส้นทางเพื่ออัปเดตข้อมูล (ใช้แค่ 1 argument คือ path)
    revalidatePath('/admin/orders');
    
    // ถ้าเป็น Omise payment (บัตรเครดิตหรือ PromptPay) ให้อัพเดท metadata เพื่อเชื่อมกับ order
    if ((validatedData.paymentMethod === 'CREDIT_CARD' || validatedData.paymentMethod === 'PROMPTPAY') && 
        validatedData.paymentReference) {
      try {
        const omise = require('omise')({
          publicKey: process.env.OMISE_PUBLIC_KEY,
          secretKey: process.env.OMISE_SECRET_KEY,
        });
        
        // อัพเดท metadata ของ charge ด้วย order ID
        await omise.charges.update(validatedData.paymentReference, {
          metadata: {
            order_id: result.order.id.toString(), // เปลี่ยนจาก 'pending' เป็น order ID จริง
            order_number: orderNumber
          }
        });
        
        console.log(`Updated Omise charge ${validatedData.paymentReference} with order ID ${result.order.id}`);
      } catch (omiseError) {
        // ถึงแม้จะไม่สามารถอัพเดท metadata ได้ แต่คำสั่งซื้อยังคงถูกสร้าง
        console.error('Error updating Omise charge metadata:', omiseError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'สร้างคำสั่งซื้อสำเร็จ',
      orderNumber,
      orderId: result.order.id,
      ...(validatedData.returnUri ? { returnUri: validatedData.returnUri } : {})
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    
    // ตรวจสอบว่าเป็น Zod Error หรือไม่
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return NextResponse.json(
        { success: false, message: `ข้อมูลไม่ถูกต้อง: ${errorMessages}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: `เกิดข้อผิดพลาด: ${(error as Error).message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}