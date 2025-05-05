const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAprilOrders() {
  try {
    // ตรวจสอบคำสั่งซื้อทั้งหมดในเดือนเมษายน
    const dateFilterCondition = {
      createdAt: {
        gte: new Date(2024, 3, 1),   // 1 เมษายน 2024
        lt: new Date(2024, 4, 1)     // 1 พฤษภาคม 2024
      }
    };

    // นับจำนวนคำสั่งซื้อทั้งหมดในเดือนเมษายน
    const totalOrders = await prisma.order.count({
      where: dateFilterCondition
    });

    console.log(`จำนวนคำสั่งซื้อทั้งหมดในเดือนเมษายน 2024: ${totalOrders}`);

    // ดึงข้อมูลคำสั่งซื้อในเดือนเมษายน
    const orders = await prisma.order.findMany({
      where: dateFilterCondition,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // แสดงรายละเอียดของแต่ละคำสั่งซื้อ
    console.log("\nรายละเอียดคำสั่งซื้อในเดือนเมษายน 2024:");
    orders.forEach((order, index) => {
      console.log(`${index + 1}. รหัส: ${order.orderNumber}`);
      console.log(`   สถานะ: ${order.status}`);
      console.log(`   การชำระเงิน: ${order.paymentStatus}`);
      console.log(`   วันที่สร้าง: ${order.createdAt}`);
      console.log('----------------------------');
    });

    // นับคำสั่งซื้อตามสถานะ
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: dateFilterCondition,
      _count: {
        status: true
      }
    });

    console.log("\nจำนวนคำสั่งซื้อแยกตามสถานะ:");
    statusCounts.forEach(item => {
      console.log(`${item.status}: ${item._count.status} รายการ`);
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้ฟังก์ชัน
checkAprilOrders(); 