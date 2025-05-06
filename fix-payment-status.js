// สคริปต์สำหรับแก้ไขสถานะการชำระเงินที่ยังค้างอยู่
// วิธีการใช้งาน: node fix-payment-status.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Omise = require('omise');

// เชื่อมต่อกับฐานข้อมูล
const prisma = new PrismaClient();

// เชื่อมต่อกับ Omise API
const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});

/**
 * แปลงสถานะ Omise charge เป็นสถานะ PaymentStatus ในฐานข้อมูลของเรา
 * @param {string} omiseStatus - สถานะจาก Omise
 * @returns {string} สถานะที่ตรงกับ PaymentStatus ในฐานข้อมูลของเรา
 */
function mapOmiseStatusToPaymentStatus(omiseStatus) {
  if (omiseStatus === 'successful' || omiseStatus === 'paid') {
    return 'CONFIRMED';
  } else if (omiseStatus === 'pending') {
    return 'PENDING';
  } else if (omiseStatus === 'failed' || omiseStatus === 'expired') {
    return 'REJECTED';
  }
  return 'PENDING'; // default
}

/**
 * ฟังก์ชันหลักสำหรับการแก้ไขสถานะการชำระเงิน
 */
async function fixPaymentStatus() {
  console.log('======= เริ่มการตรวจสอบสถานะการชำระเงิน =======');
  
  try {
    // ดึงคำสั่งซื้อที่มีสถานะการชำระเงินเป็น PENDING และใช้การชำระเงินด้วยบัตรเครดิตหรือ PromptPay
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        paymentMethod: {
          in: ['CREDIT_CARD', 'PROMPTPAY']
        }
      },
      include: {
        paymentInfo: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // จำกัดจำนวนรายการที่จะตรวจสอบ
    });
    
    console.log(`พบคำสั่งซื้อที่มีสถานะการชำระเงินเป็น PENDING จำนวน ${pendingOrders.length} รายการ`);
    
    for (const order of pendingOrders) {
      console.log(`\nกำลังตรวจสอบคำสั่งซื้อ #${order.orderNumber} (ID: ${order.id})`);
      
      // ค้นหา charge ID จาก paymentInfo
      const transactionId = order.paymentInfo?.transactionId;
      
      if (!transactionId) {
        console.log(`- ไม่พบข้อมูล transactionId สำหรับคำสั่งซื้อ #${order.orderNumber}`);
        continue;
      }
      
      console.log(`- พบ Omise charge ID: ${transactionId}`);
      
      try {
        // ดึงข้อมูล charge จาก Omise API
        const charge = await omise.charges.retrieve(transactionId);
        
        console.log(`- สถานะ charge จาก Omise: ${charge.status}`);
        console.log(`- จำนวนเงิน: ${charge.amount / 100} บาท`);
        
        // ตรวจสอบสถานะการชำระเงิน
        if (charge.status === 'successful') {
          console.log(`- การชำระเงินสำเร็จ กำลังอัพเดทสถานะในฐานข้อมูล`);
          
          // อัพเดทสถานะการชำระเงินในตาราง orders
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'CONFIRMED',
              updatedAt: new Date()
            }
          });
          
          // อัพเดทสถานะการชำระเงินในตาราง payment_info
          if (order.paymentInfo) {
            await prisma.paymentInfo.update({
              where: { id: order.paymentInfo.id },
              data: {
                status: 'CONFIRMED',
                paymentDate: new Date(),
                updatedAt: new Date()
              }
            });
          } else {
            // สร้าง payment_info ใหม่
            await prisma.paymentInfo.create({
              data: {
                orderId: order.id,
                paymentMethod: order.paymentMethod,
                transactionId,
                amount: parseFloat((charge.amount / 100).toFixed(2)),
                status: 'CONFIRMED',
                paymentDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
          
          console.log(`- อัพเดทสถานะการชำระเงินเป็น CONFIRMED สำเร็จ`);
        } else {
          console.log(`- สถานะการชำระเงินยังไม่สำเร็จ: ${charge.status}`);
        }
      } catch (error) {
        console.error(`- เกิดข้อผิดพลาดในการดึงข้อมูลจาก Omise:`, error.message);
      }
    }
    
    console.log('\n======= การตรวจสอบสถานะการชำระเงินเสร็จสิ้น =======');
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// เริ่มการทำงาน
fixPaymentStatus().catch(console.error); 