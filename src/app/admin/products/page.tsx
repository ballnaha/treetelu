import AdminProductsClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จัดการสินค้า | TreeTelu Admin',
  description: 'ระบบจัดการสินค้าสำหรับผู้ดูแลระบบ Tree Telu',
};

export default function AdminProductsPage() {
  return (
    <>
      <AdminProductsClient />
    </>
  );
}
