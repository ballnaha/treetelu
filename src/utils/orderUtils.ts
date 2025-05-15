import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import { getBangkokDateTime, convertToBangkokTime } from './dateUtils';

// กำหนด Prisma Client
// const prisma = new PrismaClient(); // เอาออกเพราะใช้ singleton instance แทน

/**
 * สร้างเลขที่คำสั่งซื้อในรูปแบบ TTyymmrunningnumber 
 * เช่น TT2505001 โดยที่ TT คือ prefix, 25 คือปี 2025, 05 คือเดือนพฤษภาคม, 001 คือลำดับแรกของเดือน
 * ถ้าเริ่มเดือนใหม่ จะเริ่มที่ 001 ใหม่ เช่น TT2506001 สำหรับเดือนมิถุนายน
 */
export async function generateOrderNumber(): Promise<string> {
  const now = getBangkokDateTime();
  const yearShort = now.getFullYear().toString().slice(-2); // เอาเลข 2 หลักสุดท้ายของปี ค.ศ.
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // เดือน 01-12
  const prefix = `TT${yearShort}${month}`;
  
  try {
    // ใช้ transaction และ lock เพื่อป้องกัน race condition
    return await prisma.$transaction(async (prismaClient: any) => {
      // หาเลขที่คำสั่งซื้อล่าสุดของเดือนปัจจุบันพร้อมล็อกแถว
      const lastOrderResult = await prismaClient.$queryRaw<Array<{orderNumber: string}>>`
        SELECT orderNumber FROM orders 
        WHERE orderNumber LIKE ${`${prefix}%`}
        ORDER BY orderNumber DESC
        LIMIT 1
        FOR UPDATE
      `;
      
      let runningNumber: number;
      
      if (!lastOrderResult || lastOrderResult.length === 0) {
        // ถ้าไม่มีคำสั่งซื้อในเดือนนี้เลย ให้เริ่มที่ 001
        runningNumber = 1;
      } else {
        // ถ้ามีคำสั่งซื้อแล้ว ให้เพิ่มเลขลำดับขึ้น 1
        const lastRunningNumber = parseInt(lastOrderResult[0].orderNumber.slice(-3));
        runningNumber = lastRunningNumber + 1;
      }
      
      // แปลงเป็นสตริง 3 หลัก เช่น 001, 002, ..., 099, 100
      const runningString = runningNumber.toString().padStart(3, '0');
      
      // สร้างเลขที่คำสั่งซื้อในรูปแบบ TTyymmrunningnumber
      return `${prefix}${runningString}`;
    });
  } catch (error) {
    console.error('Error generating order number:', error);
    throw new Error('ไม่สามารถสร้างเลขที่คำสั่งซื้อได้');
  }
}

// กำหนดชนิดข้อมูลสำหรับวิธีการชำระเงิน
export type PaymentMethodType = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PROMPTPAY' | 'COD';

// กำหนดชนิดข้อมูลสำหรับสถานะการชำระเงิน
export type PaymentStatusType = 'PENDING' | 'CONFIRMED' | 'REJECTED';

// กำหนดชนิดข้อมูลสำหรับข้อมูลคำสั่งซื้อ
type OrderDataInput = {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    note?: string;
  };
  shippingInfo: {
    receiverName: string;
    receiverLastname: string;
    receiverPhone: string;
    addressLine: string;
    addressLine2?: string;
    provinceId: number;
    provinceName: string;
    amphureId: number;
    amphureName: string;
    tambonId: number;
    tambonName: string;
    zipCode: string;
    deliveryDate?: Date | string | null;
    deliveryTime?: string;
    cardMessage?: string;
    additionalNote?: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    productImg?: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: PaymentMethodType;
  userId?: number | string | null;
  discount?: number;
  discountCode?: string;
  paymentStatus?: PaymentStatusType;
  paymentReference?: string; // Omise charge ID
};

/**
 * บันทึกข้อมูลคำสั่งซื้อลงฐานข้อมูล
 */
export async function createOrder(orderData: OrderDataInput) {
  const { customerInfo, shippingInfo, items, paymentMethod, userId, discount = 0, discountCode, paymentStatus = 'PENDING', paymentReference } = orderData;
  
  try {
    // Debug log for userId
    console.log('Received userId in createOrder:', userId, 'type:', typeof userId);
    console.log('User ID details:', {
      userId: userId,
      hasUserId: userId !== undefined && userId !== null,
      userIdType: typeof userId,
      userIdToString: userId ? String(userId) : 'null/undefined'
    });
    
    // คำนวณยอดรวม
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // กำหนดค่าจัดส่ง (ตามเงื่อนไขธุรกิจ)
    const shippingCost = subtotal >= 1500 ? 0 : 100;
    
    // คำนวณราคาสุทธิหลังหักส่วนลด
    const finalAmount = subtotal + shippingCost - discount;
    
    // สร้างเลขที่คำสั่งซื้อ
    const orderNumber = await generateOrderNumber();
    
    // ตรวจสอบว่าเป็นการจัดส่งให้ผู้อื่นหรือไม่
    const isGiftShipping = shippingInfo.provinceId === 0;
    
    try {
      console.log('Creating order with data:', JSON.stringify({
        orderNumber,
        paymentMethod,
        subtotal,
        shippingCost,
        discount,
        discountCode,
        finalAmount,
        isGiftShipping,
        customerEmail: customerInfo.email,
        shippingReceiver: shippingInfo.receiverName,
        itemCount: items.length,
        userId: userId,
        userIdType: typeof userId
      }, null, 2));
      
      // ข้อมูลชื่อจังหวัด อำเภอ และตำบล
      let provinceName = shippingInfo.provinceName || '';
      let amphureName = shippingInfo.amphureName || '';
      let tambonName = shippingInfo.tambonName || '';
      let provinceId = shippingInfo.provinceId;
      let amphureId = shippingInfo.amphureId;
      let tambonId = shippingInfo.tambonId;

      // ตรวจสอบ Foreign Key ก่อนบันทึกข้อมูล
      if (!isGiftShipping) {
        // ตรวจสอบว่า Province, Amphure, Tambon มีอยู่จริงไหม
        const province = await prisma.thaiprovinces.findUnique({
          where: { id: shippingInfo.provinceId }
        });
        
        if (!province) {
          throw new Error(`ไม่พบข้อมูลจังหวัดรหัส ${shippingInfo.provinceId}`);
        } else {
          // ใช้ชื่อจังหวัดที่ถูกต้องจากฐานข้อมูล
          provinceName = province.nameTh;
        }
        
        const amphure = await prisma.thaiamphures.findUnique({
          where: { id: shippingInfo.amphureId }
        });
        
        if (!amphure) {
          throw new Error(`ไม่พบข้อมูลอำเภอ/เขตรหัส ${shippingInfo.amphureId}`);
        } else {
          // ใช้ชื่ออำเภอที่ถูกต้องจากฐานข้อมูล
          amphureName = amphure.nameTh;
        }
        
        const tambon = await prisma.thaitambons.findUnique({
          where: { id: shippingInfo.tambonId }
        });
        
        if (!tambon) {
          throw new Error(`ไม่พบข้อมูลตำบล/แขวงรหัส ${shippingInfo.tambonId}`);
        } else {
          // ใช้ชื่อตำบลที่ถูกต้องจากฐานข้อมูล
          tambonName = tambon.nameTh;
        }
      } else {
        // เป็นการจัดส่งให้ผู้อื่น ให้ใช้ ID = 1 ที่มีอยู่ในฐานข้อมูลแน่นอน
        provinceId = 1;  // ID จังหวัดเริ่มต้น (กรุงเทพฯ)
        amphureId = 1001;   // ID อำเภอเริ่มต้น
        tambonId = 100101;    // ID ตำบลเริ่มต้น
        provinceName = 'จัดส่งให้ผู้รับโดยตรง';
        amphureName = 'จัดส่งให้ผู้รับโดยตรง';
        tambonName = 'จัดส่งให้ผู้รับโดยตรง';
      }
      
      // ตรวจสอบสินค้า
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product) {
          throw new Error(`ไม่พบสินค้ารหัส ${item.productId}`);
        }
      }
      
      // เตรียมข้อมูลสำหรับสร้างคำสั่งซื้อ
      const bangkokNow = getBangkokDateTime();
      // Debug log for userId conversion to BigInt
      if (userId) {
        console.log('Converting userId to BigInt:', userId, '→', BigInt(userId));
        console.log('userId is defined and will be saved to database');
      } else {
        console.log('No userId provided, will be null in database');
      }
      
      // Create order data with explicit userId handling
      const orderCreateData: any = {
        orderNumber,
        // Ensure userId is properly converted to number and explicitly set
        // Using null instead of undefined for better Prisma compatibility
        userId: userId && Number(userId) > 0 ? Number(userId) : null,
        totalAmount: new Decimal(subtotal),
        shippingCost: new Decimal(shippingCost),
        discount: new Decimal(discount),
        discountCode: discountCode || null,
        finalAmount: new Decimal(finalAmount),
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        createdAt: bangkokNow,
        updatedAt: bangkokNow,
        customerInfo: {
          create: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            note: customerInfo.note || '',
            createdAt: bangkokNow,
            updatedAt: bangkokNow
          }
        },
        shippingInfo: {
          create: {
            receiverName: shippingInfo.receiverName,
            receiverLastname: shippingInfo.receiverLastname,
            receiverPhone: shippingInfo.receiverPhone,
            addressLine: shippingInfo.addressLine,
            addressLine2: shippingInfo.addressLine2 || '',
            provinceId: provinceId,
            provinceName: provinceName,
            amphureId: amphureId,
            amphureName: amphureName,
            tambonId: tambonId,
            tambonName: tambonName,
            zipCode: shippingInfo.zipCode,
            deliveryDate: shippingInfo.deliveryDate ? 
              (typeof shippingInfo.deliveryDate === 'string' ? 
               convertToBangkokTime(new Date(shippingInfo.deliveryDate)) : 
               convertToBangkokTime(shippingInfo.deliveryDate)) : 
              null,
            deliveryTime: shippingInfo.deliveryTime || '',
            cardMessage: shippingInfo.cardMessage || '',
            additionalNote: shippingInfo.additionalNote || '',
            createdAt: bangkokNow,
            updatedAt: bangkokNow
          }
        },
        orderItems: {
          create: items.map((item: {
            productId: number;
            productName: string;
            productImg?: string;
            quantity: number;
            unitPrice: number;
          }) => ({
            productId: item.productId,
            productName: item.productName,
            productImg: item.productImg,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.quantity * item.unitPrice),
            createdAt: getBangkokDateTime(),
            updatedAt: getBangkokDateTime()
          }))
        }
      };
      
      // เพิ่มข้อมูลการชำระเงินถ้ามี paymentReference
      if (paymentReference) {
        orderCreateData.paymentInfo = {
          create: {
            paymentMethod: paymentMethod,
            transactionId: paymentReference,
            amount: new Decimal(finalAmount),
            status: paymentStatus,
            paymentDate: paymentStatus === 'CONFIRMED' ? bangkokNow : null,
            createdAt: bangkokNow,
            updatedAt: bangkokNow
          }
        };
      }
      
      // Debug log for final orderCreateData with userId and paymentStatus
      console.log('Final orderCreateData with userId and paymentStatus:', {
        orderNumber: orderCreateData.orderNumber,
        userId: orderCreateData.userId,
        paymentMethod: orderCreateData.paymentMethod,
        paymentStatus: orderCreateData.paymentStatus,
        hasPaymentInfo: !!orderCreateData.paymentInfo
      });
      
      // บันทึกข้อมูลคำสั่งซื้อแบบ Transaction เพื่อให้ข้อมูลสมบูรณ์
      const newOrder = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
        // สร้างคำสั่งซื้อโดยใช้ชื่อตารางตามที่ map ไว้ในไฟล์ schema
        const result = await tx.order.create({
          data: orderCreateData,
          include: {
            customerInfo: true,
            shippingInfo: true,
            orderItems: true
          }
        });
        
        // Debug log for created order with userId
        console.log('Created order with userId:', {
          order_id: result.id,
          order_number: result.orderNumber,
          userId_in_db: result.userId ? result.userId.toString() : 'null'
        });
        
        return result;
      });
      
      console.log('Order created successfully:', newOrder.id, newOrder.orderNumber);
      
      // Convert BigInt values to strings to avoid serialization issues
      const serializedOrder = {
        ...newOrder,
        id: newOrder.id.toString(),
        userId: newOrder.userId !== null ? newOrder.userId : null,
        // Also handle BigInt values in related entities if needed
        orderItems: newOrder.orderItems.map((item: any) => ({
          ...item,
          id: item.id.toString(),
          orderId: item.orderId.toString(),
          productId: item.productId.toString()
        })),
      };
      
      return {
        success: true,
        message: 'สร้างคำสั่งซื้อสำเร็จ',
        order: serializedOrder
      };
    } catch (createError: any) {
      console.error('Database error while creating order:', createError);
      
      // ตรวจสอบประเภทข้อผิดพลาดที่อาจเกิดขึ้น
      if (createError.code === 'P2002') {
        throw new Error(`เลขที่คำสั่งซื้อซ้ำ: ${orderNumber}`);
      } else if (createError.code === 'P2003') {
        throw new Error(`ข้อมูลอ้างอิงไม่ถูกต้อง: ${createError.meta?.field_name || ''}`);
      } else if (createError.code === 'P2025') {
        throw new Error(`ไม่พบข้อมูลที่อ้างอิง: ${createError.meta?.cause || ''}`);
      } else if (createError.message) {
        // ถ้ามีข้อความแสดงข้อผิดพลาดชัดเจนแล้ว ให้ส่งต่อไปเลย
        throw createError;
      } else {
        throw new Error(`เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ: ${JSON.stringify(createError)}`);
      }
    }
  } catch (error: any) {
    console.error('Error creating order:', error);
    throw new Error(error.message || 'ไม่สามารถบันทึกคำสั่งซื้อได้');
  }
} 