import AdminOrdersClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จัดการคำสั่งซื้อ | Tree Telu Admin',
  description: 'ระบบจัดการคำสั่งซื้อสำหรับผู้ดูแลระบบ Tree Telu',
};

export default function AdminOrdersPage() {
  return (
    <>
      <AdminOrdersClient />
    </>
  );
}
