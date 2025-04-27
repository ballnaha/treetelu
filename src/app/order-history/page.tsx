import { Metadata } from 'next';
import OrderHistoryClient from './client';

export const metadata: Metadata = {
  title: 'ประวัติการสั่งซื้อ | TreeTelu',
  description: 'ดูประวัติการสั่งซื้อสินค้าของคุณจาก TreeTelu',
};

export default function OrderHistoryPage() {
  return <OrderHistoryClient />;
} 