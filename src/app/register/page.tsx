import { Metadata } from 'next';
import RegisterClient from './client';

export const metadata: Metadata = {
  title: 'สมัครสมาชิก | TreeTelu ต้นไม้ในกระถาง',
  description: 'สมัครสมาชิกเพื่อรับสิทธิพิเศษและติดตามสถานะการสั่งซื้อ',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
