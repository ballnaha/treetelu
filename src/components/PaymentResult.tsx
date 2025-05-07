'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

export default function PaymentResult() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // ดึงค่า parameter จากหลายแหล่งที่เป็นไปได้
    // Omise อาจส่งกลับมาได้หลายรูปแบบ:
    // - charge_id: กรณีชำระเงินสำเร็จและ redirect กลับมา
    // - id: กรณีที่ใช้ webhook หรือบางครั้งก็ใช้ชื่อนี้
    // - token: กรณีที่เป็น token สำหรับการชำระเงิน
    // - orderId: กรณีที่ส่งมาจากระบบภายใน
    const chargeId = searchParams.get('charge_id') || 
                     searchParams.get('id') || 
                     searchParams.get('token') || 
                     searchParams.get('orderId');
    
    // ยืนยันว่ามีอย่างน้อยหนึ่งพารามิเตอร์มา
    if (!chargeId) {
      // ลองตรวจสอบหากมีการส่ง order_id มาแทน
      const orderId = searchParams.get('order_id');
      if (orderId) {
        // ใช้ order_id ในการตรวจสอบสถานะการชำระเงิน
        verifyPaymentByOrderId(orderId);
        return;
      }
      
      setLoading(false);
      setError('ไม่พบข้อมูลการชำระเงิน');
      return;
    }

    // ตรวจสอบสถานะการชำระเงินโดยใช้ charge_id
    verifyPaymentByChargeId(chargeId);
  }, [searchParams, clearCart]);
  
  // ฟังก์ชันตรวจสอบการชำระเงินโดยใช้ charge_id
  const verifyPaymentByChargeId = async (chargeId: string) => {
    try {
      console.log('Verifying payment using charge_id:', chargeId);
      
      // เพิ่มพารามิเตอร์เพื่อป้องกัน caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/payment/verify?charge_id=${chargeId}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Payment verification response:', data);
      
      setPaymentData(data);
      
      if (data.success && data.status === 'successful') {
        // ล้างตะกร้าสินค้าเมื่อชำระเงินสำเร็จ
        clearCart();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error verifying payment with charge_id:', error);
      setError('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน');
      setLoading(false);
    }
  };
  
  // ฟังก์ชันตรวจสอบการชำระเงินโดยใช้ order_id
  const verifyPaymentByOrderId = async (orderId: string) => {
    try {
      console.log('Verifying payment using order_id:', orderId);
      
      // เพิ่มพารามิเตอร์เพื่อป้องกัน caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/orders/${orderId}/payment-status?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Order payment status response:', data);
      
      setPaymentData(data);
      
      if (data.success && data.paymentStatus === 'CONFIRMED') {
        // ล้างตะกร้าสินค้าเมื่อชำระเงินสำเร็จ
        clearCart();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error verifying payment with order_id:', error);
      setError('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน');
      setLoading(false);
    }
  };

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

  // ตรวจสอบสถานะการชำระเงินจากข้อมูลที่ได้รับ
  // ข้อมูลอาจมาจากหลายแหล่ง (API payment/verify หรือ orders/{id}/payment-status)
  const isSuccessful = 
    paymentData.status === 'successful' || 
    paymentData.paymentStatus === 'CONFIRMED';

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
            {paymentData.message || (isSuccessful ? 'การชำระเงินสำเร็จ' : 'การชำระเงินไม่สำเร็จ')}
          </Typography>
        </Box>

        {isSuccessful && (
          <>
            <Box textAlign="center" my={3}>
              <Typography variant="body1" gutterBottom>
                <strong>ขอบคุณสำหรับการสั่งซื้อ</strong>
              </Typography>
              
              {(paymentData.orderNumber || paymentData.order?.orderNumber) && (
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  เลขที่คำสั่งซื้อ: <strong>{paymentData.orderNumber || paymentData.order?.orderNumber}</strong>
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                เราได้ส่งอีเมลยืนยันการสั่งซื้อไปยังอีเมลของคุณแล้ว
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                เราจะดำเนินการจัดส่งสินค้าให้คุณโดยเร็วที่สุด
              </Typography>
            </Box>
            
            <Box textAlign="center" mt={4}>
              <Button
                variant="contained"
                component={Link}
                href="/"
                sx={{ minWidth: 200 }}
              >
                กลับไปยังหน้าหลัก
              </Button>
            </Box>
          </>
        )}
        
        {!isSuccessful && (
          <>
            <Typography variant="body1" color="text.secondary" paragraph>
              {paymentData.message || 'กรุณาตรวจสอบข้อมูลการชำระเงินและลองใหม่อีกครั้ง'}
            </Typography>
            
            <Box textAlign="center" mt={4}>
              <Button
                variant="contained"
                component={Link}
                href="/checkout"
                color="primary"
                sx={{ mr: 2 }}
              >
                กลับไปยังหน้าชำระเงิน
              </Button>
              
              <Button
                variant="outlined"
                component={Link}
                href="/"
              >
                กลับไปยังหน้าหลัก
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
} 