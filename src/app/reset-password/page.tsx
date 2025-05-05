import { Metadata } from 'next';
import ResetPasswordClient from './client';

export const metadata: Metadata = {
  title: 'รีเซ็ตรหัสผ่าน | TreeTelu ทรีเตลู',
  description: 'รีเซ็ตรหัสผ่านของคุณเพื่อเข้าสู่ระบบ',
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
} 