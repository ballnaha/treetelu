import { Metadata } from 'next';
import CallbackClient from './client';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Tree Telu',
  description: 'กำลังเข้าสู่ระบบ...',
};

export default function LoginCallbackPage() {
  return <CallbackClient />;
} 