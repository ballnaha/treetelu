# การปรับปรุงระบบส่วนลดสินค้า

## การเพิ่มส่วนลดในการสั่งซื้อ

เราได้เพิ่มระบบส่วนลดเข้าไปในหน้า checkout แล้ว โดยมีการเพิ่มฟีเจอร์ดังนี้:

1. ช่องกรอกรหัสส่วนลดในหน้า checkout
2. API สำหรับตรวจสอบรหัสส่วนลด
3. การคำนวณราคาที่รวมส่วนลด

## การปรับปรุง API Orders (route.ts)

ในไฟล์ `src/app/api/orders/route.ts` คุณต้องแก้ไขดังนี้:

### 1. ตรวจสอบและรับค่าส่วนลดจาก Request Body

```typescript
// แก้ไขในฟังก์ชัน POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // รับค่าข้อมูลการชำระเงิน รวมถึงส่วนลด
    const { payment } = body;
    const { method, subtotal, shippingCost, discount = 0, discountCode = null, total } = payment;
    
    // คำนวณยอดรวมอีกครั้งเพื่อความปลอดภัย
    const calculatedTotal = subtotal + shippingCost - discount;
    
    // ตรวจสอบว่ายอดรวมถูกต้อง
    if (calculatedTotal !== total) {
      return NextResponse.json({
        success: false,
        message: 'จำนวนเงินไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
      }, { status: 400 });
    }
    
    // สร้าง Order
    // ...
  } catch (error) {
    // ...
  }
}
```

### 2. เพิ่มข้อมูลส่วนลดในการสร้าง Order

```typescript
const order = await prisma.orders.create({
  data: {
    orderNumber,
    userId: userId || null,
    status: 'pending',
    totalAmount: subtotal,
    shippingCost,
    discount, // เพิ่มส่วนลด
    discountCode, // เพิ่มรหัสส่วนลด
    finalAmount: total,
    paymentMethod: method,
    paymentStatus: 'pending',
    // อื่นๆ...
  }
});
```

## การแก้ไขฐานข้อมูล (prisma/schema.prisma)

ตรวจสอบว่ามีฟิลด์ต่อไปนี้ในโมเดล Orders:

```prisma
model Orders {
  id            Int      @id @default(autoincrement())
  orderNumber   String   @unique
  // ...ฟิลด์อื่นๆ
  totalAmount   Decimal  @default(0.00) @db.Decimal(10, 2)
  shippingCost  Decimal  @default(0.00) @db.Decimal(10, 2)
  discount      Decimal  @default(0.00) @db.Decimal(10, 2) // ส่วนลด
  discountCode  String?  // รหัสส่วนลดที่ใช้
  finalAmount   Decimal  @default(0.00) @db.Decimal(10, 2) // ยอดรวมหลังหักส่วนลด
  // ...ฟิลด์อื่นๆ
}
```

ถ้ายังไม่มีฟิลด์เหล่านี้ คุณต้องทำการ migration ฐานข้อมูลด้วย:

```bash
npx prisma migrate dev --name add_discount_fields
```

## การแสดงส่วนลดในหน้าประวัติการสั่งซื้อ

ในหน้าแสดงประวัติการสั่งซื้อและรายละเอียดคำสั่งซื้อ ให้เพิ่มการแสดงข้อมูลส่วนลดด้วย:

```tsx
{order.discount > 0 && (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
    <Typography variant="body2">
      ส่วนลด {order.discountCode && `(${order.discountCode})`}
    </Typography>
    <Typography variant="body2" color="error.main">
      -฿{(order.discount || 0).toLocaleString()}
    </Typography>
  </Box>
)} 