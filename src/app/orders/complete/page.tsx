"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Link from 'next/link';

export default function OrderComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Omise จะเพิ่ม query parameters เช่น order_id, amount ในการ redirect กลับมา
    const omiseOrderId = searchParams.get('order_id');
    const omiseChargeId = searchParams.get('charge_id');
    
    // ถ้าไม่มีข้อมูลจาก Omise ให้ redirect กลับไปหน้าหลัก
    if (!omiseChargeId) {
      router.push('/');
      return;
    }

    // ตรวจสอบสถานะการชำระเงินจาก API
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?charge_id=${omiseChargeId}`, {
          method: 'GET',
        });

        const result = await response.json();
        
        if (result.success) {
          setStatus('success');
          setOrderNumber(result.orderNumber || omiseOrderId);
        } else {
          setStatus('error');
          setErrorMessage(result.message || 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', borderRadius: 2 }}>
        {status === 'loading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CircularProgress size={60} />
            <Typography variant="h5">กำลังตรวจสอบการชำระเงิน</Typography>
            <Typography variant="body1" color="text.secondary">
              โปรดรอสักครู่ กำลังยืนยันการชำระเงินของคุณ...
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h4">การชำระเงินสำเร็จ!</Typography>
            <Typography variant="body1" color="text.secondary">
              ขอบคุณสำหรับการสั่งซื้อ เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว
            </Typography>
            
            {orderNumber && (
              <Alert severity="success" sx={{ mt: 2, mb: 3 }}>
                <Typography variant="body1">
                  เลขที่คำสั่งซื้อของคุณคือ: <strong>{orderNumber}</strong>
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                component={Link}
                href="/order-history"
              >
                ดูประวัติการสั่งซื้อ
              </Button>
              <Button
                variant="contained"
                component={Link}
                href="/"
              >
                กลับไปยังหน้าหลัก
              </Button>
            </Box>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
            <Typography variant="h4">เกิดข้อผิดพลาด</Typography>
            <Typography variant="body1" color="text.secondary">
              {errorMessage || 'เกิดข้อผิดพลาดในการชำระเงิน กรุณาติดต่อเจ้าหน้าที่'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                component={Link}
                href="/checkout"
              >
                กลับไปชำระเงินอีกครั้ง
              </Button>
              <Button
                variant="contained"
                component={Link}
                href="/"
              >
                กลับไปยังหน้าหลัก
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 