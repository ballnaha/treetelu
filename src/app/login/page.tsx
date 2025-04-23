import { Metadata } from 'next';
import LoginClient from './client';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Tree Telu',
  description: 'เข้าสู่ระบบเพื่อจัดการบัญชีและติดตามคำสั่งซื้อของคุณ',
};

export default function LoginPage() {
  return <LoginClient />;
}
