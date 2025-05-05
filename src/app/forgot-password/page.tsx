import { Metadata } from 'next';
import ForgotPasswordClient from './client';

export const metadata: Metadata = {
  title: 'ลืมรหัสผ่าน | TreeTelu ทรีเตลู',
  description: 'ขอรีเซ็ตรหัสผ่านเพื่อเข้าสู่ระบบ',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
} 