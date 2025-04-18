import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/utils/orderUtils';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getBangkokDateTime } from '@/utils/dateUtils';
import sgMail from '@sendgrid/mail';
import { format, addHours } from 'date-fns';
import thLocale from 'date-fns/locale/th';

// ตั้งค่า SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

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
  userId: z.number().optional(),
});

// แทนที่ส่วนของการส่งอีเมลด้วย SendGrid
const sendOrderConfirmationEmail = async (orderData: any) => {
  try {
    // คำนวณราคารวมทั้งหมด
    const subtotal = Number(orderData.items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0));
    const shippingCost = Number(orderData.shippingCost || 0);
    const totalAmount = subtotal + shippingCost;

    // แปลงวันที่จัดส่งเป็น UTC+7
    const deliveryDate = orderData.shippingInfo.deliveryDate 
      ? addHours(new Date(orderData.shippingInfo.deliveryDate), 7)
      : null;

    const msg = {
      to: orderData.customerInfo.email,
      from: 'l3onsaiii1@gmail.com',
      subject: `ยืนยันคำสั่งซื้อ #${orderData.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #24B493;">ขอบคุณสำหรับคำสั่งซื้อ</h1>
          
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
                <td style="text-align: right; padding: 10px 0;">฿${shippingCost.toLocaleString()}</td>
              </tr>
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
              เลขที่บัญชี: 123-4-56789-0<br>
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
            ${deliveryDate ? `
              <p style="margin: 5px 0; color: #34495e;">
                <strong>วันที่จัดส่ง:</strong> ${format(deliveryDate, 'dd MMMM yyyy', { locale: thLocale })}
              </p>
            ` : ''}
            ${orderData.shippingInfo.deliveryTime ? `
              <p style="margin: 5px 0; color: #34495e;">
                <strong>เวลาที่จัดส่ง:</strong> ${orderData.shippingInfo.deliveryTime}
              </p>
            ` : ''}
            ${orderData.shippingInfo.cardMessage ? `
              <p style="margin: 5px 0; color: #34495e;">
                <strong>ข้อความในการ์ด:</strong> "${orderData.shippingInfo.cardMessage}"
              </p>
            ` : ''}
            ${orderData.customerInfo.note ? `
              <p style="margin: 5px 0; color: #34495e;">
                <strong>ข้อความเพิ่มเติม:</strong> ${orderData.customerInfo.note}
              </p>
            ` : ''}
          </div>

          <p style="color: #666; font-style: italic; text-align: center; margin-top: 30px;">
            หากมีคำถามกรุณาติดต่อ Line: @095xrokt
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // ไม่ต้อง throw error เพื่อไม่ให้ส่งผลต่อการสร้างคำสั่งซื้อ
  }
};

export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await request.json();
    
    console.log('Received order data:', JSON.stringify(body, null, 2));

    // ตรวจสอบข้อมูลให้ถูกต้องตาม schema
    try {
      const validatedData = orderSchema.parse(body);
      
      // แปลงวันที่จัดส่งเป็น UTC+7
      if (validatedData.shippingInfo.deliveryDate) {
        const deliveryDate = addHours(new Date(validatedData.shippingInfo.deliveryDate), 7);
        validatedData.shippingInfo.deliveryDate = deliveryDate;
      }
      
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      // ส่งต่อข้อมูลไปยังฟังก์ชันสร้างคำสั่งซื้อ
      try {
        const result = await createOrder(validatedData);

        // ส่งอีเมลยืนยันการสั่งซื้อ
        await sendOrderConfirmationEmail({
          ...validatedData,
          orderNumber: result.order.orderNumber,
          totalAmount: result.order.totalAmount,
          shippingCost: result.order.shippingCost
        });

        return NextResponse.json({
          success: true,
          message: "สร้างคำสั่งซื้อสำเร็จ",
          data: {
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
          }
        }, { status: 201 });
      } catch (orderError: any) {
        console.error("Order creation error:", orderError);
        return NextResponse.json({
          success: false,
          message: orderError.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ",
        }, { status: 500 });
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        console.error("Validation errors:", JSON.stringify(formattedErrors, null, 2));
        
        return NextResponse.json({
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
          errors: formattedErrors
        }, { status: 400 });
      }
      
      throw validationError;
    }
  } catch (error) {
    console.error("Unhandled error in API:", error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเรียก API",
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "API สำหรับสร้างคำสั่งซื้อ โปรดใช้ method POST"
  });
} 