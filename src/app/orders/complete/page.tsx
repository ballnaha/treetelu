"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper, CircularProgress, Fade } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HomeIcon from '@mui/icons-material/Home';
import { useCart } from '@/context/CartContext';

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
  const { clearCart } = useCart(); // เพิ่ม useCart เพื่อใช้ clearCart

  // ฟังก์ชันสำหรับเคลียร์ข้อมูลส่วนลด
  const clearDiscountData = useCallback(() => {
    // เคลียร์ตะกร้าสินค้า
    clearCart();
    
    // เคลียร์ข้อมูลส่วนลดที่อาจถูกเก็บใน localStorage
    if (typeof window !== 'undefined') {
      // หากมีข้อมูลส่วนลดที่อาจถูกเก็บไว้ใน localStorage
      localStorage.removeItem('discount-code');
      localStorage.removeItem('discount-amount');
      localStorage.removeItem('discount-details');
      
      // เคลียร์ session storage ด้วยถ้ามี
      sessionStorage.removeItem('discount-code');
      sessionStorage.removeItem('discount-amount');
      sessionStorage.removeItem('discount-details');
    }
  }, [clearCart]);

  // ปรับปรุงการทำงานของ useEffect ให้ทำงานเร็วขึ้น
  useEffect(() => {
    // กำหนดให้ component ถูก mount เรียบร้อยแล้ว
    setIsMounted(true);
    
    // เคลียร์ข้อมูลส่วนลดเมื่อชำระเงินสำเร็จ
    clearDiscountData();
    
    // แสดงข้อมูลการค้นหาทันทีที่โหลดหน้า
    const transactionId = searchParams.get('transactionId') || '';
    const sessionId = searchParams.get('session_id') || ''; // เพิ่มการรับค่า session_id จาก Stripe
    const source = searchParams.get('source') || '';
    console.log('Initial load params:', { transactionId, sessionId, source });
    
    // สร้างตัวแปรเพื่อตรวจสอบว่าได้เริ่มการตรวจสอบแล้วหรือไม่
    let hasStartedCheck = false;
    
    // เริ่มตรวจสอบข้อมูลการชำระเงินทันที
    if (transactionId && (source === 'cc' || source === 'credit_card' || source === 'pp' || source === 'promptpay')) {
      console.log('Starting payment check for transaction:', transactionId);
      hasStartedCheck = true;
      checkPaymentData(transactionId);
    } else if (sessionId && source === 'stripe') {
      console.log('Starting Stripe payment check for session:', sessionId);
      // ตั้งค่า retryCount เป็น 1 เพื่อให้ checkPayment เริ่มทำงานทันที
      hasStartedCheck = true;
      setRetryCount(1);
    } else {
      console.log('Missing required parameters:', { transactionId, sessionId, source });
      setError('ไม่พบข้อมูลการชำระเงิน กรุณาตรวจสอบพารามิเตอร์ที่ส่งมา');
      setLoading(false);
    }
    
    // กำหนดเวลาหมดเวลารอ (timeout) เป็น 30 วินาที
    const timeout = setTimeout(() => {
      if (loading && !paymentData && hasStartedCheck) {
        console.log('Payment verification timeout - redirecting to home page');
        // ไม่ต้องแสดงข้อความ Error ให้เปลี่ยนเส้นทางไปยังหน้าหลักทันที
        window.location.href = '/';
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }, []);  // ใช้ dependency array เป็น array ว่าง เพื่อให้ทำงานเฉพาะครั้งแรกที่ component ถูก mount
  
  // เพิ่มฟังก์ชันสำหรับตรวจสอบข้อมูลการชำระเงินจาก Stripe
  const checkStripePaymentData = async (sessionId: string) => {
    try {
      console.log(`Checking Stripe payment data for session: ${sessionId}`);
      
      // ตรวจสอบว่า sessionId มีค่าหรือไม่
      if (!sessionId || (sessionId === 'undefined')) {
        console.error('Invalid Stripe session ID:', sessionId);
        if (retryCount < maxRetries) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryInterval);
          return;
        } else {
          throw new Error('รหัสการชำระเงิน Stripe ไม่ถูกต้อง');
        }
      }
      
      try {
        // เพิ่ม timestamp เพื่อป้องกันการแคช
        const timestamp = new Date().getTime();
        const apiUrl = `/api/stripe/verify?session_id=${sessionId}&_t=${timestamp}`;
        
        console.log(`Fetching API: ${apiUrl}, attempt ${retryCount + 1}/${maxRetries}`);
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        if (!response.ok) {
          console.error('API response error:', response.status, response.statusText);
          
          // ถ้าเป็น 404 แสดงว่าอาจยังไม่มีข้อมูลคำสั่งซื้อในฐานข้อมูล รอให้ webhook ทำงานเสร็จก่อน
          if (response.status === 404) {
            console.log(`API returned 404 for session ${sessionId} - Retry ${retryCount + 1}/${maxRetries}`);
            
            // ใช้เวลารอที่นานขึ้นเพื่อให้ webhook มีเวลาประมวลผลและบันทึกข้อมูลลงฐานข้อมูล
            if (retryCount < maxRetries) {
              // เพิ่มเวลารอตามจำนวนครั้งที่ลองใหม่
              const waitTime = retryInterval * (retryCount < 3 ? 3 : 1.5);
              console.log(`Waiting ${waitTime}ms before retry...`);
              
              // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
              window.requestAnimationFrame(() => {
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                }, waitTime);
              });
              return;
            }
          }
          
          // กรณีอื่นๆ ถ้ายังไม่ครบจำนวนครั้งที่จะลองใหม่ ให้ลองอีกครั้ง
          if (retryCount < maxRetries) {
            console.log(`Other API error ${response.status} - Retry ${retryCount + 1}/${maxRetries}`);
            // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
            window.requestAnimationFrame(() => {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, retryInterval);
            });
            return;
          }
          
          throw new Error('ไม่สามารถดึงข้อมูลการชำระเงินได้');
        }
        
        const data = await response.json();
        console.log('Stripe API response:', data);

        if (data.success) {
          // กรณีที่มีการสร้าง order จาก pendingPayment
          if (data.order) {
            console.log('Order created from pending payment:', data.order);
            
            setPaymentData({
              orderNumber: data.orderNumber,
              transactionId: sessionId
            });
            setLoading(false);
            return;
          }
          
          // กรณีมีข้อมูลจาก pendingPayment
          if (data.orderNumber === "PENDING" && data.pendingPayment) {
            console.log('Found pending payment data:', data.pendingPayment);
            
            // แสดงหน้าชำระเงินสำเร็จ แต่แจ้งว่าอยู่ระหว่างประมวลผลคำสั่งซื้อ
            if (data.paymentStatus === 'CONFIRMED') {
              setPaymentData({
                orderNumber: "กำลังประมวลผล", // แสดงข้อความว่ากำลังประมวลผล
                transactionId: sessionId
              });
              setLoading(false);
              
              // ลองดึงข้อมูลอีกครั้งหลังจาก 5 วินาที
              setTimeout(() => {
                window.requestAnimationFrame(() => {
                  checkStripePaymentData(sessionId);
                });
              }, 5000);
            } else {
              // ถ้ายังไม่ CONFIRMED และยังไม่เกินจำนวนครั้งที่จะลองใหม่
              if (retryCount < maxRetries) {
                console.log(`Found pending payment but status is not CONFIRMED - Retry ${retryCount + 1}/${maxRetries}`);
                // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
                window.requestAnimationFrame(() => {
                  setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                  }, retryInterval);
                });
              } else {
                // แสดงข้อความเมื่อเกินจำนวนครั้งที่จะลองใหม่
                setError('การชำระเงินอยู่ระหว่างการประมวลผล โปรดตรวจสอบอีเมลของคุณ');
                setLoading(false);
              }
            }
            return;
          }
          
          // กรณีมีข้อมูลจาก order ปกติ
          setPaymentData({
            orderNumber: data.orderNumber,
            transactionId: sessionId
          });
          setLoading(false);
        } else {
          // ถ้าไม่พบข้อมูลและยังไม่เกินจำนวนครั้งที่จะลองใหม่
          if (retryCount < maxRetries) {
            console.log(`Retry ${retryCount + 1}/${maxRetries} - waiting for Stripe webhook to update order data`);
            // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
            window.requestAnimationFrame(() => {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, retryInterval);
            });
          } else {
            setError(data.message || 'ไม่พบข้อมูลคำสั่งซื้อ');
            setLoading(false);
          }
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // ลองใหม่ถ้ายังไม่ครบจำนวนครั้ง
        if (retryCount < maxRetries) {
          console.log(`Fetch error - Retry ${retryCount + 1}/${maxRetries}`);
          // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
          window.requestAnimationFrame(() => {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, retryInterval);
          });
        } else {
          setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking Stripe payment:', err);
      
      if (retryCount < maxRetries) {
        // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
        window.requestAnimationFrame(() => {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryInterval);
        });
      } else {
        setError('เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน');
        setLoading(false);
      }
    }
  };
  
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
      const sessionId = searchParams.get('session_id');
      const source = searchParams.get('source');
      console.log(`Payment check attempt ${retryCount + 1}/${maxRetries}:`, { transactionId, sessionId, source });

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
      } else if (source === 'stripe') {
        setLoading(true);
        
        // ถ้า sessionId เป็น undefined หรือค่าว่าง แสดงว่า webhook ยังไม่ได้อัพเดต
        if (!sessionId) {
          console.log('Stripe session ID is undefined, waiting for webhook...');
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
        
        await checkStripePaymentData(sessionId);
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
  }, [searchParams, retryCount, maxRetries, checkPaymentData, checkStripePaymentData]);

  useEffect(() => {
    // ทำการ retry เมื่อ retryCount เปลี่ยนแปลง แต่ต้องอย่างให้เกิด infinite loop
    if (isMounted && retryCount > 0) {
      const source = searchParams.get('source') || '';
      const sessionId = searchParams.get('session_id') || '';
      
      // ใช้ state เพื่อป้องกันการเรียกซ้ำ
      const isStripePayment = source === 'stripe' && sessionId;
      
      // ใช้ setTimeout เพื่อหลีกเลี่ยง state update ซ้ำซ้อนที่อาจทำให้เกิด infinite loop
      const retryTimer = setTimeout(() => {
        console.log(`Retry attempt ${retryCount} triggered for ${isStripePayment ? 'Stripe' : 'regular'} payment`);
        // ใช้ requestAnimationFrame เพื่อป้องกัน Maximum update depth exceeded
        window.requestAnimationFrame(() => {
          checkPayment();
        });
      }, 100); // ใช้เวลาสั้นๆ เพื่อให้มั่นใจว่าไม่เกิด state update ซ้อนกัน
      
      return () => clearTimeout(retryTimer);
    }
  }, [isMounted, retryCount]);

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
    // ตรวจสอบว่าเป็นการรอการอัปเดตจาก Stripe webhook หรือไม่
    const isStripePayment = searchParams.get('source') === 'stripe';
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          {isStripePayment 
            ? 'กำลังตรวจสอบข้อมูลการชำระเงินจาก Stripe...'
            : 'กำลังตรวจสอบข้อมูลการชำระเงิน...'}
        </Typography>
        {retryCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isStripePayment
              ? 'กรุณารอสักครู่ ระบบกำลังรอการยืนยันจาก Stripe (ครั้งที่ ' + retryCount + '/' + maxRetries + ')'
              : 'กรุณารอสักครู่ (พยายามตรวจสอบครั้งที่ ' + retryCount + '/' + maxRetries + ')'}
          </Typography>
        )}
        {isStripePayment && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 500, textAlign: 'center' }}>
            หากคุณได้รับอีเมลยืนยันการชำระเงินจาก Stripe แล้ว แสดงว่าการชำระเงินสำเร็จเรียบร้อย กรุณารอระบบอัปเดตข้อมูล...
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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minHeight: '100vh', 
      p: { xs: 2, md: 4 },
      bgcolor: '#ffffff'
    }}>
      <Paper 
        elevation={4} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          maxWidth: 680, 
          width: '100%', 
          textAlign: 'center',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          mt: 4,
          mb: 4
        }}
      >
        {/* ลายเส้นตกแต่งด้านบน */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '8px', 
          background: 'linear-gradient(90deg, #24B493, #8bd4c4, #24B493)' 
        }} />
        
        <Fade in={true} timeout={800}>
          <Box>
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexDirection: 'column'
            }}>
              <Box 
                sx={{ 
                  width: 90, 
                  height: 90, 
                  borderRadius: '50%', 
                  bgcolor: '#e8f7f2', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mb: 3,
                  animation: 'pulse 2s infinite'
                }}
              >
                <CheckCircleOutlineIcon 
                  sx={{ 
                    fontSize: 56, 
                    color: '#24B493', 
                  }} 
                />
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1e293b',
                  mb: 1
                }}
              >
                ชำระเงินสำเร็จ
              </Typography>
              
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: '#64748b',
                  mb: 3,
                  maxWidth: '90%'
                }}
              >
                ขอขอบคุณที่ใช้บริการกับเรา เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว
              </Typography>
              
              <Box sx={{ 
                width: '100%', 
                height: '1px', 
                bgcolor: '#e2e8f0', 
                my: 2 
              }} />
            </Box>
            
            <Box sx={{ 
              my: 4, 
              p: 3, 
              bgcolor: '#f1f9f7', 
              borderRadius: 2,
              boxShadow: 'inset 0 0 0 1px rgba(36, 180, 147, 0.1)'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#475569' }}>
                  เลขที่คำสั่งซื้อ
                </Typography>
                <OrderNumberDisplay orderNumber={paymentData.orderNumber} />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#475569' }}>
                  รหัสอ้างอิงธุรกรรม
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748b',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    bgcolor: '#f8fafc',
                    p: 1,
                    borderRadius: 1
                  }}
                >
                  {paymentData.transactionId}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 2, mb: 4 }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                เราจะจัดส่งอีเมลยืนยันคำสั่งซื้อพร้อมรายละเอียดไปที่อีเมลของคุณ
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                หากมีข้อสงสัย โปรดติดต่อเราที่ <strong>Line: @treetelu</strong> หรืออีเมล <strong>info@treetelu.com</strong>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => router.push('/')}
                sx={{ 
                  bgcolor: '#24B493',
                  '&:hover': {
                    bgcolor: '#1c9679',
                  },
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px 0 rgba(36, 180, 147, 0.25)'
                }}
              >
                กลับหน้าหลัก
              </Button>
            </Box>
          </Box>
        </Fade>
      </Paper>
      
      {/* เพิ่ม CSS Animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Box>
  );
}

// ส่วนที่แสดงเลขที่คำสั่งซื้อในกล่องข้อความเมื่อชำระเงินสำเร็จ
const OrderNumberDisplay = ({ orderNumber }: { orderNumber: string }) => {
  if (orderNumber === "กำลังประมวลผล") {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600, 
            color: 'info.main',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box component="span" sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: 'info.main',
            display: 'inline-block',
            mr: 1,
            animation: 'pulse 1.5s infinite ease-in-out',
          }}/>
          กำลังประมวลผลคำสั่งซื้อ
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ระบบกำลังสร้างเลขที่คำสั่งซื้อ โปรดรอสักครู่
        </Typography>
      </Box>
    );
  }
  
  return (
    <Typography 
      variant="h5" 
      color="primary" 
      sx={{ 
        fontWeight: 600, 
        letterSpacing: '0.5px',
        color: '#24B493'
      }}
    >
      {orderNumber}
    </Typography>
  );
}; 