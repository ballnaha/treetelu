-- ตรวจสอบสถานะการชำระเงินในตาราง orders
SELECT id, orderNumber, paymentStatus, paymentMethod, createdAt, updatedAt
FROM orders
WHERE paymentMethod IN ('CREDIT_CARD', 'PROMPTPAY')
ORDER BY id DESC
LIMIT 10;

-- ตรวจสอบข้อมูลในตาราง payment_info
SELECT * FROM payment_info
ORDER BY id DESC
LIMIT 10;

-- อัพเดทสถานะการชำระเงินสำหรับบัตรเครดิตที่ยังค้างอยู่ (ต้องรันตรวจสอบความถูกต้องก่อนเท่านั้น)
-- UPDATE orders SET paymentStatus = 'CONFIRMED' WHERE id = [order_id] AND paymentMethod = 'CREDIT_CARD' AND paymentStatus = 'PENDING'; 