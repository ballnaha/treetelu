# วิธีการแก้ไขปัญหา Dashboard

## ปัญหา
1. มีการกรองข้อมูลซ้ำซ้อนในไฟล์ src/app/admin/dashboard/client.tsx
2. มีโค้ดเกี่ยวกับการกรองสินค้าขายดีที่ซ้ำกันในช่วงท้ายของ useEffect
3. การแสดงข้อมูลสถานะคำสั่งซื้อไม่ถูกต้องเมื่อกรองตามเดือน

## วิธีแก้ไข

1. ตัดการทำงานซ้ำใน useEffect ในช่วงบรรทัดที่ 1000-1060 โดยประมาณ คือส่วนที่ซ้ำอยู่ตอนท้ายของ useEffect (ตรง // ตรวจสอบข้อมูล stats ก่อนการกรอง และส่วนที่เกี่ยวกับการกรองสินค้าขายดี)

2. ปรับแก้ useEffect ให้รับข้อมูลจาก API โดยตรงและไม่ต้องกรองข้อมูลซ้ำอีก เนื่องจากเราได้เรียก API เพื่อกรองข้อมูลแล้ว

3. ตรวจสอบว่าในฟังก์ชัน handleMonthChange และ handleYearChange มีการเรียกใช้ fetchDashboardDataWithFilters เมื่อมีการเปลี่ยนปีหรือเดือน เพื่อดึงข้อมูลจาก API ใหม่

## ตัวอย่างโค้ดแก้ไข useEffect

```typescript
  // กรอง allYearOrders ให้ใช้ฟังก์ชัน getOrderDate
  useEffect(() => {
    if (!stats) return;
    
    // ข้อมูล debugging
    console.log('Current filter:', { selectedYear, selectedMonth });
    console.log('Stats received from API:', stats);
    
    // สร้างข้อมูลสถิติที่ได้รับจาก API
    const salesByMonth = getFilteredSalesData();
    
    // สร้าง filtered stats จากข้อมูล API
    const filteredStatsData: DashboardStats = {
      ...stats,
      salesByMonth: salesByMonth
    };
    
    setFilteredStats(filteredStatsData);
    
    // อัปเดตข้อมูลกราฟเท่านั้น ไม่มีการกรองข้อมูลเพิ่มเติม
    if (salesByMonth.length > 0) {
      setChartData(prepareSalesChartData(salesByMonth, showUnit));
    }
    
    if (filteredStatsData.topSellingProducts && filteredStatsData.topSellingProducts.length > 0) {
      setProductChartData(prepareTopProductsChartData(filteredStatsData.topSellingProducts));
    }
    
  }, [stats, selectedYear, selectedMonth, showUnit]);
```

## สิ่งที่ต้องแน่ใจว่าทำงานถูกต้อง

1. ตรวจสอบว่า API `fetchDashboardDataWithFilters` รับพารามิเตอร์ year และ month ไปกรองข้อมูลที่ฐานข้อมูลถูกต้อง

2. ใน API route.ts ต้องมีการกรองข้อมูลตาม year และ month ที่ได้รับมาอย่างถูกต้อง

3. ตรวจสอบว่าเมื่อกรองเดือนเมษายน 2025 มีคำสั่งซื้อ 4 รายการ แบ่งเป็น PENDING 2 รายการ, DELIVERED 1 รายการ, CANCELLED 1 รายการ ตามที่มีในฐานข้อมูล 