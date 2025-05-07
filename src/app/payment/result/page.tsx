import { Metadata } from 'next';
import PaymentResult from '../../../components/PaymentResult';
import { Container } from '@mui/material';

export const metadata: Metadata = {
  title: 'ผลการชำระเงิน | TreeTelu',
  description: 'ตรวจสอบผลการชำระเงินของคุณ',
};

export default function PaymentResultPage() {
  return (
    <Container>
      <PaymentResult />
    </Container>
  );
} 