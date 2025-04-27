import { Metadata } from 'next';
import { Suspense } from 'react';
import UsersClient from './client';

export const metadata: Metadata = {
  title: 'จัดการผู้ใช้งาน - Tree Telu Admin',
  description: 'จัดการข้อมูลผู้ใช้งานทั้งหมดของระบบ Tree Telu',
};

export default function UsersPage() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <UsersClient />
    </Suspense>
  );
} 