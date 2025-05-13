'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useCart } from '@/context/CartContext';

export default function StripeSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useCart();
  
  // เพิ่มฟังก์ชัน clearShoppingCart ที่ใช้ทั้ง context และ localStorage
  const clearShoppingCart = useCallback(() => {
    try {
      console.log('Clearing shopping cart after Stripe payment...');
      
      // วิธีที่ 1: ใช้ clearCart จาก CartContext
      clearCart();
      
      // วิธีที่ 2: ใช้ localStorage API โดยตรงเพื่อความมั่นใจ
      if (typeof window !== 'undefined') {
        localStorage.removeItem('next-tree-cart');
        localStorage.setItem('next-tree-cart', '[]');
        
        // ล้าง key อื่นๆ ที่อาจเกี่ยวข้องด้วย
        localStorage.removeItem('cart');
        localStorage.setItem('cart', '[]');
      }
      
      console.log('Shopping cart cleared successfully');
      
      // บันทึกสถานะการล้างตะกร้าใน sessionStorage
      sessionStorage.setItem('cart_cleared', 'true');
      if (orderNumber) {
        sessionStorage.setItem('order_completed', orderNumber);
      }
      
    } catch (error) {
      console.error('Error clearing shopping cart:', error);
    }
  }, [clearCart, orderNumber]);
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('ไม่พบข้อมูล session ID');
      setLoading(false);
      return;
    }
    
    // ล้างตะกร้าทันทีที่เข้าหน้านี้
    clearShoppingCart();
    
    // ตรวจสอบสถานะการชำระเงินจาก Stripe
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/stripe/check-session?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setOrderNumber(data.orderNumber);
          // ล้างตะกร้าอีกครั้งหลังจากได้รับข้อมูลคำสั่งซื้อ
          setTimeout(() => clearShoppingCart(), 500);
        } else {
          setError(data.message || 'ไม่สามารถยืนยันการชำระเงินได้');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setError('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน');
      } finally {
        setLoading(false);
      }
    };
    
    checkPaymentStatus();
  }, [searchParams, clearShoppingCart]);
  
  // เพิ่ม useEffect เพื่อล้างตะกร้าอีกครั้งเมื่อมีการแสดงผล
  useEffect(() => {
    if (!loading && orderNumber) {
      // ล้างตะกร้าหลังจากหน้าโหลดเสร็จและมีข้อมูลคำสั่งซื้อ
      clearShoppingCart();
    }
  }, [loading, orderNumber, clearShoppingCart]);
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
            <CircularProgress size={60} />
            <Typography variant="h6" mt={3}>
              กำลังตรวจสอบสถานะการชำระเงิน...
            </Typography>
          </Box>
        ) : error ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
            <Button variant="contained" component={Link} href="/checkout">
              กลับไปที่หน้าชำระเงิน
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 3 }} />
            
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="success.main">
              ขอบคุณสำหรับคำสั่งซื้อ
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              การชำระเงินสำเร็จแล้ว
            </Typography>
            
            {orderNumber && (
              <Typography variant="body1" gutterBottom>
                หมายเลขคำสั่งซื้อของคุณคือ: <strong>{orderNumber}</strong>
              </Typography>
            )}
            
            <Typography variant="body1" mt={2} mb={4}>
              เราได้ส่งอีเมลยืนยันการสั่งซื้อไปที่อีเมลของท่าน กรุณาตรวจสอบอีเมลเพื่อดูรายละเอียดการสั่งซื้อ
            </Typography>
            
            <Box mt={2} display="flex" gap={2}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                href="/"
                size="large"
              >
                กลับสู่หน้าหลัก
              </Button>
              
              {orderNumber && (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  component={Link} 
                  href={`/orders/detail/${orderNumber}`}
                  size="large"
                >
                  ดูรายละเอียดคำสั่งซื้อ
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 