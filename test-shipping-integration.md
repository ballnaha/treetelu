# การทดสอบการรวม ShippingSettings กับ Cart และ Checkout

## สิ่งที่ได้อัปเดตเรียบร้อยแล้ว ✅

### 1. Cart.tsx
- เพิ่มการใช้ `useShippingSettings` hook
- แทนที่ค่า hardcode 1500 บาทด้วยค่าจาก `settings.freeShippingMinAmount`
- แทนที่ค่า hardcode 100 บาทด้วยค่าจาก `settings.standardShippingCost`
- ใช้ฟังก์ชัน `isEligibleForFreeShipping()` และ `getAmountNeededForFreeShipping()`

### 2. CartContext.tsx
- เพิ่มการใช้ `useShippingSettings` hook
- เพิ่มฟังก์ชัน `getShippingCost()`, `isEligibleForFreeShipping()`, `getAmountNeededForFreeShipping()`
- ทำให้ CartContext สามารถคำนวณค่าจัดส่งตามการตั้งค่าจากฐานข้อมูลได้

### 3. layout.tsx
- แก้ไขการ import ให้ถูกต้อง
- เพิ่มการ import `useCart`, `CartButton`, และ `Cart`

### 4. checkout/page.tsx ✅ (แก้ไขเสร็จสิ้นแล้ว)
- ใช้ฟังก์ชันจาก CartContext แทนการคำนวณค่าจัดส่งเอง
- แทนที่ค่า hardcode ทั้งหมดด้วยฟังก์ชันจาก useShippingSettings
- แสดงข้อมูลค่าจัดส่งแบบ dynamic ตามการตั้งค่าจากฐานข้อมูล
- ใช้ `isEligibleForFreeShipping()` และ `getAmountNeededForFreeShipping()` ในการแสดง Alert
- ลบข้อความ hardcode "(ซื้อครบ 1,500 บาท รับสิทธิ์จัดส่งฟรี)" ออกแล้ว
- แสดงข้อมูลค่าจัดส่งและเกณฑ์ฟรีค่าจัดส่งจาก shippingSettings

## การทดสอบที่ควรทำ

### 1. ทดสอบ Cart Component
- เปิดตะกร้าสินค้าและตรวจสอบว่าข้อความแสดงยอดขั้นต่ำสำหรับฟรีค่าจัดส่งถูกต้อง
- ทดสอบกับยอดต่ำกว่าและสูงกว่าเกณฑ์ฟรีค่าจัดส่ง
- ตรวจสอบว่าค่าจัดส่งแสดงถูกต้อง

### 2. ทดสอบ Checkout Page ✅
- ตรวจสอบการคำนวณค่าจัดส่งในหน้า checkout
- ทดสอบกับยอดสั่งซื้อต่างๆ
- ตรวจสอบข้อความแจ้งเตือนเกี่ยวกับฟรีค่าจัดส่ง
- ตรวจสอบการแสดงข้อมูลค่าจัดส่งในส่วนสรุปคำสั่งซื้อ

### 3. ทดสอบ Admin Panel
- เปลี่ยนค่าการตั้งค่าจัดส่งใน admin panel
- ตรวจสอบว่าการเปลี่ยนแปลงมีผลกับ cart และ checkout ทันที

## สรุปการอัปเดต
✅ **เสร็จสิ้นแล้ว**: ระบบตะกร้าสินค้าและหน้า checkout ใช้ข้อมูลจาก ShippingSettings model แทนค่า hardcode แล้วทั้งหมด
✅ **ผลลัพธ์**: ผู้ดูแลระบบสามารถปรับค่าจัดส่งและเกณฑ์ฟรีค่าจัดส่งได้จาก admin panel และจะมีผลทันทีกับ cart และ checkout

## ข้อมูล ShippingSettings Model
```prisma
model ShippingSettings {
  id                    Int      @id @default(autoincrement())
  freeShippingMinAmount Decimal  @default(1500.00) @db.Decimal(10, 2) // ยอดขั้นต่ำสำหรับฟรีค่าจัดส่ง
  standardShippingCost  Decimal  @default(100.00) @db.Decimal(10, 2)  // ค่าจัดส่งมาตรฐาน
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now()) @db.DateTime(0)
  updatedAt             DateTime @updatedAt @db.DateTime(0)
  createdBy             Int?     @db.UnsignedInt
  updatedBy             Int?     @db.UnsignedInt

  @@map("shipping_settings")
}
```

## API Endpoints ที่เกี่ยวข้อง
- `GET /api/admin/shipping-settings` - ดึงข้อมูลการตั้งค่าจัดส่ง
- `POST /api/admin/shipping-settings` - อัปเดตการตั้งค่าจัดส่ง

## ฟังก์ชันใน useShippingSettings Hook
- `calculateShippingCost(subtotal)` - คำนวณค่าจัดส่งตามยอดสั่งซื้อ
- `isEligibleForFreeShipping(subtotal)` - ตรวจสอบว่าได้รับฟรีค่าจัดส่งหรือไม่
- `getAmountNeededForFreeShipping(subtotal)` - คำนวณยอดที่ต้องซื้อเพิ่มเพื่อได้ฟรีค่าจัดส่ง