# การปรับปรุงสถานะการชำระเงินให้สอดคล้องกัน

## ปัญหาที่พบ
- หน้า admin/payment-confirmation ใช้สถานะ 'APPROVED' แทน 'CONFIRMED'
- ไม่สอดคล้องกับ PaymentStatus enum ใน schema ที่มี PENDING, CONFIRMED, REJECTED
- การอัปเดตสถานะไม่ส่งผลต่อ order.paymentStatus

## การแก้ไขที่ทำ

### 1. client.tsx (หน้า admin/payment-confirmation)
- ✅ เปลี่ยน interface PaymentConfirmation ให้ใช้ 'PENDING' | 'CONFIRMED' | 'REJECTED'
- ✅ แก้ไข StatusChip function ให้แสดงสถานะที่ถูกต้อง
- ✅ เปลี่ยนข้อความจาก "อนุมัติแล้ว" เป็น "ยืนยันแล้ว"
- ✅ เปลี่ยนข้อความจาก "อนุมัติการชำระเงิน" เป็น "ยืนยันการชำระเงิน"
- ✅ แก้ไข handleApprove function ให้ส่ง status: 'CONFIRMED'

### 2. API Routes
- ✅ แก้ไข `/api/admin/payment-confirmation/route.ts` ให้ใช้ enum ที่ถูกต้อง
- ✅ สร้าง `/api/admin/payment-confirmation/[id]/route.ts` ใหม่
- ✅ เพิ่มการอัปเดต order.paymentStatus เมื่อ payment confirmation เป็น CONFIRMED
- ✅ เพิ่มการอัปเดต payment_info.status เมื่อ payment confirmation เป็น CONFIRMED

### 3. การเชื่อมโยงข้อมูล
- ✅ เมื่อ admin ยืนยันการชำระเงิน (CONFIRMED) ระบบจะ:
  - อัปเดต PaymentConfirmation.status = 'CONFIRMED'
  - อัปเดต Order.paymentStatus = 'CONFIRMED'
  - อัปเดต PaymentInfo.status = 'CONFIRMED'
  - ตั้งค่า PaymentInfo.paymentDate = วันที่ปัจจุบัน

## PaymentStatus Enum ที่ใช้
```prisma
enum PaymentStatus {
  PENDING    // รอการชำระเงิน/รอการยืนยัน
  CONFIRMED  // ยืนยันการชำระเงินแล้ว
  REJECTED   // ปฏิเสธการชำระเงิน
}
```

## การแสดงผลในหน้า Admin
- **PENDING**: สีเหลือง - "รอตรวจสอบ"
- **CONFIRMED**: สีเขียว - "ยืนยันแล้ว"
- **REJECTED**: สีแดง - "ปฏิเสธแล้ว"

## ผลลัพธ์
- ✅ สถานะการชำระเงินสอดคล้องกันทั้งระบบ
- ✅ การยืนยันการชำระเงินจะอัปเดตสถานะคำสั่งซื้อด้วย
- ✅ ข้อมูลในตาราง orders, payment_info, และ payment_confirmations เชื่อมโยงกัน
- ✅ UI แสดงสถานะที่ถูกต้องและสอดคล้องกัน