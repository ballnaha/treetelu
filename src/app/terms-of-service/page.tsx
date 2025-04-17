'use client';

import { Container, Typography, Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Container maxWidth={false} sx={{ 
        py: 4, 
        px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
        maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' }, 
        mx: 'auto',
        minHeight: 'calc(100vh - 64px)', // 64px คือความสูงของ header
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Box 
            component={Link} 
            href="/" 
            sx={{ 
              textDecoration: 'none', 
              color: theme.palette.primary.main,
              fontFamily: theme.typography.fontFamily,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            หน้าหลัก
          </Box>
          <Typography sx={{ 
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily
          }}>
            เงื่อนไขการใช้บริการ
          </Typography>
        </Breadcrumbs>

        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 2,
            fontWeight: 600,
            color: 'text.primary',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: 0,
              width: 60,
              height: 3,
              bgcolor: 'primary.main',
            }
          }}
        >
          เงื่อนไขการใช้บริการ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          ข้อกำหนดและเงื่อนไขในการใช้บริการของเรา
        </Typography>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การยอมรับเงื่อนไข
            </Typography>
            <Typography paragraph>
              การเข้าใช้งานและใช้บริการของเว็บไซต์นี้ถือว่าคุณได้ยอมรับและตกลงที่จะปฏิบัติตามเงื่อนไขการใช้บริการทั้งหมดที่ระบุไว้ในหน้านี้
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การสั่งซื้อสินค้า
            </Typography>
            <Typography paragraph>
              เมื่อคุณทำการสั่งซื้อสินค้าผ่านเว็บไซต์ คุณจะต้อง:
            </Typography>
            <ul>
              <li>ให้ข้อมูลที่ถูกต้องและครบถ้วน</li>
              <li>ยืนยันการสั่งซื้อก่อนการชำระเงิน</li>
              <li>ชำระเงินตามจำนวนที่กำหนด</li>
              <li>รับทราบว่าสินค้าบางรายการอาจมีจำนวนจำกัด</li>
            </ul>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การชำระเงิน
            </Typography>
            <Typography paragraph>
              เรารับชำระเงินผ่านช่องทางที่ระบุไว้ในเว็บไซต์ การชำระเงินจะต้องเสร็จสมบูรณ์ก่อนที่เราจะดำเนินการจัดส่งสินค้า
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การจัดส่งสินค้า
            </Typography>
            <Typography paragraph>
              เราจะจัดส่งสินค้าตามที่อยู่ที่คุณระบุไว้ในการสั่งซื้อ ระยะเวลาในการจัดส่งอาจแตกต่างกันไปตามพื้นที่และบริการขนส่ง
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การคืนสินค้าและการเปลี่ยนสินค้า
            </Typography>
            <Typography paragraph>
              คุณสามารถขอคืนสินค้าหรือเปลี่ยนสินค้าได้ภายใน 7 วันหลังจากได้รับสินค้า โดยสินค้าต้องอยู่ในสภาพสมบูรณ์และไม่มีการใช้งาน
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              สิทธิ์ในทรัพย์สินทางปัญญา
            </Typography>
            <Typography paragraph>
              เนื้อหา รูปภาพ และข้อมูลทั้งหมดบนเว็บไซต์นี้เป็นลิขสิทธิ์ของเรา ห้ามคัดลอก แก้ไข หรือนำไปใช้โดยไม่ได้รับอนุญาต
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การเปลี่ยนแปลงเงื่อนไข
            </Typography>
            <Typography paragraph>
              เราขอสงวนสิทธิ์ในการแก้ไขเงื่อนไขการใช้บริการได้ตลอดเวลา โดยจะประกาศการเปลี่ยนแปลงบนเว็บไซต์
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
} 