import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// ตรวจสอบว่ามีการตั้งค่า Stripe API Key หรือไม่
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined');
}

// สร้าง Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Schema สำหรับตรวจสอบข้อมูลที่ส่งมา
const OrderSchema = z.object({
  customerInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    note: z.string().optional(),
  }),
  shippingInfo: z.object({
    receiverName: z.string(),
    receiverLastname: z.string(),
    receiverPhone: z.string(),
    addressLine: z.string(),
    addressLine2: z.string().optional(),
    provinceId: z.number(),
    provinceName: z.string(),
    amphureId: z.number(),
    amphureName: z.string(),
    tambonId: z.number(),
    tambonName: z.string(),
    zipCode: z.string(),
    deliveryDate: z.string().optional(),
    deliveryTime: z.string().optional(),
    cardMessage: z.string().optional(),
    additionalNote: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    productImg: z.string().optional(),
    quantity: z.number().int().positive("จำนวนสินค้าต้องเป็นจำนวนเต็มบวก").min(1, "จำนวนสินค้าต้องมีอย่างน้อย 1 ชิ้น"),
    unitPrice: z.number().positive("ราคาต่อหน่วยต้องเป็นจำนวนบวก"),
  })),
  paymentMethod: z.string(),
  paymentMethodType: z.string().optional(),
  userId: z.union([z.string(), z.number()]).nullable().optional(),
  discount: z.number().default(0),
  discountCode: z.string().optional(),
  paymentStatus: z.string(),
  cancelUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await request.json();
    
    // ตรวจสอบข้อมูลด้วย Zod
    const validatedData = OrderSchema.parse(body);
    
    // คำนวณยอดเงิน
    const subtotal = validatedData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const shippingCost = subtotal >= 1500 ? 0 : 100; // ฟรีค่าจัดส่งเมื่อซื้อมากกว่า 1,500 บาท
    const discount = validatedData.discount || 0;
    const totalAmount = subtotal + shippingCost - discount;
    
    // สร้าง line_items สำหรับ Stripe
    // สำหรับกรณีที่มีส่วนลด ให้คำนวณ adjustment factor
    const discountFactor = discount > 0 ? (subtotal - discount) / subtotal : 1;
    
    const lineItems = validatedData.items.map(item => {
      // ตรวจสอบและแปลง quantity ให้เป็นจำนวนเต็มบวก
      const quantity = Math.max(1, Math.round(item.quantity));
      
      // ตรวจสอบและแปลง unitPrice ให้เป็นจำนวนเต็มบวก
      // ถ้ามีส่วนลด ให้ปรับราคาลดลงตาม discountFactor
      const itemPrice = discount > 0 
        ? item.unitPrice * discountFactor 
        : item.unitPrice;
      
      const unitAmount = Math.max(1, Math.round(itemPrice * 100));
      
      // สร้างชื่อสินค้าที่บอกส่วนลดด้วยถ้ามี
      const productName = discount > 0 && validatedData.discountCode 
        ? `${item.productName} (รวมส่วนลด ${validatedData.discountCode})`
        : item.productName;
      
      return {
        price_data: {
          currency: 'thb',
          product_data: {
            name: productName,
            images: item.productImg ? [item.productImg.startsWith('http') ? item.productImg : `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/images/product/${item.productImg}`] : undefined,
          },
          unit_amount: unitAmount, // ใช้ค่าที่ตรวจสอบแล้ว
        },
        quantity: quantity, // ใช้ค่าที่ตรวจสอบแล้ว
      };
    });
    
    // เพิ่มค่าจัดส่ง (ถ้ามี)
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'thb',
          product_data: {
            name: 'ค่าจัดส่ง',
            images: undefined,
          },
          unit_amount: Math.max(1, Math.round(shippingCost * 100)), // ตรวจสอบให้เป็นจำนวนเต็มบวก
        },
        quantity: 1,
      });
    }
    
    // หมายเหตุ: ส่วนลดได้รวมไว้ในราคาสินค้าแล้วโดยการใช้ discountFactor
    // วิธีนี้จะช่วยป้องกันปัญหา Invalid non-negative integer กับ Stripe API
    // ซึ่งไม่สามารถใช้ค่าติดลบหรือ quantity ติดลบได้
    
    // สร้าง orderNumber รูปแบบใหม่: TTyymmrunningnumber เช่น TT2505001
    const generateOrderNumber = async () => {
      // รับวันที่ปัจจุบัน
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2); // 2 หลักสุดท้ายของปี (เช่น 2025 -> 25)
      const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // เดือน (01-12)
      
      // หาเลขลำดับล่าสุดจากฐานข้อมูลในเดือนปัจจุบัน
      const prefix = `TT${yy}${mm}`;
      const latestOrder = await prisma.order.findFirst({
        where: {
          orderNumber: {
            startsWith: prefix
          }
        },
        orderBy: {
          orderNumber: 'desc'
        }
      });
      
      // กำหนดเลขลำดับ runningNumber
      let runningNumber = 1;
      if (latestOrder) {
        // ตัดส่วนตัวเลขลำดับล่าสุดออกมา และแปลงเป็นตัวเลข
        const latestRunningNumber = parseInt(latestOrder.orderNumber.slice(-3));
        if (!isNaN(latestRunningNumber)) {
          runningNumber = latestRunningNumber + 1;
        }
      }
      
      // รูปแบบ TT + yy + mm + running number (3 หลัก)
      return `${prefix}${runningNumber.toString().padStart(3, '0')}`;
    };

    // สร้าง orderNumber
    const orderNumber = await generateOrderNumber();
    
    // Metadata สำหรับเก็บข้อมูลเพิ่มเติม
    const metadata = {
      customer_name: `${validatedData.customerInfo.firstName} ${validatedData.customerInfo.lastName}`,
      customer_email: validatedData.customerInfo.email,
      customer_phone: validatedData.customerInfo.phone,
      shipping_address: validatedData.shippingInfo.addressLine,
      shipping_province: validatedData.shippingInfo.provinceName,
      shipping_amphure: validatedData.shippingInfo.amphureName,
      shipping_tambon: validatedData.shippingInfo.tambonName,
      shipping_zipcode: validatedData.shippingInfo.zipCode,
      delivery_date: validatedData.shippingInfo.deliveryDate || '',
      delivery_time: validatedData.shippingInfo.deliveryTime || '',
      card_message: validatedData.shippingInfo.cardMessage || '',
      note: validatedData.customerInfo.note || '',
      discount_code: validatedData.discountCode || '',
      user_id: validatedData.userId ? String(validatedData.userId) : '',
    };
    
    // สร้าง Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    console.log('Creating Stripe session with baseUrl:', baseUrl);
    
    // กำหนดวิธีการชำระเงินที่จะใช้ใน Stripe ตาม paymentMethodType ที่ส่งมา
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ['card'];
    if (validatedData.paymentMethodType === 'promptpay') {
      paymentMethodTypes.push('promptpay' as Stripe.Checkout.SessionCreateParams.PaymentMethodType);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes, // ใช้ตามที่กำหนดจาก paymentMethodType
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/orders/complete?source=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: validatedData.cancelUrl || `${baseUrl}/checkout`,
      customer_email: validatedData.customerInfo.email,
      locale: 'th',
      payment_intent_data: {
        metadata,
      },
      metadata,
    });
    
    console.log('Stripe session created successfully:', {
      id: session.id,
      url: session.url,
    });
    
    try {
      // สร้าง Order ในฐานข้อมูล
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: validatedData.userId ? Number(validatedData.userId) : null,
          status: 'PENDING',
          totalAmount,
          shippingCost,
          discount: discount,
          discountCode: validatedData.discountCode,
          finalAmount: totalAmount,
          paymentMethod: validatedData.paymentMethodType === 'promptpay' ? 'PROMPTPAY' : 'CREDIT_CARD',
          paymentStatus: 'PENDING',
          stripeSessionId: session.id,
          stripePaymentMethodType: validatedData.paymentMethodType || 'card',
          customerInfo: {
            create: {
              firstName: validatedData.customerInfo.firstName,
              lastName: validatedData.customerInfo.lastName,
              email: validatedData.customerInfo.email,
              phone: validatedData.customerInfo.phone,
              note: validatedData.customerInfo.note || '',
            }
          },
          shippingInfo: {
            create: {
              receiverName: validatedData.shippingInfo.receiverName,
              receiverLastname: validatedData.shippingInfo.receiverLastname,
              receiverPhone: validatedData.shippingInfo.receiverPhone,
              addressLine: validatedData.shippingInfo.addressLine,
              addressLine2: validatedData.shippingInfo.addressLine2 || '',
              provinceId: validatedData.shippingInfo.provinceId,
              provinceName: validatedData.shippingInfo.provinceName,
              amphureId: validatedData.shippingInfo.amphureId,
              amphureName: validatedData.shippingInfo.amphureName,
              tambonId: validatedData.shippingInfo.tambonId,
              tambonName: validatedData.shippingInfo.tambonName,
              zipCode: validatedData.shippingInfo.zipCode,
              deliveryDate: validatedData.shippingInfo.deliveryDate ? new Date(validatedData.shippingInfo.deliveryDate) : null,
              deliveryTime: validatedData.shippingInfo.deliveryTime || null,
              cardMessage: validatedData.shippingInfo.cardMessage || '',
              additionalNote: validatedData.shippingInfo.additionalNote || '',
            }
          },
          orderItems: {
            create: validatedData.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              productImg: item.productImg || null,
            })),
          },
        },
      });
      
      // อัพเดท Stripe Session Metadata ด้วยข้อมูล Order
      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...metadata,
          order_id: String(order.id),
          order_number: orderNumber,
        },
      });
      
      // ถ้ามีการใช้รหัสส่วนลด ให้บันทึกการใช้งาน
      if (validatedData.discountCode) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/api/discount/use`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: validatedData.discountCode,
              orderId: order.id,
            }),
          });
        } catch (error) {
          console.error('Error updating discount usage count:', error);
        }
      }
      
      // ส่งข้อมูล Stripe Session กลับไปยัง client
      console.log('Returning Stripe session data:', { sessionId: session.id, url: session.url });
      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        orderId: order.id,
        orderNumber,
      });
    } catch (dbError) {
      console.error('Database error when creating order:', dbError);
      
      // ส่งข้อมูล Stripe Session กลับไปยัง client แม้จะไม่สามารถสร้าง Order ได้
      console.log('Returning Stripe session data after DB error:', { sessionId: session.id, url: session.url });
      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });
    }
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 