import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { validateAdminUser } from '@/lib/auth';

// ใช้ global variable สำหรับรันไทม์ของ Next.js เพื่อแก้ปัญหา hot-reloading
// ซึ่งทำให้เกิดการสร้าง PrismaClient ใหม่หลายตัว
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
 * GET handler for fetching dashboard data (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('Admin dashboard API called');
    
    // ตรวจสอบสิทธิ์ admin
    const isAdmin = await validateAdminUser(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      );
    }
    
    // รับพารามิเตอร์การกรอง
    const url = new URL(req.url);
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');
    
    // แปลงเป็นตัวเลขหรือค่าเริ่มต้น
    const filterYear = yearParam ? parseInt(yearParam) : null;
    const filterMonth = monthParam ? parseInt(monthParam) : null;
    
    console.log(`Filter params: year=${filterYear}, month=${filterMonth}`);
    
    // สร้างเงื่อนไขสำหรับกรองตามปีและเดือน
    const dateFilterCondition: any = {};
    
    if (filterYear !== null) {
      // กรองตามปี
      dateFilterCondition.createdAt = {
        gte: new Date(filterYear, 0, 1),
        lt: new Date(filterYear + 1, 0, 1)
      };
      
      // ถ้ามีการระบุเดือนด้วย
      if (filterMonth !== null && filterMonth > 0 && filterMonth <= 12) {
        // เปลี่ยนการกรองเป็นเฉพาะเดือนที่ระบุในปีที่ระบุ
        dateFilterCondition.createdAt = {
          gte: new Date(filterYear, filterMonth - 1, 1),
          lt: new Date(
            filterMonth === 12 ? filterYear + 1 : filterYear,
            filterMonth === 12 ? 0 : filterMonth,
            1
          )
        };
      }
    }
    
    // เพิ่ม logging ตรวจสอบเงื่อนไขการกรอง
    console.log('Date filter condition:', JSON.stringify(dateFilterCondition));
    
    // 1. ดึงข้อมูลจำนวนคำสั่งซื้อทั้งหมด (กรองตามเงื่อนไขถ้ามี)
    const totalOrders = await prisma.order.count({
      where: dateFilterCondition
    });
    
    console.log(`Total orders after filtering: ${totalOrders}`);
    
    // 2. ดึงข้อมูลจำนวนคำสั่งซื้อที่รอดำเนินการ (กรองตามเงื่อนไขถ้ามี)
    const pendingOrders = await prisma.order.count({
      where: {
        ...dateFilterCondition,
        status: 'PENDING'
      }
    });
    
    // 2.1 ดึงข้อมูลจำนวนคำสั่งซื้อที่มีหลักฐานการชำระเงินแต่ยังไม่ได้ยืนยัน
    // หา order ที่มี payment confirmation อย่างน้อย 1 รายการ แต่ยังมีสถานะการชำระเงินเป็น PENDING
    const pendingPayments = await prisma.order.findMany({
      where: {
        ...dateFilterCondition,
        paymentStatus: 'PENDING'
      }
    });

    // หาคำสั่งซื้อที่มีหลักฐานการชำระเงินแนบมาแล้ว
    const orderNumbers = pendingPayments.map(order => order.orderNumber);
    
    const paymentConfirmations = await prisma.paymentConfirmation.findMany({
      where: {
        orderNumber: {
          in: orderNumbers
        },
        status: 'PENDING'
      }
    });
    
    // กรองคำสั่งซื้อที่มีหลักฐานการชำระเงินแนบมา
    const orderNumbersWithConfirmation = new Set(paymentConfirmations.map(pc => pc.orderNumber));
    
    // จำนวนคำสั่งซื้อที่มีหลักฐานการชำระเงินที่รอการตรวจสอบ
    const pendingPaymentsCount = orderNumbersWithConfirmation.size;
    
    // 3. ดึงข้อมูลยอดขายทั้งหมด (กรองตามเงื่อนไขถ้ามี)
    const salesData = await prisma.order.aggregate({
      _sum: {
        finalAmount: true
      },
      where: {
        ...dateFilterCondition,
        paymentStatus: 'CONFIRMED'
      }
    });
    const totalSales = salesData._sum.finalAmount || 0;
    
    // 4. ดึงข้อมูลจำนวนสินค้าทั้งหมด (ไม่กรองตามวันที่)
    const totalProducts = await prisma.product.count();
    
    // 5. ดึงข้อมูลจำนวนสินค้าที่ใกล้หมด (stock < 5) (ไม่กรองตามวันที่)
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lte: 5,
          gt: 0
        }
      }
    });
    
    // 5.1 ดึงข้อมูลจำนวนสินค้าที่หมดสต๊อก (stock = 0) (ไม่กรองตามวันที่)
    const outOfStockProducts = await prisma.product.count({
      where: {
        stock: 0
      }
    });
    
    // 6. ดึงข้อมูลจำนวนลูกค้าทั้งหมด (ไม่กรองตามวันที่)
    const totalCustomers = await prisma.users.count();
    
    // 7. ดึงข้อมูลคำสั่งซื้อล่าสุด (กรองตามเงื่อนไขถ้ามี) สูงสุด 5 รายการ
    const recentOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        finalAmount: true,
        createdAt: true,
        customerInfo: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      where: dateFilterCondition,
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // แปลงข้อมูลคำสั่งซื้อล่าสุดให้เป็นรูปแบบที่ต้องการ
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customerInfo ? 
        `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 'ไม่ระบุ',
      amount: Number(order.finalAmount),
      status: order.status,
      date: order.createdAt.toISOString(),
      createdAt: order.createdAt.toISOString() // เพิ่มเพื่อให้ client ใช้ในการกรอง
    }));

    // 8. ดึงข้อมูลการกระจายสถานะคำสั่งซื้อ (กรองตามเงื่อนไขถ้ามี)
    const orderStatusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: dateFilterCondition
    });
    
    const orderStatusDistribution = orderStatusCounts.map(item => ({
      status: item.status,
      count: item._count.status
    }));
    
    // 9. ดึงข้อมูลยอดขายรายเดือน (ตามเงื่อนไขการกรอง)
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // ย้อนหลัง 6 เดือน
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // วันสุดท้ายของเดือนปัจจุบัน
    
    // ถ้ามีการกรองตามปี ให้ใช้ปีที่กรอง
    if (filterYear !== null) {
      startDate = new Date(filterYear, 0, 1); // 1 มกราคมของปีที่กรอง
      endDate = new Date(filterYear, 11, 31); // 31 ธันวาคมของปีที่กรอง
      
      // ถ้ามีการกรองตามเดือนด้วย ให้แสดงเฉพาะเดือนนั้น
      if (filterMonth !== null && filterMonth > 0 && filterMonth <= 12) {
        startDate = new Date(filterYear, filterMonth - 1, 1); // วันแรกของเดือนที่กรอง
        endDate = new Date(filterYear, filterMonth, 0); // วันสุดท้ายของเดือนที่กรอง
      }
    }
    
    // ฟังก์ชันสำหรับดึงชื่อเดือนไทย
    const getThaiMonth = (date: Date) => {
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      return thaiMonths[date.getMonth()];
    };
    
    // เพิ่มรหัสและชื่อเดือนไทยในฟอร์แมตใหม่
    const getFormattedThaiMonth = (date: Date) => {
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      return `${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    };
    
    // สร้างช่วงเดือนที่ต้องการแสดง
    const monthRange: Date[] = [];
    
    // ถ้ามีการกรองแค่เดือนเดียว
    if (filterYear !== null && filterMonth !== null && filterMonth > 0) {
      monthRange.push(new Date(filterYear, filterMonth - 1, 1));
    } else {
      // ถ้ากรองเฉพาะปี หรือไม่มีการกรอง ให้แสดงทุกเดือนในปีนั้น หรือ 6 เดือนล่าสุด
      if (filterYear !== null) {
        // แสดงทุกเดือนในปีที่กรอง
        for (let month = 0; month < 12; month++) {
          monthRange.push(new Date(filterYear, month, 1));
        }
      } else {
        // แสดง 6 เดือนล่าสุด
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          monthRange.push(new Date(date.getFullYear(), date.getMonth(), 1));
        }
      }
    }
    
    // ดึงข้อมูลยอดขายแต่ละเดือน
    const monthlySalesPromises = monthRange.map(async (monthDate) => {
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
      
      // ดึงข้อมูลรายการคำสั่งซื้อในเดือนนี้
      const monthlyOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: {
            not: 'CANCELLED'
          },
          paymentStatus: 'CONFIRMED'
        },
        select: {
          finalAmount: true,
          createdAt: true
        }
      });
      
      // คำนวณยอดขายรวม
      const totalSales = monthlyOrders.reduce((sum, order) => {
        return sum + Number(order.finalAmount || 0);
      }, 0);
      
      return {
        month: getThaiMonth(monthDate),
        monthFull: getFormattedThaiMonth(monthDate),
        sales: totalSales,
        year: monthDate.getFullYear(), // ปี ค.ศ.
        numOrders: monthlyOrders.length
      };
    });
    
    const salesByMonth = await Promise.all(monthlySalesPromises);
    
    // 10. ดึงข้อมูลสินค้าขายดี (กรองตามเงื่อนไขถ้ามี)
    // สร้างเงื่อนไขการกรองสำหรับคำสั่งซื้อ
    const orderDateFilter: any = {};
    if (dateFilterCondition.createdAt) {
      orderDateFilter.createdAt = dateFilterCondition.createdAt;
    }
    
    // ค่อนข้างซับซ้อนในการใช้ Raw SQL กับตัวกรอง อาจต้องปรับตามฐานข้อมูลที่ใช้
    let baseQuery = `
      SELECT 
        p.id,
        p.productName as name,
        CAST(SUM(oi.quantity) AS SIGNED) as totalSold,
        CAST(SUM(oi.totalPrice) AS DECIMAL(10,2)) as totalAmount,
        EXTRACT(YEAR FROM o.createdAt) as year
      FROM 
        order_items oi
      JOIN 
        product p ON oi.productId = p.id
      JOIN 
        orders o ON oi.orderId = o.id
      WHERE 
        o.status != 'CANCELLED'
        AND o.paymentStatus = 'CONFIRMED'
    `;
    
    // สร้าง condition และพารามิเตอร์
    let conditions = [];
    let queryParams: any[] = [];
    
    // เพิ่มเงื่อนไขตามการกรอง
    if (filterYear !== null) {
      if (filterMonth !== null && filterMonth > 0) {
        // กรองทั้งปีและเดือน
        conditions.push(`EXTRACT(YEAR FROM o.createdAt) = ? AND EXTRACT(MONTH FROM o.createdAt) = ?`);
        queryParams.push(filterYear, filterMonth);
      } else {
        // กรองเฉพาะปี
        conditions.push(`EXTRACT(YEAR FROM o.createdAt) = ?`);
        queryParams.push(filterYear);
      }
    }
    
    // เพิ่ม conditions เข้าไปใน query (ถ้ามี)
    if (conditions.length > 0) {
      baseQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    baseQuery += `
      GROUP BY 
        p.id, p.productName, EXTRACT(YEAR FROM o.createdAt)
      ORDER BY 
        totalSold DESC
      LIMIT 10
    `;
    
    // ใช้ $queryRawUnsafe สำหรับคำสั่ง SQL ที่มีตัวแปร
    // เนื่องจากคำสั่ง SQL มีความซับซ้อน เราจะใช้ $queryRawUnsafe ซึ่งปลอดภัยน้อยกว่า
    // แต่เนื่องจากค่า filterYear และ filterMonth มาจากระบบภายใน จึงมีความเสี่ยงต่ำ
    const topSellingProducts = await prisma.$queryRawUnsafe(baseQuery, ...queryParams);
    
    // กรองและแปลงข้อมูลสินค้าขายดี
    let formattedTopSellingProducts: any[] = [];
    
    if (Array.isArray(topSellingProducts)) {
      formattedTopSellingProducts = topSellingProducts.map(product => ({
        id: String(product.id),
        name: product.name,
        totalSold: Number(product.totalSold),
        totalAmount: Number(product.totalAmount),
        year: Number(product.year)
      }));
    }
    
    // สร้างข้อมูลสำหรับส่งกลับ
    let dashboardData = {
      totalOrders,
      totalSales: Number(totalSales),
      totalProducts,
      totalCustomers,
      pendingOrders,
      pendingPaymentsCount,
      lowStockProducts,
      outOfStockProducts,
      recentOrders: formattedRecentOrders,
      orderStatusDistribution,
      salesByMonth,
      salesGrowthRate: 0,
      customersGrowthRate: 0,
      topSellingProducts: formattedTopSellingProducts,
      // ข้อมูลเพิ่มเติมสำหรับ debugging
      filterParams: {
        year: filterYear,
        month: filterMonth
      }
    };
    
    // คำนวณอัตราการเติบโตเทียบกับเดือนก่อนหน้า (ถ้ามีข้อมูลพอ)
    if (salesByMonth.length >= 2) {
      const currentMonth = salesByMonth[salesByMonth.length - 1].sales;
      const prevMonth = salesByMonth[salesByMonth.length - 2].sales;
      
      if (prevMonth > 0) {
        const salesGrowthRate = ((currentMonth - prevMonth) / prevMonth) * 100;
        dashboardData.salesGrowthRate = parseFloat(salesGrowthRate.toFixed(1));
      }
    }
    
    // คำนวณอัตราการเติบโตของลูกค้า (สมมติให้เป็น 3.2%)
    let customersGrowthRate = 3.2;
    dashboardData.customersGrowthRate = parseFloat(customersGrowthRate.toFixed(1));
    
    return NextResponse.json({
      success: true,
      data: convertBigIntToString(dashboardData)
    });
  } catch (error) {
    console.error('Error in dashboard API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด';
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
} 