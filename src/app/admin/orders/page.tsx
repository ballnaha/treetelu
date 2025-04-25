import AdminOrdersClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จัดการคำสั่งซื้อ | TreeTelu Admin',
  description: 'ระบบจัดการคำสั่งซื้อสำหรับผู้ดูแลระบบ TreeTelu',
};

export default function AdminOrdersPage() {
  return (
    <>
      <AdminOrdersClient />
    </>
  );
}
