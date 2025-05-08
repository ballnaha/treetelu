"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper, CircularProgress, Fade } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HomeIcon from '@mui/icons-material/Home';

interface PaymentData {
  orderNumber: string;
  transactionId: string;
}

export default function OrderComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const initialLoadingRef = useRef(true);
  const maxRetries = 10; // จำนวนครั้งสูงสุดที่จะลองใหม่
  const retryInterval = 3000; // ทุก 3 วินาที

  // ปรับปรุงการทำงานของ useEffect ให้ทำงานเร็วขึ้น
  useEffect(() => {
    // กำหนดให้ component ถูก mount เรียบร้อยแล้ว
    setIsMounted(true);
    
    // แสดงข้อมูลการค้นหาทันทีที่โหลดหน้า
    const transactionId = searchParams.get('transactionId') || '';
    const source = searchParams.get('source') || '';
    console.log('Initial load params:', { transactionId, source });
    
    // เริ่มตรวจสอบข้อมูลการชำระเงินทันที
    if (transactionId && (source === 'cc' || source === 'credit_card' || source === 'pp' || source === 'promptpay')) {
      console.log('Starting payment check for transaction:', transactionId);
      checkPaymentData(transactionId);
    } else {
      console.log('Missing required parameters:', { transactionId, source });
      setError('ไม่พบข้อมูลการชำระเงิน กรุณาตรวจสอบพารามิเตอร์ที่ส่งมา');
      setLoading(false);
    }
    
    // กำหนดเวลาหมดเวลารอ (timeout) เป็น 30 วินาที
    const timeout = setTimeout(() => {
      if (loading && !paymentData) {
        console.log('Payment verification timeout - redirecting to home page');
        // ไม่ต้องแสดงข้อความ Error ให้เปลี่ยนเส้นทางไปยังหน้าหลักทันที
        window.location.href = '/';
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }, []);
  
  // แยกฟังก์ชันตรวจสอบข้อมูลการชำระเงินไปอยู่นอก useCallback เพื่อความเร็ว
  const checkPaymentData = async (transactionId: string) => {
    try {
      console.log(`Checking payment data for transaction: ${transactionId}`);
      
      // ตรวจสอบว่า transactionId มีค่าและมีรูปแบบเป็น chrg_test_ หรือไม่
      if (!transactionId || (transactionId === 'undefined')) {
        console.error('Invalid transaction ID:', transactionId);
        if (retryCount < maxRetries) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryInterval);
          return;
        } else {
          throw new Error('รหัสการชำระเงินไม่ถูกต้อง');
        }
      }
      
      // ตรวจสอบการเริ่มต้นของ transactionId ต้องขึ้นต้นด้วย chrg_
      if (!transactionId.startsWith('chrg_')) {
        console.warn('Transaction ID does not start with chrg_:', transactionId);
        // ไม่ต้องแสดงข้อผิดพลาด แต่ให้ log เอาไว้
      }
      
      const response = await fetch(`/api/orders/${transactionId}`);
      
      if (!response.ok) {
        console.error('API response error:', response.status, response.statusText);
        throw new Error('ไม่สามารถดึงข้อมูลการชำระเงินได้');
      }
      
      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        setPaymentData({
          orderNumber: data.orderNumber,
          transactionId: data.transactionId
        });
        setLoading(false);
      } else {
        // ถ้าไม่พบข้อมูลและยังไม่เกินจำนวนครั้งที่จะลองใหม่
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1}/${maxRetries} - waiting for order data to be available`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryInterval);
        } else {
          setError(data.message || 'ไม่พบข้อมูลคำสั่งซื้อ');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking payment:', err);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryInterval);
      } else {
        setError('เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน');
        setLoading(false);
      }
    }
  };

  const checkPayment = useCallback(async () => {
    try {
      const transactionId = searchParams.get('transactionId');
      const source = searchParams.get('source');
      console.log(`Payment check attempt ${retryCount + 1}/${maxRetries}:`, { transactionId, source });

      if (source === 'cc' || source === 'credit_card' || source === 'pp' || source === 'promptpay') {
        setLoading(true);
        
        // ถ้า transactionId เป็น undefined หรือค่าว่าง แสดงว่า webhook ยังไม่ได้อัพเดต
        if (!transactionId) {
          console.log('Transaction ID is undefined, waiting for webhook...');
          if (retryCount < maxRetries) {
            // ลองใหม่อีกครั้งหลังจากช่วงเวลาที่กำหนด
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, retryInterval);
        return;
          } else {
            throw new Error('ไม่สามารถรับข้อมูลการชำระเงินได้ในเวลาที่กำหนด');
          }
        }
        
        await checkPaymentData(transactionId);
      }
    } catch (err) {
      console.error('Error in checkPayment:', err);
      
      // ถ้ายังไม่เกินจำนวนครั้งที่จะลองใหม่
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryInterval);
      } else {
        setError('เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน');
        setLoading(false);
      }
    }
  }, [searchParams, retryCount, maxRetries]);

  useEffect(() => {
    // ทำการ retry เมื่อ retryCount เปลี่ยนแปลง
    if (isMounted && retryCount > 0) {
      checkPayment();
    }
  }, [isMounted, retryCount, checkPayment]);

  // แสดง skeleton ขณะรอ hydration
  if (!isMounted) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <CircularProgress size={60} thickness={4} />
        </Fade>
        <Typography variant="h6" sx={{ mt: 3 }}>
          กำลังเตรียมข้อมูล...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          กำลังตรวจสอบข้อมูลการชำระเงิน...
        </Typography>
        {retryCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            กรุณารอสักครู่ (พยายามตรวจสอบครั้งที่ {retryCount}/{maxRetries})
          </Typography>
        )}
        </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
              {error}
            </Typography>
              <Button 
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          กลับหน้าหลัก
              </Button>
            </Box>
    );
  }

  if (!paymentData) {
  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
              ไม่พบข้อมูลการชำระเงิน
            </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          ระบบไม่สามารถตรวจสอบข้อมูลการชำระเงินได้ในขณะนี้ แต่คำสั่งซื้อของคุณอาจถูกดำเนินการแล้ว
            </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          คุณสามารถตรวจสอบสถานะคำสั่งซื้อได้ในอีเมลที่ได้รับ หรือติดต่อเราโดยตรง
            </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          กลับหน้าหลัก
        </Button>
        </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%', textAlign: 'center' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          ชำระเงินสำเร็จ
              </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          ขอบคุณที่ใช้บริการ
              </Typography>
              
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
                    เลขที่คำสั่งซื้อ
                  </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            {paymentData.orderNumber}
              </Typography>
              
          <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
            เลขที่รายการ
              </Typography>
          <Typography variant="h6" color="text.secondary">
            {paymentData.transactionId}
                  </Typography>
            </Box>
                  
                  <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
          sx={{ mt: 4 }}
        >
          กลับหน้าหลัก
              </Button>
      </Paper>
      </Box>
  );
} 