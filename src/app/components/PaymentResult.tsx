'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, Typography, Box, CircularProgress, Alert } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface PaymentResultData {
  success: boolean;
  message: string;
  orderNumber?: string;
  amount?: string;
  paymentMethod?: string;
  paymentDate?: string;
  card?: {
    last_digits: string;
    brand: string;
  };
  status?: string;
  timestamp?: string;
}

export default function PaymentResult() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResultData | null>(null);

  useEffect(() => {
    const fetchPaymentResult = async () => {
      try {
        const chargeId = searchParams.get('charge_id');
        const orderId = searchParams.get('order_id');

        if (!chargeId && !orderId) {
          setError('ไม่พบข้อมูลการชำระเงิน');
          setLoading(false);
          return;
        }

        const queryParams = new URLSearchParams();
        if (chargeId) queryParams.append('charge_id', chargeId);
        if (orderId) queryParams.append('order_id', orderId);

        queryParams.append('_t', Date.now().toString());

        const response = await fetch(`/api/payment/verify?${queryParams.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถตรวจสอบสถานะการชำระเงินได้');
        }

        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
          throw new Error('ข้อมูลการชำระเงินไม่ถูกต้อง');
        }

        setPaymentData(data);
      } catch (err) {
        console.error('Error fetching payment result:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentResult();
  }, [searchParams]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <ErrorIcon sx={{ mr: 1 }} />
        {error}
      </Alert>
    );
  }

  if (!paymentData) {
    return (
      <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        ไม่พบข้อมูลการชำระเงิน
      </Alert>
    );
  }

  const isSuccessful = paymentData.status === 'successful';

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, boxShadow: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          {isSuccessful ? (
            <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
          )}
          <Typography variant="h5" component="div" color={isSuccessful ? 'success.main' : 'error.main'}>
            {paymentData.message}
          </Typography>
        </Box>

        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>เลขที่คำสั่งซื้อ:</strong> {paymentData.orderNumber}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>จำนวนเงิน:</strong> {paymentData.amount} บาท
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>วิธีการชำระเงิน:</strong> {paymentData.paymentMethod}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>วันที่และเวลาที่ชำระเงิน:</strong> {paymentData.paymentDate}
          </Typography>

          {paymentData.card && (
            <Box display="flex" alignItems="center" mt={1}>
              <CreditCardIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                {paymentData.card.brand} **** **** **** {paymentData.card.last_digits}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" align="center">
          หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่
          <br />
          อีเมล: support@treetelu.com | โทร: 02-XXX-XXXX
        </Typography>
      </CardContent>
    </Card>
  );
} 