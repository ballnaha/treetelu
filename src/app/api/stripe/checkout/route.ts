import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { generateOrderNumber } from '@/utils/orderUtils';
import { getBangkokDateTime, convertToBangkokTime } from '@/utils/dateUtils';

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
            metadata: {
              productId: String(item.productId),
              // ยินยอมให้มี property อื่นๆ ได้
              [Symbol('typescript-workaround')]: true  // นี่เป็นแค่ workaround เพื่อให้ TypeScript ไม่ error
            } as Record<string, string | boolean>, // กำหนด type ให้ยืดหยุ่น
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
            // ใช้ type assertion เพื่อหลีกเลี่ยงข้อผิดพลาด
            metadata: {
              productId: 'shipping'
            } as any // ใช้ any ที่นี่เพื่อให้สามารถมี property เพิ่มเติมได้
          },
          unit_amount: Math.max(1, Math.round(shippingCost * 100)), // ตรวจสอบให้เป็นจำนวนเต็มบวก
        },
        quantity: 1,
      });
    }
    
    // หมายเหตุ: ส่วนลดได้รวมไว้ในราคาสินค้าแล้วโดยการใช้ discountFactor
    // วิธีนี้จะช่วยป้องกันปัญหา Invalid non-negative integer กับ Stripe API
    // ซึ่งไม่สามารถใช้ค่าติดลบหรือ quantity ติดลบได้
    
    // สร้าง orderNumber
    const orderNumber = await generateOrderNumber();
    
    // Metadata สำหรับเก็บข้อมูลเพิ่มเติม
    const metadata: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      shipping_address: string;
      shipping_province: string;
      shipping_amphure: string;
      shipping_tambon: string;
      shipping_zipcode: string;
      delivery_date: string;
      delivery_time: string;
      card_message: string;
      note: string;
      discount_code: string;
      user_id: string;
      order_number: string;
      deliveryDate: string;
      deliveryTime: string;
      cardMessage: string;
      additionalNote: string;
      shipping_to_other: string;
      shipping_tab: string;
      sender_name: string;
      sender_lastname: string;
      sender_phone: string;
      sender_email: string;
      order_id?: string;
      payment_method_types: string;
      payment_type: string;
    } = {
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
      order_number: orderNumber, // เพิ่ม orderNumber ลงใน metadata
      // เพิ่มข้อมูลสำหรับกรณีจัดส่งให้ผู้อื่น ด้วยคีย์ที่ชัดเจน
      deliveryDate: validatedData.shippingInfo.deliveryDate 
        ? validatedData.shippingInfo.deliveryDate
        : '',
      deliveryTime: validatedData.shippingInfo.deliveryTime || '',
      cardMessage: validatedData.shippingInfo.cardMessage || '',
      additionalNote: validatedData.shippingInfo.additionalNote || '',
      // เพิ่มข้อมูลระบุว่าเป็นการจัดส่งให้ผู้อื่นหรือไม่
      shipping_to_other: validatedData.shippingInfo.provinceName === 'จัดส่งให้ผู้รับโดยตรง' ? "true" : "false",
      // ระบุ shipping_tab สำหรับบ่งบอกประเภทการจัดส่ง (0 = ส่งให้ตัวเอง, 1 = ส่งให้ผู้อื่น)
      shipping_tab: validatedData.shippingInfo.provinceName === 'จัดส่งให้ผู้รับโดยตรง' ? "1" : "0",
      // ข้อมูลผู้สั่งซื้อแยกจากผู้รับ สำหรับกรณีจัดส่งให้ผู้อื่น
      sender_name: validatedData.customerInfo.firstName,
      sender_lastname: validatedData.customerInfo.lastName,
      sender_phone: validatedData.customerInfo.phone,
      sender_email: validatedData.customerInfo.email,
      payment_method_types: '',
      payment_type: '',
    };
    
    // สร้าง Order ในฐานข้อมูลก่อน
    let order;
    try {
      // กรณีจัดส่งให้ผู้อื่นโดยตรง จำเป็นต้องตรวจสอบและใช้ข้อมูลจังหวัด อำเภอ ตำบลที่มีอยู่จริงในฐานข้อมูล
      let validProvinceId = validatedData.shippingInfo.provinceId;
      let validAmphureId = validatedData.shippingInfo.amphureId;
      let validTambonId = validatedData.shippingInfo.tambonId;
      
      // ตรวจสอบกรณีจัดส่งให้ผู้อื่นโดยตรง
      if (validatedData.shippingInfo.provinceName === "จัดส่งให้ผู้รับโดยตรง") {
        // หาข้อมูลจังหวัด อำเภอ และตำบลที่มีอยู่จริงในฐานข้อมูล
        try {
          // ใช้กรุงเทพฯ เป็นค่าเริ่มต้น (ควรมีอยู่จริงในฐานข้อมูลเสมอ)
          const defaultProvince = await prisma.thaiprovinces.findFirst({
            where: { nameTh: { contains: 'กรุงเทพ' } },
            select: { id: true }
          });
          
          if (defaultProvince) {
            validProvinceId = defaultProvince.id;
            
            // หาข้อมูลอำเภอที่มีอยู่จริงในจังหวัดนี้
            const defaultAmphure = await prisma.thaiamphures.findFirst({
              where: { provinceId: defaultProvince.id },
              select: { id: true }
            });
            
            if (defaultAmphure) {
              validAmphureId = defaultAmphure.id;
              
              // หาข้อมูลตำบลที่มีอยู่จริงในอำเภอนี้
              const defaultTambon = await prisma.thaitambons.findFirst({
                where: { amphureId: defaultAmphure.id },
                select: { id: true }
              });
              
              if (defaultTambon) {
                validTambonId = defaultTambon.id;
              }
            }
          }
        } catch (error) {
          console.error('Error finding default location data:', error);
        }
      }
      
      // สร้าง Order ในฐานข้อมูล
      order = await prisma.order.create({
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
          createdAt: getBangkokDateTime(),
          updatedAt: getBangkokDateTime(),
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
              provinceId: validProvinceId, // ใช้ค่าที่ตรวจสอบแล้ว
              provinceName: validatedData.shippingInfo.provinceName,
              amphureId: validAmphureId, // ใช้ค่าที่ตรวจสอบแล้ว
              amphureName: validatedData.shippingInfo.amphureName,
              tambonId: validTambonId, // ใช้ค่าที่ตรวจสอบแล้ว
              tambonName: validatedData.shippingInfo.tambonName,
              zipCode: validatedData.shippingInfo.zipCode,
              deliveryDate: validatedData.shippingInfo.deliveryDate ? convertToBangkokTime(new Date(validatedData.shippingInfo.deliveryDate)) : null,
              deliveryTime: validatedData.shippingInfo.deliveryTime || null,
              cardMessage: validatedData.shippingInfo.cardMessage || '',
              additionalNote: validatedData.shippingInfo.additionalNote || '',
              createdAt: getBangkokDateTime(),
              updatedAt: getBangkokDateTime()
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
              createdAt: getBangkokDateTime(),
              updatedAt: getBangkokDateTime()
            })),
          },
        },
      });
      
      // เพิ่ม order_id ลงใน metadata
      metadata.order_id = String(order.id);
      
      console.log('Successfully created order in database:', {
        id: order.id,
        orderNumber: order.orderNumber
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
    } catch (dbError: unknown) {
      console.error('Database error when creating order:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'ไม่ทราบสาเหตุ';
      throw new Error(`ไม่สามารถสร้างคำสั่งซื้อได้: ${errorMessage}`);
    }
    
    // เมื่อสร้าง Order ในฐานข้อมูลเรียบร้อยแล้ว ให้สร้าง Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    console.log('Creating Stripe session with baseUrl:', baseUrl);
    
    // กำหนดวิธีการชำระเงินที่จะใช้ใน Stripe ตาม paymentMethodType ที่ส่งมา
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [];
    
    // เลือกวิธีการชำระเงินตามที่ลูกค้าเลือกจากหน้าเว็บ
    if (validatedData.paymentMethodType === 'promptpay') {
      // ถ้าลูกค้าเลือก promptpay จะแสดงเฉพาะ promptpay
      paymentMethodTypes.push('promptpay' as Stripe.Checkout.SessionCreateParams.PaymentMethodType);
      // กำหนด payment_method_types ใน metadata เพื่อบันทึกว่าเป็น promptpay
      metadata.payment_method_types = 'promptpay';
      metadata.payment_type = 'promptpay';
    } else if (validatedData.paymentMethodType === 'card') {
      // ถ้าลูกค้าเลือก card จะแสดงเฉพาะ card
      paymentMethodTypes.push('card');
      // กำหนด payment_method_types ใน metadata เพื่อบันทึกว่าเป็น card
      metadata.payment_method_types = 'card';
      metadata.payment_type = 'card';
    } else {
      // กรณีไม่ระบุ ให้แสดงทั้งสองแบบ (default)
      paymentMethodTypes.push('card');
      paymentMethodTypes.push('promptpay' as Stripe.Checkout.SessionCreateParams.PaymentMethodType);
      // กำหนด payment_method_types ใน metadata เพื่อบันทึกว่ามีทั้งสองวิธี
      metadata.payment_method_types = 'card,promptpay';
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes, // ใช้ตามที่กำหนดจาก paymentMethodType
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/orders/complete?source=stripe&session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}&order_number=${orderNumber}`,
        cancel_url: validatedData.cancelUrl || `${baseUrl}/checkout`,
        customer_email: validatedData.customerInfo.email,
        locale: 'th',
        payment_intent_data: {
          metadata,
        },
        metadata,
      } as any); // ใช้ type assertion เพื่อหลีกเลี่ยงการตรวจสอบ type ที่เข้มงวดเกินไป
      
      console.log('Stripe session created successfully:', {
        id: session.id,
        url: session.url,
      });
      
      // อัพเดต orderNumber เพื่อเพิ่ม stripeSessionId
      await prisma.order.update({
        where: {
          id: order.id
        },
        data: {
          stripeSessionId: session.id,
          stripePaymentMethodType: validatedData.paymentMethodType || 'card',
        }
      });
    } catch (stripeError: unknown) {
      console.error('Error creating Stripe session:', stripeError);
      
      // ถ้าไม่สามารถสร้าง Stripe session ได้ อัพเดตสถานะเป็น ERROR
      if (order) {
        await prisma.order.update({
          where: {
            id: order.id
          },
          data: {
            status: 'PENDING', // เปลี่ยนเป็น PENDING แทน ERROR เพื่อให้ตรงกับ enum
            paymentStatus: 'PENDING', // เปลี่ยนเป็น PENDING แทน ERROR เพื่อให้ตรงกับ enum
            updatedAt: getBangkokDateTime()
          }
        });
      }
      
      const stripeErrorMessage = stripeError instanceof Error ? stripeError.message : 'ไม่ทราบสาเหตุ';
      throw new Error(`ไม่สามารถสร้าง Stripe session ได้: ${stripeErrorMessage}`);
    }
    
    // ส่งข้อมูล Stripe Session กลับไปยัง client
    console.log('Returning Stripe session data:', { sessionId: session.id, url: session.url });
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      orderNumber,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 