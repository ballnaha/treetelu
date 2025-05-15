/**
 * Utility functions เกี่ยวกับวันที่และเวลา
 */
import { addHours } from 'date-fns';

/**
 * สร้าง Date object ตาม timezone ของกรุงเทพฯ (UTC+7)
 * ใช้ date-fns เพื่อความถูกต้องในการจัดการเวลา
 * @returns Date object ในเวลาปัจจุบันของประเทศไทย
 */
export function getBangkokDateTime(): Date {
  // ใช้ addHours จาก date-fns เพื่อบวกเวลา 7 ชั่วโมงจาก UTC
  return addHours(new Date(), 7);
}

/**
 * แปลง Date object ธรรมดาให้เป็น Date object ในเวลากรุงเทพฯ (UTC+7)
 * ใช้ date-fns เพื่อความถูกต้องในการจัดการเวลา
 * @param date Date object ที่ต้องการแปลง
 * @returns Date object ที่ปรับเป็นเวลากรุงเทพฯแล้ว
 */
export function convertToBangkokTime(date: Date): Date {
  // ใช้ addHours จาก date-fns เพื่อบวกเวลา 7 ชั่วโมงจาก UTC
  return addHours(date, 7);
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

/**
 * Format วันที่ในรูปแบบไทย เช่น 24 เมษายน 2568
 * @param date Date object ที่ต้องการ format
 * @returns string ในรูปแบบวันที่ไทย
 */
export function formatThaiDate(date: Date): string {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
  
  return `${day} ${month} ${year}`;
}