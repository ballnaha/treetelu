'use client';

import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
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
            นโยบายความเป็นส่วนตัว
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
            นโยบายความเป็นส่วนตัว
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            นโยบายความเป็นส่วนตัวของเรา
          </Typography>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>


          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การเก็บรวบรวมข้อมูลส่วนบุคคล
            </Typography>
            <Typography paragraph>
              เราเก็บรวบรวมข้อมูลส่วนบุคคลที่จำเป็นสำหรับการให้บริการ เช่น ชื่อ นามสกุล ที่อยู่ อีเมล และหมายเลขโทรศัพท์ 
              ข้อมูลเหล่านี้จะถูกใช้เพื่อการจัดส่งสินค้า การติดต่อกลับ และการให้บริการลูกค้าเท่านั้น
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การใช้ข้อมูล
            </Typography>
            <Typography paragraph>
              ข้อมูลส่วนบุคคลของคุณจะถูกใช้เพื่อ:
            </Typography>
            <ul>
              <li>การประมวลผลและการจัดส่งคำสั่งซื้อ</li>
              <li>การติดต่อสื่อสารเกี่ยวกับคำสั่งซื้อและการให้บริการ</li>
              <li>การปรับปรุงและพัฒนาบริการของเรา</li>
              <li>การส่งข้อมูลโปรโมชั่นและข่าวสาร (เฉพาะเมื่อได้รับความยินยอม)</li>
            </ul>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การเปิดเผยข้อมูล
            </Typography>
            <Typography paragraph>
              เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สาม ยกเว้นในกรณีที่จำเป็นสำหรับการให้บริการ 
              เช่น บริการขนส่งสินค้า หรือเมื่อได้รับความยินยอมจากคุณ
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              ความปลอดภัยของข้อมูล
            </Typography>
            <Typography paragraph>
              เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของคุณจากการเข้าถึง 
              การใช้ หรือการเปิดเผยโดยไม่ได้รับอนุญาต
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              สิทธิ์ของคุณ
            </Typography>
            <Typography paragraph>
              คุณมีสิทธิ์ในการเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้ตลอดเวลา 
              หากคุณต้องการใช้สิทธิ์เหล่านี้ กรุณาติดต่อเราผ่านช่องทางที่ระบุไว้ในหน้า "ติดต่อเรา"
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              การเปลี่ยนแปลงนโยบาย
            </Typography>
            <Typography paragraph>
              เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว 
              การเปลี่ยนแปลงใดๆ จะถูกประกาศบนเว็บไซต์ของเรา
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
} 