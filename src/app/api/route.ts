import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // ... existing code ...
    
    // ลบส่วนที่เกี่ยวข้องกับ Omise Payment
    // ถ้ามีการชำระเงินด้วยบัตรเครดิต/เดบิต (Omise)
    // if (validatedData.paymentMethod === 'CREDIT_CARD' && validatedData.omiseToken) {
    //   // โค้ดที่เกี่ยวข้องกับ Omise
    // }
    
    // ถ้าเป็นการชำระด้วย promptpay (Omise)
    // if (validatedData.paymentMethod === 'PROMPTPAY') {
    //   // โค้ดที่เกี่ยวข้องกับ Omise Promptpay
    // }
    
    // ส่วนที่เหลือของฟังก์ชัน (การชำระเงินด้วยวิธีอื่นๆ)
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
} 