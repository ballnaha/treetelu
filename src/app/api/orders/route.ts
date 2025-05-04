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
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    phone: z.string().regex(/^0\d{9}$/, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0"),
    note: z.string().optional().default(""),
  }),
  shippingInfo: z.object({
    receiverName: z.string().min(1, "กรุณากรอกชื่อผู้รับ"),
    receiverLastname: z.string().min(1, "กรุณากรอกนามสกุลผู้รับ"),
    receiverPhone: z.string().regex(/^0\d{9}$/, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0"),
    addressLine: z.string().min(1, "กรุณากรอกที่อยู่"),
    addressLine2: z.string().optional().default(""),
    provinceId: z.number({
      required_error: "กรุณาเลือกจังหวัด",
      invalid_type_error: "provinceId ต้องเป็นตัวเลข",
    }).int().min(0, "provinceId ต้องเป็นตัวเลขที่ไม่ติดลบ"),
    provinceName: z.string({
      required_error: "กรุณาระบุชื่อจังหวัด",
    }).min(1, "กรุณาระบุชื่อจังหวัด"),
    amphureId: z.number({
      required_error: "กรุณาเลือกอำเภอ/เขต",
      invalid_type_error: "amphureId ต้องเป็นตัวเลข",
    }).int().min(0, "amphureId ต้องเป็นตัวเลขที่ไม่ติดลบ"),
    amphureName: z.string({
      required_error: "กรุณาระบุชื่ออำเภอ/เขต", 
    }).min(1, "กรุณาระบุชื่ออำเภอ/เขต"),
    tambonId: z.number({
      required_error: "กรุณาเลือกตำบล/แขวง",
      invalid_type_error: "tambonId ต้องเป็นตัวเลข",
    }).int().min(0, "tambonId ต้องเป็นตัวเลขที่ไม่ติดลบ"),
    tambonName: z.string({
      required_error: "กรุณาระบุชื่อตำบล/แขวง",
    }).min(1, "กรุณาระบุชื่อตำบล/แขวง"),
    zipCode: z.string().regex(/^\d{5}$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก"),
    deliveryDate: z.coerce.date().optional(),
    deliveryTime: z.string().optional().default(""),
    cardMessage: z.string().optional().default(""),
    additionalNote: z.string().optional().default(""),
  }),
  items: z.array(
    z.object({
      productId: z.number({
        required_error: "กรุณาระบุ ID สินค้า",
        invalid_type_error: "productId ต้องเป็นตัวเลข",
      }),
      productName: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
      productImg: z.string().optional().default(""),
      quantity: z.number({
        required_error: "กรุณาระบุจำนวนสินค้า",
        invalid_type_error: "quantity ต้องเป็นตัวเลข",
      }).min(1, "จำนวนสินค้าต้องมากกว่า 0"),
      unitPrice: z.number({
        required_error: "กรุณาระบุราคาสินค้า",
        invalid_type_error: "unitPrice ต้องเป็นตัวเลข",
      }).min(0, "ราคาสินค้าต้องไม่ติดลบ"),
    })
  ).min(1, "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ"),
  paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "PROMPTPAY", "COD"], {
    errorMap: () => ({ message: "กรุณาเลือกวิธีการชำระเงินที่ถูกต้อง" }),
  }),
  userId: z.union([
    z.number(),
    z.string().transform((val) => Number(val))
  ]).optional(),
  discount: z.number().optional(),
  discountCode: z.string().optional(),
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
              ธนาคารไทยพาณิชย์ (SCB)<br>
              เลขที่บัญชี: 264-221037-2<br>
              ชื่อบัญชี: นายธัญญา รัตนาวงศ์ไชยา<br>
              
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
    
    return NextResponse.json({
      success: true,
      message: 'สร้างคำสั่งซื้อสำเร็จ',
      orderNumber,
      orderId: result.order.id
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