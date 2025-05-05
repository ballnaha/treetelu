-- คำสั่ง SQL สำหรับนับจำนวนคำสั่งซื้อในเดือนเมษายน
SELECT 
  COUNT(*) as total_orders, 
  MONTH(createdAt) as month 
FROM orders 
WHERE MONTH(createdAt) = 4 
GROUP BY MONTH(createdAt);

-- แสดงรายละเอียดคำสั่งซื้อในเดือนเมษายน
SELECT 
  id, 
  orderNumber, 
  status, 
  paymentStatus, 
  createdAt 
FROM orders 
WHERE MONTH(createdAt) = 4 
ORDER BY createdAt DESC; 