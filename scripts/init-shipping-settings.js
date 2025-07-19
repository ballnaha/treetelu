const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initShippingSettings() {
  try {
    console.log('Initializing shipping settings...');
    
    // ตรวจสอบว่ามีการตั้งค่าอยู่แล้วหรือไม่
    const existingSettings = await prisma.shippingSettings.findFirst({
      where: { isActive: true }
    });
    
    if (existingSettings) {
      console.log('Shipping settings already exist:', {
        freeShippingMinAmount: Number(existingSettings.freeShippingMinAmount),
        standardShippingCost: Number(existingSettings.standardShippingCost)
      });
      return;
    }
    
    // สร้างการตั้งค่าเริ่มต้น
    const defaultSettings = await prisma.shippingSettings.create({
      data: {
        freeShippingMinAmount: 1500.00,
        standardShippingCost: 100.00,
        isActive: true
      }
    });
    
    console.log('Default shipping settings created:', {
      id: defaultSettings.id,
      freeShippingMinAmount: Number(defaultSettings.freeShippingMinAmount),
      standardShippingCost: Number(defaultSettings.standardShippingCost)
    });
    
  } catch (error) {
    console.error('Error initializing shipping settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initShippingSettings();