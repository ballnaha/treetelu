import AdminCategoriesClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จัดการหมวดหมู่สินค้า | TreeTelu Admin',
  description: 'ระบบจัดการหมวดหมู่สินค้าสำหรับผู้ดูแลระบบ Tree Telu',
};

export default function AdminCategoriesPage() {
  return (
    <>
      <AdminCategoriesClient />
    </>
  );
} 