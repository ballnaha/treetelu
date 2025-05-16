import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const DynamicPaymentConfirmationAdmin = dynamic(() => import('./client'), {
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
  title: 'จัดการการยืนยันการชำระเงิน | TreeTelu Admin',
  description: 'จัดการการยืนยันการชำระเงินของลูกค้า',
};

export default function PaymentConfirmationAdmin() {
  return <DynamicPaymentConfirmationAdmin />;
} 