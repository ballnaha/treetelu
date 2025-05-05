const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders2025() {
  try {
    // ตรวจสอบคำสั่งซื้อในปี 2025 เดือนเมษายน
    const aprilFilterCondition = {
      createdAt: {
        gte: new Date(2025, 3, 1),  // 1 เมษายน 2025
        lt: new Date(2025, 4, 1)    // 1 พฤษภาคม 2025
      }
    };

    console.log("=== ข้อมูลเดือนเมษายน 2025 ===");

    // นับจำนวนคำสั่งซื้อทั้งหมดในเดือนเมษายน
    const aprilTotalOrders = await prisma.order.count({
      where: aprilFilterCondition
    });
    console.log(`จำนวนคำสั่งซื้อทั้งหมด: ${aprilTotalOrders}`);

    // นับจำนวนคำสั่งซื้อแยกตามสถานะในเดือนเมษายน
    const aprilStatusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: aprilFilterCondition,
      _count: {
        status: true
      }
    });

    console.log("จำนวนคำสั่งซื้อแยกตามสถานะ:");
    aprilStatusCounts.forEach(item => {
      console.log(`- ${item.status}: ${item._count.status}`);
    });

    // ตรวจสอบสถานะแต่ละประเภทโดยตรง
    const statusTypes = ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    console.log("\nตรวจสอบสถานะแบบละเอียด:");
    for (const status of statusTypes) {
      const count = await prisma.order.count({
        where: {
          ...aprilFilterCondition,
          status
        }
      });
      console.log(`- ${status}: ${count}`);
    }

    // ดึงข้อมูลคำสั่งซื้อในเดือนเมษายน
    const aprilOrders = await prisma.order.findMany({
      where: aprilFilterCondition,
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

    console.log("\nรายละเอียดคำสั่งซื้อในเดือนเมษายน 2025:");
    aprilOrders.forEach((order, index) => {
      console.log(`${index + 1}. รหัส: ${order.orderNumber}`);
      console.log(`   สถานะ: ${order.status}`);
      console.log(`   การชำระเงิน: ${order.paymentStatus}`);
      console.log(`   วันที่สร้าง: ${order.createdAt}`);
      console.log('----------------------------');
    });

    // ทำแบบเดียวกันสำหรับเดือนพฤษภาคม
    console.log("\n\n=== ข้อมูลเดือนพฤษภาคม 2025 ===");

    const mayFilterCondition = {
      createdAt: {
        gte: new Date(2025, 4, 1),  // 1 พฤษภาคม 2025
        lt: new Date(2025, 5, 1)    // 1 มิถุนายน 2025
      }
    };

    // นับจำนวนคำสั่งซื้อทั้งหมดในเดือนพฤษภาคม
    const mayTotalOrders = await prisma.order.count({
      where: mayFilterCondition
    });
    console.log(`จำนวนคำสั่งซื้อทั้งหมด: ${mayTotalOrders}`);

    // ตรวจสอบสถานะแบบละเอียดสำหรับเดือนพฤษภาคม
    console.log("\nตรวจสอบสถานะแบบละเอียด (พ.ค.):");
    for (const status of statusTypes) {
      const count = await prisma.order.count({
        where: {
          ...mayFilterCondition,
          status
        }
      });
      console.log(`- ${status}: ${count}`);
    }

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้ฟังก์ชัน
checkOrders2025(); 