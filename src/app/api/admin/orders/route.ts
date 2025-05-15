import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';

// นำเข้า enum ที่ต้องการใช้งาน
type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

// Add custom type for Order that includes adminComment
interface OrderWithAdminComment {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: any;
  shippingCost: any;
  discount: any;
  finalAmount: any;
  adminComment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerInfo: any;
  orderItems: any[];
  shippingInfo: any;
  paymentInfo: any;
  [key: string]: any;
}

const prisma = new PrismaClient();

/**
 * Helper function to convert BigInt values to strings in an object
 * This is needed because JSON.stringify cannot serialize BigInt values
 */
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntToString(obj[key]);
    }
    return result;
  }

  return obj;
}

/**
 * GET handler for fetching all orders or a single order by ID (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  console.log('Admin orders API called');
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    // ถ้ามี orderId ให้ดึงข้อมูลคำสั่งซื้อเฉพาะรายการนั้น
    if (orderId) {
      console.log('Fetching single order with ID:', orderId);
      
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          customerInfo: true,
          orderItems: true,
          shippingInfo: true,
          paymentInfo: true
        }
      }) as unknown as OrderWithAdminComment;
      
      // เพิ่ม debug log เพื่อตรวจสอบค่า adminComment ที่ได้จาก DB
      console.log('Order from DB:', order);
      console.log('adminComment from DB:', order?.adminComment);
      
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบคำสั่งซื้อที่ต้องการ' },
          { status: 404 }
        );
      }
      
      // ดึงค่า adminComment ด้วย raw query เพื่อให้แน่ใจว่าได้ค่าที่ถูกต้อง
      const adminCommentResult = await prisma.$queryRaw<{adminComment: string | null}[]>`SELECT adminComment FROM orders WHERE id = ${order.id}`;
      if (adminCommentResult && adminCommentResult.length > 0) {
        order.adminComment = adminCommentResult[0].adminComment;
      }
      
      // ดึงข้อมูล payment confirmations ที่เกี่ยวข้องกับออเดอร์นี้
      const paymentConfirmations = await prisma.paymentConfirmation.findMany({
        where: { orderNumber: order.orderNumber },
        orderBy: { createdAt: 'desc' }
      });
      
      // Format dates and convert BigInt values to strings
      const formattedOrder = {
        ...order,
        adminComment: order?.adminComment,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        paymentConfirmations: paymentConfirmations || []
      };
      
      // Convert BigInt values to strings
      const safeOrder = convertBigIntToString(formattedOrder);
      
      return NextResponse.json({
        success: true,
        order: safeOrder
      });
    }
    
    // ถ้าไม่มี orderId ให้ดึงข้อมูลคำสั่งซื้อทั้งหมดตามเดิม
    const page = parseInt(url.searchParams.get('page') || '1');
    const limitParam = url.searchParams.get('limit') || '10';
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const dateFrom = url.searchParams.get('dateFrom') || undefined;
    const dateTo = url.searchParams.get('dateTo') || undefined;
    const paymentStatus = url.searchParams.get('paymentStatus') || undefined;
    const hasSlip = url.searchParams.get('hasSlip') || undefined;
    const minAmount = url.searchParams.get('minAmount') || undefined;
    const maxAmount = url.searchParams.get('maxAmount') || undefined;
    const paymentMethod = url.searchParams.get('paymentMethod') || undefined;
    const userId = url.searchParams.get('userId') || undefined;
    const province = url.searchParams.get('province') || undefined;
    const deliveryDateFrom = url.searchParams.get('deliveryDateFrom') || undefined;
    const deliveryDateTo = url.searchParams.get('deliveryDateTo') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // ตรวจสอบว่าเป็น 'all' หรือไม่
    const isShowAll = limitParam.toLowerCase() === 'all';
    const limit = isShowAll ? 1000 : parseInt(limitParam); // ใช้ค่าสูงๆ เช่น 1000 เมื่อเป็น 'all'
    
    console.log('Query params:', { 
      page, limit, isShowAll, status, search, dateFrom, dateTo, 
      paymentStatus, hasSlip, minAmount, maxAmount, paymentMethod, userId, province, deliveryDateFrom, deliveryDateTo,
      sortBy, sortOrder
    });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where: any = {};
    
    if (status) {
      where.status = status as OrderStatus;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus as PaymentStatus;
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    if (minAmount || maxAmount) {
      where.finalAmount = {};
      
      if (minAmount) {
        where.finalAmount.gte = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        where.finalAmount.lte = parseFloat(maxAmount);
      }
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        // Add one day to include the end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerInfo: { firstName: { contains: search } } },
        { customerInfo: { lastName: { contains: search } } },
        { customerInfo: { email: { contains: search } } },
        { customerInfo: { phone: { contains: search } } },
        { shippingInfo: { receiverName: { contains: search } } },
        { shippingInfo: { receiverLastname: { contains: search } } },
        { shippingInfo: { receiverPhone: { contains: search } } },
        { shippingInfo: { addressLine: { contains: search } } }
      ];
    }
    
    // ค้นหาตามจังหวัด
    if (province) {
      if (!where.shippingInfo) {
        where.shippingInfo = {};
      }
      where.shippingInfo.provinceName = { contains: province };
    }
    
    // ค้นหาตามวันที่จัดส่ง
    if (deliveryDateFrom || deliveryDateTo) {
      if (!where.shippingInfo) {
        where.shippingInfo = {};
      }
      
      if (!where.shippingInfo.deliveryDate) {
        where.shippingInfo.deliveryDate = {};
      }
      
      if (deliveryDateFrom) {
        where.shippingInfo.deliveryDate.gte = new Date(deliveryDateFrom);
      }
      
      if (deliveryDateTo) {
        // Add one day to include the end date
        const endDate = new Date(deliveryDateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.shippingInfo.deliveryDate.lt = endDate;
      }
    }
    
    // ตรวจสอบและกำหนดเงื่อนไขการเรียงลำดับ
    const validSortFields = ['createdAt', 'updatedAt', 'finalAmount', 'orderNumber'];
    const orderBy: any = {};
    
    // ใช้ createdAt เป็นค่าเริ่มต้นถ้า sortBy ไม่ถูกต้อง
    const fieldToSort = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    orderBy[fieldToSort as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    
    // Count total orders matching the filter
    const totalItems = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    
    // ดึง order IDs ที่มีหลักฐานการชำระเงิน (สำหรับ filter hasSlip)
    let orderIdsWithSlip: string[] = [];
    if (hasSlip) {
      try {
        // ใช้ raw query แทนเพื่อหลีกเลี่ยงปัญหากับ Prisma syntax
        const rawQuery = `
          SELECT DISTINCT orderNumber 
          FROM payment_confirmations 
          WHERE slipUrl IS NOT NULL AND slipUrl != ''
        `;
        const ordersWithSlip = await prisma.$queryRawUnsafe<{ orderNumber: string }[]>(rawQuery);
        
        orderIdsWithSlip = ordersWithSlip.map(o => o.orderNumber);
        console.log('Order IDs with slip:', orderIdsWithSlip);
        
        // อัพเดต where condition ด้วย order IDs ที่มีหรือไม่มี slip
        if (hasSlip === 'yes') {
          where.orderNumber = { in: orderIdsWithSlip };
        } else if (hasSlip === 'no') {
          where.orderNumber = { notIn: orderIdsWithSlip };
        }
      } catch (slipError) {
        console.error('Error fetching orders with slip:', slipError);
        // ถ้าเกิดข้อผิดพลาด ให้ข้ามเงื่อนไขนี้ไป (fallback)
      }
    }
    
    // Fetch orders with pagination and include related data
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        customerInfo: true,
        orderItems: true,
        shippingInfo: true,
        paymentInfo: true
      }
    });
    
    // ดึง payment confirmations สำหรับออเดอร์ทั้งหมด
    const orderNumbers = orders.map(order => order.orderNumber);
    let paymentConfirmations: any[] = [];
    
    try {
      paymentConfirmations = await prisma.paymentConfirmation.findMany({
        where: {
          orderNumber: { in: orderNumbers }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (pcError) {
      console.error('Error fetching payment confirmations:', pcError);
      // ไม่ throw error แต่ใช้อาร์เรย์ว่างแทน
      paymentConfirmations = [];
    }
    
    // จัดกลุ่ม payment confirmations ตาม orderNumber
    const paymentConfirmationsByOrderNumber = paymentConfirmations.reduce((acc, pc) => {
      if (!acc[pc.orderNumber]) {
        acc[pc.orderNumber] = [];
      }
      acc[pc.orderNumber].push(pc);
      return acc;
    }, {} as Record<string, any[]>);
    
    // กรองออเดอร์ตาม hasSlip (ถ้ามีการระบุ) - ไม่จำเป็นต้องใช้แล้วเพราะใช้ SQL query แล้ว
    const filteredOrders = orders;
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedOrders = filteredOrders.map((order: any) => {
      // Create a new object with formatted dates
      const formattedOrder = {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        // เพิ่ม payment confirmations ที่เกี่ยวข้องกับออเดอร์นี้
        paymentConfirmations: paymentConfirmationsByOrderNumber[order.orderNumber] || []
      };
      return formattedOrder;
    });
    
    // Convert BigInt values to strings
    const safeOrders = convertBigIntToString(formattedOrders);
    
    return NextResponse.json({
      success: true,
      orders: safeOrders,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in orders API endpoint:', error);
    
    // Add more detailed error information
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
      console.error('Error details:', errorDetails, error.stack);
    } else {
      errorDetails = String(error);
      console.error('Unknown error type:', typeof error, error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for updating an order status (admin only)
 */
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { orderId, status, paymentStatus, adminComment } = body;
    
    console.log('Update order request:', { orderId, status, paymentStatus, adminComment });
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // Validate status values
    const validOrderStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (status && !validOrderStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { success: false, message: 'สถานะคำสั่งซื้อไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    const validPaymentStatuses: PaymentStatus[] = ['PENDING', 'CONFIRMED', 'REJECTED'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus as PaymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'สถานะการชำระเงินไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status as OrderStatus;
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus as PaymentStatus;
    }
    
    // อัพเดตออเดอร์
    let updatedOrder: OrderWithAdminComment;
    
    // ถ้ามีการระบุ adminComment ให้ใช้ SQL raw query
    if (adminComment !== undefined) {
      const orderNumeric = parseInt(orderId);
      
      // อัพเดตด้วย SQL แทน
      if (Object.keys(updateData).length > 0) {
        // อัพเดตทั้ง status, paymentStatus และ adminComment ด้วย SQL query
        const updateFields = [];
        const params: any[] = [];
        
        if (status) {
          updateFields.push('status = ?');
          params.push(status);
        }
        
        if (paymentStatus) {
          updateFields.push('paymentStatus = ?');
          params.push(paymentStatus);
        }
        
        updateFields.push('adminComment = ?');
        params.push(adminComment);
        
        // เพิ่ม ID เป็นพารามิเตอร์สุดท้าย
        params.push(orderNumeric);
        
        const updateSQL = `UPDATE orders SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE id = ?`;
        await prisma.$executeRawUnsafe(updateSQL, ...params);
      } else {
        // อัพเดตเฉพาะ adminComment
        await prisma.$executeRawUnsafe('UPDATE orders SET adminComment = ?, updatedAt = NOW() WHERE id = ?', adminComment, orderNumeric);
      }
      
      // ดึงข้อมูลออเดอร์หลังจากอัพเดต
      updatedOrder = await prisma.order.findUnique({
        where: { id: orderNumeric },
        include: {
          customerInfo: true,
          orderItems: true,
          shippingInfo: true,
          paymentInfo: true
        }
      }) as unknown as OrderWithAdminComment;
    } else {
      // ถ้าไม่มี adminComment ให้ใช้ .update() ตามปกติ
      updatedOrder = await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: updateData,
        include: {
          customerInfo: true,
          orderItems: true,
          shippingInfo: true,
          paymentInfo: true
        }
      }) as unknown as OrderWithAdminComment;
    }
    
    // ดึงข้อมูล payment confirmations ที่เกี่ยวข้องกับออเดอร์นี้
    const paymentConfirmations = await prisma.paymentConfirmation.findMany({
      where: {
        orderNumber: updatedOrder?.orderNumber || ''
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // ตรวจสอบว่า updatedOrder ไม่เป็น null
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถอัปเดตคำสั่งซื้อได้' },
        { status: 500 }
      );
    }
    
    // ดึงค่า adminComment ด้วย raw query เพื่อให้แน่ใจว่าได้ค่าที่ถูกต้อง
    const adminCommentResult = await prisma.$queryRaw<{adminComment: string | null}[]>`SELECT adminComment FROM orders WHERE id = ${updatedOrder.id}`;
    if (adminCommentResult && adminCommentResult.length > 0) {
      updatedOrder.adminComment = adminCommentResult[0].adminComment;
    }
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedOrder = {
      ...updatedOrder,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
      paymentConfirmations: paymentConfirmations || []
    };
    
    // Convert BigInt values to strings
    const safeOrder = convertBigIntToString(formattedOrder);
    
    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อเรียบร้อย',
      order: safeOrder
    });
  } catch (error) {
    console.error('Error in update order endpoint:', error);
    
    let errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ',
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for deleting an order (admin only)
 */
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    console.log('Delete order request:', { orderId });
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // Delete related records first (to maintain referential integrity)
    // 1. Delete order items
    await prisma.orderItem.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 2. Delete customer info
    await prisma.customerInfo.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 3. Delete shipping info
    await prisma.shippingInfo.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 4. Delete payment info
    await prisma.paymentInfo.deleteMany({
      where: { orderId: parseInt(orderId) }
    });
    
    // 5. Finally delete the order
    const deletedOrder = await prisma.order.delete({
      where: { id: parseInt(orderId) }
    });
    
    return NextResponse.json({
      success: true,
      message: 'ลบคำสั่งซื้อเรียบร้อยแล้ว',
      order: convertBigIntToString(deletedOrder)
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ' },
      { status: 500 }
    );
  }
});
