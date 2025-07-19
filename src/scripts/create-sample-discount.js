const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleDiscountCodes() {
  try {
    // สร้าง discount code ตัวอย่าง
    const discountCodes = [
      {
        code: 'SAVE10',
        type: 'percentage',
        value: 10.00,
        minAmount: 500.00,
        maxDiscount: 200.00,
        description: 'ส่วนลด 10% สูงสุด 200 บาท (ขั้นต่ำ 500 บาท)',
        maxUses: 100,
        status: 'active'
      },
      {
        code: 'SAVE50',
        type: 'fixed',
        value: 50.00,
        minAmount: 300.00,
        description: 'ส่วนลด 50 บาท (ขั้นต่ำ 300 บาท)',
        maxUses: 50,
        status: 'active'
      },
      {
        code: 'FREESHIP',
        type: 'fixed',
        value: 100.00,
        minAmount: 1000.00,
        description: 'ฟรีค่าจัดส่ง (ขั้นต่ำ 1,000 บาท)',
        maxUses: 200,
        status: 'active'
      }
    ];

    for (const discountData of discountCodes) {
      // ตรวจสอบว่ามีรหัสนี้อยู่แล้วหรือไม่
      const existing = await prisma.discountCode.findFirst({
        where: { code: discountData.code }
      });

      if (!existing) {
        await prisma.discountCode.create({
          data: discountData
        });
        console.log(`✅ สร้างรหัสส่วนลด ${discountData.code} เรียบร้อย`);
      } else {
        console.log(`⚠️  รหัสส่วนลด ${discountData.code} มีอยู่แล้ว`);
      }
    }

    console.log('\n🎉 สร้างรหัสส่วนลดตัวอย่างเสร็จสิ้น!');
    console.log('\nรหัสส่วนลดที่สามารถทดสอบได้:');
    console.log('- SAVE10: ส่วนลด 10% สูงสุด 200 บาท (ขั้นต่ำ 500 บาท)');
    console.log('- SAVE50: ส่วนลด 50 บาท (ขั้นต่ำ 300 บาท)');
    console.log('- FREESHIP: ฟรีค่าจัดส่ง 100 บาท (ขั้นต่ำ 1,000 บาท)');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleDiscountCodes();