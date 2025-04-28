import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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
    
    // 1. ดึงข้อมูลจำนวนคำสั่งซื้อทั้งหมด
    const totalOrders = await prisma.order.count();
    
    // 2. ดึงข้อมูลจำนวนคำสั่งซื้อที่รอดำเนินการ
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING'
      }
    });
    
    // 2.1 ดึงข้อมูลจำนวนคำสั่งซื้อที่มีหลักฐานการชำระเงินแต่ยังไม่ได้ยืนยัน
    // หา order ที่มี payment confirmation อย่างน้อย 1 รายการ แต่ยังมีสถานะการชำระเงินเป็น PENDING
    const pendingPayments = await prisma.order.findMany({
      where: {
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
    
    // 3. ดึงข้อมูลยอดขายทั้งหมด
    const salesData = await prisma.order.aggregate({
      _sum: {
        finalAmount: true
      },
      where: {
        paymentStatus: 'CONFIRMED'
      }
    });
    const totalSales = salesData._sum.finalAmount || 0;
    
    // 4. ดึงข้อมูลจำนวนสินค้าทั้งหมด
    const totalProducts = await prisma.product.count();
    
    // 5. ดึงข้อมูลจำนวนสินค้าที่ใกล้หมด (stock < 5)
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lte: 5,
          gt: 0
        }
      }
    });
    
    // 5.1 ดึงข้อมูลจำนวนสินค้าที่หมดสต๊อก (stock = 0)
    const outOfStockProducts = await prisma.product.count({
      where: {
        stock: 0
      }
    });
    
    // 6. ดึงข้อมูลจำนวนลูกค้าทั้งหมด
    const totalCustomers = await prisma.users.count();
    
    // 7. ดึงข้อมูลคำสั่งซื้อล่าสุด 5 รายการ
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
      date: order.createdAt.toISOString()
    }));
    
    // 7.1 ดึงข้อมูลคำสั่งซื้อแยกตามปี (สำหรับการกรองตามปี)
    // ดึงคำสั่งซื้อย้อนหลัง 5 ปี หรือนับตั้งแต่มีคำสั่งซื้อแรก
    const startYear = 2022; // ปีเริ่มต้นที่มีข้อมูล
    
    // ดึงข้อมูลคำสั่งซื้อ 30 รายการล่าสุดเพื่อใช้แบ่งตามปี
    const ordersForYearFilter = await prisma.order.findMany({
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
      orderBy: {
        createdAt: 'desc'
      },
      take: 30
    });
    
    // แบ่งคำสั่งซื้อตามปีและเก็บเฉพาะ 5 รายการในแต่ละปี
    const recentOrdersByYear: Record<string, any[]> = {};
    
    for (const order of ordersForYearFilter) {
      const year = new Date(order.createdAt).getFullYear().toString();
      
      if (!recentOrdersByYear[year]) {
        recentOrdersByYear[year] = [];
      }
      
      // เก็บเฉพาะ 5 รายการแรกของแต่ละปี
      if (recentOrdersByYear[year].length < 5) {
        recentOrdersByYear[year].push({
          id: order.id.toString(),
          orderNumber: order.orderNumber,
          customerName: order.customerInfo ? 
            `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 'ไม่ระบุ',
          amount: Number(order.finalAmount),
          status: order.status,
          date: order.createdAt.toISOString()
        });
      }
    }
    
    // 8. ดึงข้อมูลการกระจายสถานะคำสั่งซื้อ
    const orderStatusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    const orderStatusDistribution = orderStatusCounts.map(item => ({
      status: item.status,
      count: item._count.status
    }));
    
    // 8.1 ดึงข้อมูลการกระจายสถานะคำสั่งซื้อแยกตามปี
    // Query ข้อมูลสถานะคำสั่งซื้อจากฐานข้อมูลพร้อมปีที่สร้าง
    const orderStatusByYear = await prisma.$queryRaw`
      SELECT 
        status, 
        EXTRACT(YEAR FROM createdAt) as year, 
        COUNT(*) as count
      FROM orders 
      GROUP BY status, EXTRACT(YEAR FROM createdAt)
      ORDER BY EXTRACT(YEAR FROM createdAt) DESC, count DESC
    `;
    
    // แปลงข้อมูลเป็นรูปแบบที่ต้องการ {year: [{status, count}, ...]}
    const orderStatusDistributionByYear: Record<string, any[]> = {};
    
    for (const item of orderStatusByYear as any[]) {
      const year = item.year.toString();
      
      if (!orderStatusDistributionByYear[year]) {
        orderStatusDistributionByYear[year] = [];
      }
      
      orderStatusDistributionByYear[year].push({
        status: item.status,
        count: Number(item.count)
      });
    }
    
    // 9. ดึงข้อมูลยอดขายรายเดือนย้อนหลัง 6 เดือน
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
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
    
    // สร้างอาเรย์ของเดือนย้อนหลัง 6 เดือน
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      return date;
    }).reverse();
    
    // ดึงข้อมูลยอดขายแต่ละเดือน
    const monthlySalesPromises = last6Months.map(async (month) => {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
      
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
        month: getThaiMonth(month),
        monthFull: getFormattedThaiMonth(month),
        sales: totalSales,
        year: month.getFullYear(), // ปี ค.ศ.
        numOrders: monthlyOrders.length
      };
    });
    
    const salesByMonth = await Promise.all(monthlySalesPromises);
    
    // เตรียมข้อมูลเพิ่มเติมสำหรับการแสดงผลกราฟ
    const maxSales = Math.max(...salesByMonth.map(m => m.sales));
    const totalSalesAllMonths = salesByMonth.reduce((sum, month) => sum + month.sales, 0);
    const averageMonthlySales = salesByMonth.length > 0 
      ? totalSalesAllMonths / salesByMonth.length 
      : 0;
    
    // 10. ดึงข้อมูลสินค้าขายดี 10 อันดับ
    // ต้องเชื่อมข้อมูลจาก orderItem กับข้อมูลสินค้า
    const topSellingProducts = await prisma.$queryRaw`
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
      GROUP BY 
        p.id, p.productName, EXTRACT(YEAR FROM o.createdAt)
      ORDER BY 
        EXTRACT(YEAR FROM o.createdAt) DESC, totalSold DESC
      LIMIT 30
    `;
    
    // กรองและจัดกลุ่มสินค้าขายดีตามปี
    const topSellingProductsByYear: Record<string, any[]> = {};
    
    if (Array.isArray(topSellingProducts)) {
      // จัดกลุ่มตามปี
      topSellingProducts.forEach(product => {
        const productYear = Number(product.year);
        const yearKey = String(productYear); // แปลงเป็น string เพื่อใช้เป็น key
        
        if (!topSellingProductsByYear[yearKey]) {
          topSellingProductsByYear[yearKey] = [];
        }
        
        if (topSellingProductsByYear[yearKey].length < 10) {
          topSellingProductsByYear[yearKey].push({
            id: String(product.id),
            name: product.name,
            totalSold: Number(product.totalSold),
            totalAmount: Number(product.totalAmount),
            year: productYear
          });
        }
      });
    }
    
    // Debug log แสดงปีและจำนวนสินค้าแต่ละปี
    console.log('topSellingProductsByYear:', 
      Object.keys(topSellingProductsByYear).map(year => ({ 
        year, 
        count: topSellingProductsByYear[year].length,
        sample: topSellingProductsByYear[year][0] ? topSellingProductsByYear[year][0].name : 'none'
      }))
    );
    
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
      topSellingProducts: topSellingProductsByYear[String(now.getFullYear())] || [],
      topSellingProductsByYear,
      recentOrdersByYear,
      orderStatusDistributionByYear
    };
    
    // คำนวณอัตราการเติบโตเทียบกับเดือนก่อนหน้า
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
    
    // ถ้ามีข้อมูลย้อนหลังเพียงพอ ให้คำนวณจากข้อมูลจริง
    // ในตัวอย่างนี้กำหนดค่าสมมติไว้ก่อน
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