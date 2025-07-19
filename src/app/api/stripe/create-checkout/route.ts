import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createOrder, PaymentMethodType } from '@/utils/orderUtils';
import { calculateShippingCost } from '@/utils/shippingUtils';
import prisma from '@/lib/prisma';

// กำหนด schema สำหรับตรวจสอบข้อมูลที่ส่งมา
const checkoutSchema = z.object({
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
    zipCode: z.string(),
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
  paymentMethod: z.literal('STRIPE'),
  paymentMethodType: z.string().optional(),
  userId: z.union([z.number(), z.string(), z.null()]).optional(),
  discount: z.number().default(0),
  discountCode: z.string().optional()
});

// สร้าง Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    // อ่านข้อมูลจาก request body
    const body = await request.json();
    
    // ตรวจสอบข้อมูลด้วย schema
    const validatedData = checkoutSchema.parse(body);
    
    // คำนวณยอดเงินทั้งหมด
    const subtotal = validatedData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const shippingCost = await calculateShippingCost(subtotal); // ใช้การตั้งค่าจากฐานข้อมูล
    const discount = validatedData.discount || 0;
    const totalAmount = subtotal + shippingCost - discount;
    
    // สร้างคำสั่งซื้อใหม่ในระบบ (status: PENDING)
    const orderData = {
      ...validatedData,
      paymentMethod: 'STRIPE' as PaymentMethodType,
      paymentStatus: 'PENDING' as const
    };
    
    const result = await createOrder(orderData);
    
    if (!result.success || !result.order) {
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
        { status: 500 }
      );
    }
    
    // สร้างรายการสินค้าสำหรับ Stripe
    const lineItems = validatedData.items.map(item => ({
      price_data: {
        currency: 'thb',
        product_data: {
          name: item.productName,
          images: item.productImg ? [item.productImg.startsWith('http') 
            ? item.productImg 
            : `${process.env.NEXT_PUBLIC_BASE_URL}/images/product/${item.productImg}`] : [],
        },
        unit_amount: Math.round(item.unitPrice * 100), // แปลงเป็นสตางค์
      },
      quantity: item.quantity,
    }));
    
    // เพิ่มค่าจัดส่ง (ถ้ามี)
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'thb',
          product_data: {
            name: 'ค่าจัดส่ง',
            images: [],
          },
          unit_amount: shippingCost * 100, // แปลงเป็นสตางค์
        },
        quantity: 1,
      });
    }
    
    // ถ้ามีส่วนลด ให้เพิ่มเป็นรายการติดลบ
    if (discount > 0) {
      lineItems.push({
        price_data: {
          currency: 'thb',
          product_data: {
            name: `ส่วนลด${validatedData.discountCode ? ` (${validatedData.discountCode})` : ''}`,
            images: [],
          },
          unit_amount: -discount * 100, // แปลงเป็นสตางค์ และใส่เครื่องหมายลบ
        },
        quantity: 1,
      });
    }
    
    // สร้าง session สำหรับ Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: validatedData.paymentMethodType === 'promptpay' 
        ? ['promptpay'] // เฉพาะ promptpay
        : ['card', 'promptpay'], // ทั้ง card และ promptpay
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?canceled=true`,
      client_reference_id: result.order.id.toString(),
      customer_email: validatedData.customerInfo.email,
      metadata: {
        order_id: result.order.id.toString(),
        order_number: result.order.orderNumber,
        payment_method_type: validatedData.paymentMethodType || 'card' // เพิ่มข้อมูลการชำระเงินใน metadata
      },
    });
    
    // บันทึกข้อมูล stripe session เพื่อติดตามสถานะ
    try {
      await prisma.$executeRaw`
        INSERT INTO stripecheckout (sessionId, orderId, status, amount, createdAt)
        VALUES (${session.id}, ${parseInt(result.order.id.toString())}, 'PENDING', ${Math.round(totalAmount)}, NOW())
      `;
    } catch (error) {
      console.error('Error saving Stripe session:', error);
      // ไม่หยุดการทำงานแม้ว่าจะบันทึกข้อมูล session ไม่ได้
    }
    
    // ส่ง URL สำหรับ redirect ไปยัง Stripe Checkout
    return NextResponse.json({
      success: true,
      url: session.url,
    });
    
  } catch (error) {
    console.error('Stripe checkout creation error:', error);
    
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