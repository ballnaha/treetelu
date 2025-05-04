import { Metadata } from 'next';
import ClientPage from './client';

export const metadata: Metadata = {
  title: 'โปรไฟล์ของฉัน | Tree Telu',
  description: 'จัดการโปรไฟล์และข้อมูลส่วนตัวของคุณที่ Tree Telu',
};

export default function ProfilePage() {
  return <ClientPage />;
} 