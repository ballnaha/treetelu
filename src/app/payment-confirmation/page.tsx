import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// สร้าง Client Component สำหรับ dynamic imports
const DynamicPaymentConfirmation = dynamic(() => import('./dynamic-wrapper'), {
  loading: () => (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'white'
    }}>
      กำลังโหลด...
    </div>
  )
});

export const metadata: Metadata = {
  title: 'ยืนยันการชำระเงิน | TreeTelu',
  description: 'ยืนยันการชำระเงินสำหรับคำสั่งซื้อของคุณ',
  // เพิ่ม headers เพื่อป้องกันการ cache
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

export default function PaymentConfirmation() {
  return <DynamicPaymentConfirmation />;
} 