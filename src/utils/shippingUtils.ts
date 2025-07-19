import prisma from '@/lib/prisma';

export interface ShippingSettings {
  freeShippingMinAmount: number;
  standardShippingCost: number;
}

/**
 * ดึงการตั้งค่าค่าจัดส่งจากฐานข้อมูล
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const settings = await prisma.shippingSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (settings) {
      return {
        freeShippingMinAmount: Number(settings.freeShippingMinAmount),
        standardShippingCost: Number(settings.standardShippingCost)
      };
    }

    // ค่าเริ่มต้นหากไม่พบการตั้งค่า
    return {
      freeShippingMinAmount: 1500,
      standardShippingCost: 100
    };
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    // ค่าเริ่มต้นในกรณีเกิดข้อผิดพลาด
    return {
      freeShippingMinAmount: 1500,
      standardShippingCost: 100
    };
  }
}

/**
 * คำนวณค่าจัดส่งตามยอดสั่งซื้อ
 */
export async function calculateShippingCost(subtotal: number): Promise<number> {
  const settings = await getShippingSettings();
  return subtotal >= settings.freeShippingMinAmount ? 0 : settings.standardShippingCost;
}

/**
 * ตรวจสอบว่าได้รับฟรีค่าจัดส่งหรือไม่
 */
export async function isEligibleForFreeShipping(subtotal: number): Promise<boolean> {
  const settings = await getShippingSettings();
  return subtotal >= settings.freeShippingMinAmount;
}