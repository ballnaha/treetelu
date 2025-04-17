/**
 * จัดรูปแบบตัวเลขเป็นสกุลเงินไทย
 * @param amount จำนวนเงินที่ต้องการจัดรูปแบบ
 * @returns สตริงที่จัดรูปแบบแล้ว เช่น "1,234.56"
 */
export const formatThaiCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}; 