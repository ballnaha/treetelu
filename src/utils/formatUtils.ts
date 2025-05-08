/**
 * ฟังก์ชันสำหรับจัดรูปแบบเงิน
 * @param amount จำนวนเงิน
 * @param minimumFractionDigits จำนวนทศนิยมขั้นต่ำ (ค่าเริ่มต้น: 2)
 * @param maximumFractionDigits จำนวนทศนิยมสูงสุด (ค่าเริ่มต้น: 2)
 * @returns สตริงที่มีรูปแบบสกุลเงิน เช่น 1,234.56
 */
export function formatCurrency(
  amount: number,
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2
): string {
  if (isNaN(amount)) return '0.00';
  
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * ฟังก์ชันสำหรับจัดรูปแบบวันที่
 * @param dateString สตริงวันที่หรือ Date object
 * @param options ตัวเลือกการจัดรูปแบบ
 * @returns สตริงที่มีรูปแบบวันที่เวลา เช่น 1 ม.ค. 2566, 15:30 น.
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  }
): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('th-TH', options).format(date);
}

/**
 * ฟังก์ชันสำหรับจัดรูปแบบวันที่แบบสั้น
 * @param dateString สตริงวันที่หรือ Date object
 * @returns สตริงที่มีรูปแบบวันที่แบบสั้น เช่น 1 ม.ค. 2566
 */
export function formatShortDate(dateString: string | Date): string {
  return formatDate(dateString, { dateStyle: 'medium' });
}

/**
 * ฟังก์ชันสำหรับจัดรูปแบบเวลา
 * @param dateString สตริงวันที่หรือ Date object
 * @returns สตริงที่มีรูปแบบเวลา เช่น 15:30 น.
 */
export function formatTime(dateString: string | Date): string {
  return formatDate(dateString, { timeStyle: 'short' });
} 