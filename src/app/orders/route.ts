import { z } from 'zod';
import { NextResponse } from 'next/server';

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
  chargeId: z.string().optional(), // สำหรับ charge_id ของ Omise
  returnUri: z.string().optional() // สำหรับกรณี 3DS redirect
});

// สร้างฟังก์ชัน GET สำหรับ Next.js route handler
export async function GET(request: Request) {
  // ตอบกลับด้วย schema เป็น JSON
  return NextResponse.json({
    success: true,
    schema: orderSchema.shape
  });
} 