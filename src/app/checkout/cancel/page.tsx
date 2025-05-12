"use client";

import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Button, Divider } from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import { useRouter } from 'next/navigation';

// คอมโพเนนต์หลัก
export default function StripeCancel() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // ตรวจสอบว่าโค้ดกำลังทำงานที่ client side
  useEffect(() => {
    setIsMounted(true);
    
    // เลื่อนหน้าไปด้านบนสุดเมื่อโหลดในฝั่ง client เท่านั้น
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  // ป้องกัน hydration error โดยแสดงเนื้อหาเมื่อ mount เสร็จเท่านั้น
  if (!isMounted) {
    return null; // หรือแสดง loading skeleton ถ้าต้องการ
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            maxWidth: 560,
            width: '100%',
            mx: 'auto',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
          }}
        >
          {/* พื้นหลังประดับตกแต่ง */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, rgba(211, 47, 47, 0.05) 0%, rgba(211, 47, 47, 0.1) 100%)',
              zIndex: 0,
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, rgba(95, 95, 95, 0.05) 0%, rgba(95, 95, 95, 0.12) 100%)',
              zIndex: 0,
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'rgba(211, 47, 47, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px dashed rgba(211, 47, 47, 0.3)',
                }}
              />
              <CancelIcon 
                sx={{ 
                  fontSize: 54, 
                  color: '#d32f2f',
                }}
              />
            </Box>
            
            <Typography 
              variant="h5" 
              align="center" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                mb: 2,
                color: '#d32f2f',
              }}
            >
              การชำระเงินถูกยกเลิก
            </Typography>
            
            <Box
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.03)',
              }}
            >
              <Typography variant="body1" align="center" gutterBottom>
                คุณได้ยกเลิกการชำระเงินหรือกลับจากหน้าชำระเงิน
              </Typography>
              
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                คุณสามารถกลับไปที่ตะกร้าสินค้าเพื่อดำเนินการชำระเงินใหม่หรือเลือกวิธีการชำระเงินอื่น
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="body2" align="center" sx={{ fontWeight: 500 }}>
                มีข้อสงสัย? กรุณาติดต่อเราที่ Line: <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>@treetelu</Box>
              </Typography>
            </Box>
            
            
            <Button
              variant="text"
              component={Link}
              href="/"
              startIcon={<ArrowBackIcon />}
              sx={{ 
                mt: 3,
                display: 'flex',
                mx: 'auto',
                color: 'text.secondary'
              }}
            >
              กลับไปยังหน้าหลัก
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 