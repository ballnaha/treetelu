import { z } from 'zod';

// สคีมา Zod สำหรับตรวจสอบอีเมล
export const emailSchema = z.string()
  .email('รูปแบบอีเมลไม่ถูกต้อง')
  .min(5, 'อีเมลต้องมีความยาวอย่างน้อย 5 ตัวอักษร')
  .max(255, 'อีเมลต้องมีความยาวไม่เกิน 255 ตัวอักษร');

// สคีมา Zod สำหรับตรวจสอบเบอร์โทรศัพท์มือถือไทย (10 หลัก)
export const thaiPhoneSchema = z.string()
  .regex(/^0\d{9}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง ต้องเป็นเบอร์โทรศัพท์ไทยที่มี 10 หลัก เริ่มด้วย 0')
  .min(10, 'เบอร์โทรศัพท์ต้องมี 10 หลัก')
  .max(10, 'เบอร์โทรศัพท์ต้องมี 10 หลัก');

// สคีมา Zod สำหรับตรวจสอบเบอร์โทรศัพท์ทั่วไป (รองรับเบอร์บ้านและมือถือ)
export const generalPhoneSchema = z.string()
  .regex(/^(0\d{8,9})$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก');

// สคีมา Zod สำหรับรหัสไปรษณีย์ไทย (5 หลัก)
export const zipCodeSchema = z.string()
  .regex(/^\d{5}$/, 'รหัสไปรษณีย์ไม่ถูกต้อง ต้องเป็นตัวเลข 5 หลัก');

// ฟังก์ชันสำหรับตรวจสอบอีเมล
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' };
  }
};

// ฟังก์ชันสำหรับตรวจสอบเบอร์โทรศัพท์มือถือไทย
export const validateThaiPhone = (phone: string): { isValid: boolean; error?: string } => {
  try {
    thaiPhoneSchema.parse(phone);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทรศัพท์' };
  }
};

// ฟังก์ชันสำหรับตรวจสอบเบอร์โทรศัพท์ทั่วไป
export const validateGeneralPhone = (phone: string): { isValid: boolean; error?: string } => {
  try {
    generalPhoneSchema.parse(phone);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทรศัพท์' };
  }
};

// ฟังก์ชันสำหรับตรวจสอบรหัสไปรษณีย์
export const validateZipCode = (zipCode: string): { isValid: boolean; error?: string } => {
  try {
    zipCodeSchema.parse(zipCode);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสไปรษณีย์' };
  }
}; 