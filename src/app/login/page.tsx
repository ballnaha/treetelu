import { Metadata } from 'next';
import { headers } from 'next/headers';
import LoginClient from './client';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Tree Telu',
  description: 'เข้าสู่ระบบเพื่อจัดการบัญชีและติดตามคำสั่งซื้อของคุณ',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

// ป้องกัน cache สำหรับหน้า login
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LoginPage() {
  // เพิ่ม cache control headers
  const headersList = headers();
  
  // เพิ่ม timestamp เพื่อป้องกัน cache
  const timestamp = Date.now();
  
  return (
    <>
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      <meta name="timestamp" content={timestamp.toString()} />
      <LoginClient key={timestamp} />
    </>
  );
}
