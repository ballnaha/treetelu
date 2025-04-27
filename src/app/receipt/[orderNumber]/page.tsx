import { Metadata } from 'next';
import { Suspense } from 'react';
import ReceiptClient from './client';

export const metadata: Metadata = {
  title: 'ใบเสร็จรับเงิน',
  description: 'ใบเสร็จรับเงินการสั่งซื้อสินค้าจาก Tree Telu',
};

export default function ReceiptPage({ params }: { params: { orderNumber: string } }) {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <ReceiptClient orderNumber={params.orderNumber} />
    </Suspense>
  );
} 