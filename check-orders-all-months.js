const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllMonthsOrders() {
  try {
    // ตรวจสอบว่ามีข้อมูลคำสั่งซื้อในเดือนใดบ้าง
    const ordersCountByMonth = await prisma.$queryRaw`
      SELECT 
        MONTH(createdAt) as month,
        YEAR(createdAt) as year,
        COUNT(*) as count
      FROM 
        orders
      GROUP BY 
        YEAR(createdAt), MONTH(createdAt)
      ORDER BY 
        YEAR(createdAt) DESC, MONTH(createdAt) ASC
    `;

    console.log("จำนวนคำสั่งซื้อแยกตามเดือน:");
    ordersCountByMonth.forEach(item => {
      // แปลงเลขเดือนเป็นชื่อเดือนไทย
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const monthName = thaiMonths[Number(item.month) - 1] || 'ไม่ทราบเดือน';
      console.log(`${monthName} ${item.year}: ${item.count} รายการ`);
    });

    // ดูข้อมูลทั้งหมดในตาราง orders
    const totalOrders = await prisma.order.count();
    console.log(`\nจำนวนคำสั่งซื้อทั้งหมดในระบบ: ${totalOrders} รายการ`);

    // แสดงข้อมูลคำสั่งซื้อ 5 รายการล่าสุด
    const latestOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true
      }
    });

    console.log("\nคำสั่งซื้อล่าสุด 5 รายการ:");
    latestOrders.forEach((order, index) => {
      console.log(`${index + 1}. รหัส: ${order.orderNumber}`);
      console.log(`   สถานะ: ${order.status}`);
      console.log(`   วันที่สร้าง: ${order.createdAt}`);
      console.log('----------------------------');
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้ฟังก์ชัน
checkAllMonthsOrders(); 