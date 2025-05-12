This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# การปรับปรุงระบบชำระเงิน TreeTelu

## การเปลี่ยนแปลงจาก Omise ไปเป็น Stripe

### การเปลี่ยนแปลงในฐานข้อมูล
- เพิ่ม field `stripeSessionId` ในตาราง `Order` เพื่อเก็บรหัส session ของ Stripe
- ปรับปรุงตาราง `pending_payments` เพื่อรองรับการจัดการการชำระเงินจาก Stripe

### การเปลี่ยนแปลงในฝั่ง Frontend (checkout/page.tsx)
- ลบโค้ดที่เกี่ยวข้องกับ Omise ทั้งหมด
- เพิ่มการโหลดไลบรารี Stripe ด้วย `loadStripe` จาก `@stripe/stripe-js`
- เปลี่ยน function `handleOmisePayment` เป็น `handleStripePayment`
- เพิ่ม animation loading ระหว่างรอการ redirect ไปหน้า Stripe
- แก้ไขปัญหา hydration error โดยใช้ dynamic import และ state `isClient`

### การเปลี่ยนแปลงในฝั่ง Backend
- สร้าง API routes สำหรับ Stripe checkout ที่ `/api/stripe/checkout/route.ts`
- สร้าง API routes สำหรับ Stripe webhook ที่ `/api/stripe/webhook/route.ts`
- ปรับปรุงรูปแบบการสร้าง `orderNumber` ให้เป็น `yymm001` (เช่น 2505001)
- แก้ไขปัญหา "Order not found" และ "Unique constraint failed" ในระบบ webhook

### การตั้งค่า Environment Variables
- กำหนดค่า `STRIPE_SECRET_KEY` และ `STRIPE_WEBHOOK_SECRET` ในไฟล์ `.env`
- กำหนดค่า `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` สำหรับใช้งานในฝั่ง Frontend

### ระบบ Webhook
- ปรับปรุงการจัดการ webhook events จาก Stripe (`checkout.session.completed` และ `payment_intent.succeeded`)
- เพิ่มการจัดการกรณีไม่พบข้อมูล order ในระบบด้วยการสร้าง pending payment

### อื่นๆ
- แก้ไขปัญหา "ไม่สามารถสร้างเลขที่คำสั่งซื้อได้" โดยปรับปรุงโค้ดการสร้าง Order
- เพิ่มการล้างตะกร้าสินค้าหลังจากสร้าง order สำเร็จ
