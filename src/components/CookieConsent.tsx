'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Snackbar, Link } from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';

const COOKIE_CONSENT_KEY = 'next-tree-cookie-consent';

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่ามีการยอมรับคุกกี้แล้วหรือยังและยังไม่หมดอายุ
    try {
      const consentData = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consentData) {
        const parsedData = JSON.parse(consentData);
        const expiryDate = new Date(parsedData.expires);
        const currentDate = new Date();
        
        // ถ้าวันหมดอายุผ่านไปแล้ว (หรือข้อมูลไม่ถูกต้อง) ให้แสดงแบนเนอร์ใหม่
        if (!parsedData.accepted || expiryDate <= currentDate) {
          setOpen(true);
        }
      } else {
        // ไม่มีข้อมูลการยอมรับ
        setOpen(true);
      }
    } catch (error) {
      // หากอ่านข้อมูลไม่ได้หรือมีข้อผิดพลาด ให้แสดงแบนเนอร์ใหม่
      console.error('Error reading cookie consent data:', error);
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    // กำหนดวันหมดอายุของคุกกี้ (1 ปี)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    // บันทึกค่าการยอมรับพร้อมวันหมดอายุ
    const consentData = {
      accepted: true,
      expires: expirationDate.toISOString()
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        maxWidth: '100%',
        width: { xs: '90%', sm: '500px' },
        bottom: { xs: '16px', sm: '24px' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 6,
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CookieIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            นโยบายการใช้คุกกี้
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          เว็บไซต์นี้ใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีแก่คุณ 
          คุกกี้จะช่วยจดจำข้อมูลการใช้งานและตะกร้าสินค้าของคุณ
          เมื่อคุณใช้งานเว็บไซต์นี้ต่อ เราจะถือว่าคุณยอมรับการใช้คุกกี้
          <Link href="/privacy-policy" sx={{ ml: 0.5 }}>
            อ่านเพิ่มเติมเกี่ยวกับนโยบายความเป็นส่วนตัว
          </Link>
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            onClick={handleAccept}
            sx={{ 
              px: 3,
              borderRadius: 2,
              boxShadow: 2,
              fontWeight: 500
            }}
          >
            ยอมรับ
          </Button>
        </Box>
      </Box>
    </Snackbar>
  );
} 