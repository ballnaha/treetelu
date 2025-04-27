import AdminDashboardClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'แดชบอร์ด | TreeTelu Admin',
  description: 'ระบบแดชบอร์ดสำหรับผู้ดูแลระบบ Tree Telu',
};

export default function AdminDashboardPage() {
  return (
    <>
      <AdminDashboardClient />
    </>
  );
} 