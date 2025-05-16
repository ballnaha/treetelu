import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ยืนยันการชำระเงิน | TreeTelu',
  description: 'ยืนยันการชำระเงินสำหรับคำสั่งซื้อของคุณ',
  // เพิ่ม headers เพื่อป้องกันการ cache
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

export default function PaymentConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 