/**
 * Utility functions เกี่ยวกับวันที่และเวลา
 */

/**
 * สร้าง Date object ตาม timezone ของกรุงเทพฯ (UTC+7)
 * @returns Date object ในเวลาปัจจุบันของประเทศไทย
 */
export function getBangkokDateTime(): Date {
  // สร้าง date object ใหม่
  const now = new Date();
  
  // แปลงเป็น UTC string
  const utcStr = now.toUTCString();
  
  // สร้าง date object ใหม่จาก UTC และบวกเพิ่ม 7 ชั่วโมง
  const bangkokTime = new Date(new Date(utcStr).getTime() + (7 * 60 * 60 * 1000));
  
  return bangkokTime;
}

/**
 * แปลง Date object ธรรมดาให้เป็น Date object ในเวลากรุงเทพฯ (UTC+7)
 * @param date Date object ที่ต้องการแปลง
 * @returns Date object ที่ปรับเป็นเวลากรุงเทพฯแล้ว
 */
export function convertToBangkokTime(date: Date): Date {
  // ใช้หลักการเดียวกับ getBangkokDateTime
  const utcStr = date.toUTCString();
  return new Date(new Date(utcStr).getTime() + (7 * 60 * 60 * 1000));
}

/**
 * Format วันที่ในรูปแบบ YYYY-MM-DD
 * @param date Date object ที่ต้องการ format
 * @returns string ในรูปแบบ YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format วันที่ในรูปแบบ DD/MM/YYYY
 * @param date Date object ที่ต้องการ format
 * @returns string ในรูปแบบ DD/MM/YYYY
 */
export function formatDateToDDMMYYYY(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${day}/${month}/${year}`;
}

/**
 * Format วันที่และเวลาในรูปแบบ YYYY-MM-DD HH:mm:ss
 * @param date Date object ที่ต้องการ format
 * @returns string ในรูปแบบ YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
} 