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
        year: month.getFullYear() + 543, // ปี พ.ศ.
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
        CAST(SUM(oi.totalPrice) AS DECIMAL(10,2)) as totalAmount
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
        p.id, p.productName
      ORDER BY 
        totalSold DESC
      LIMIT 10
    `;
    
    // รวมข้อมูลทั้งหมด
    const dashboardData: any = {
      totalOrders,
      pendingOrders,
      totalSales: Number(totalSales),
      totalProducts,
      lowStockProducts,
      totalCustomers,
      recentOrders: formattedRecentOrders,
      orderStatusDistribution,
      salesByMonth,
      salesGraphData: {
        maxSales,
        totalSalesAllMonths,
        averageMonthlySales
      },
      topSellingProducts: Array.isArray(topSellingProducts) ? topSellingProducts.map(product => ({
        id: String(product.id),
        name: product.name,
        totalSold: Number(product.totalSold),
        totalAmount: Number(product.totalAmount)
      })) : []
    };
    
    // คำนวณอัตราการเติบโตเทียบกับเดือนก่อนหน้า
    // 1. ดึงข้อมูลยอดขายของเดือนปัจจุบันและเดือนก่อนหน้า
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(currentMonth.getMonth() - 1);
    
    const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    
    const startOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    const endOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 23, 59, 59);
    
    // ดึงยอดขายเดือนปัจจุบัน
    const currentMonthSales = await prisma.order.aggregate({
      _sum: {
        finalAmount: true
      },
      where: {
        createdAt: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        },
        status: {
          not: 'CANCELLED'
        },
        paymentStatus: 'CONFIRMED'
      }
    });
    
    // ดึงยอดขายเดือนก่อนหน้า
    const previousMonthSales = await prisma.order.aggregate({
      _sum: {
        finalAmount: true
      },
      where: {
        createdAt: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth
        },
        status: {
          not: 'CANCELLED'
        },
        paymentStatus: 'CONFIRMED'
      }
    });
    
    // ดึงจำนวนลูกค้าที่ลงทะเบียนในเดือนปัจจุบัน
    const currentMonthCustomers = await prisma.users.count({
      where: {
        createdAt: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        }
      }
    });
    
    // ดึงจำนวนลูกค้าที่ลงทะเบียนในเดือนก่อนหน้า
    const previousMonthCustomers = await prisma.users.count({
      where: {
        createdAt: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth
        }
      }
    });
    
    // คำนวณอัตราการเติบโตของยอดขาย
    const currentMonthSalesValue = Number(currentMonthSales._sum.finalAmount || 0);
    const previousMonthSalesValue = Number(previousMonthSales._sum.finalAmount || 0);
    
    let salesGrowthRate = 0;
    if (previousMonthSalesValue > 0) {
      salesGrowthRate = ((currentMonthSalesValue - previousMonthSalesValue) / previousMonthSalesValue) * 100;
    }
    
    // คำนวณอัตราการเติบโตของลูกค้า
    let customersGrowthRate = 0;
    if (previousMonthCustomers > 0) {
      customersGrowthRate = ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100;
    }
    
    // เพิ่มข้อมูลอัตราการเติบโต
    dashboardData.salesGrowthRate = parseFloat(salesGrowthRate.toFixed(1));
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