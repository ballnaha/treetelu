import { Metadata } from 'next';
import LoginClient from './client';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Tree Telu',
  description: 'เข้าสู่ระบบเพื่อจัดการบัญชีและติดตามคำสั่งซื้อของคุณ',
};

// ป้องกัน cache สำหรับหน้า login
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function LoginPage() {
  return <LoginClient />;
}
