'use client'

import Link from 'next/link';
import { Box, Button, Container, Typography, Stack, Divider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // ป้องกันการแสดงผลที่ไม่สมบูรณ์ระหว่าง hydration
  }

  return (
    <Container maxWidth="md">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '80vh',
          py: 6,
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            fontSize: { xs: '5rem', md: '7rem' },
            fontWeight: 300,
            color: 'text.primary',
            letterSpacing: '-0.05em',
            mb: 2,
          }}
        >
          404
        </Typography>

        <Divider sx={{ width: '60px', mb: 4, borderColor: 'primary.main', borderWidth: 2 }} />

        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 2,
            fontWeight: 400,
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          ไม่พบหน้าที่คุณต้องการ
        </Typography>

        <Typography 
          variant="body1" 
          align="center" 
          color="text.secondary" 
          sx={{ 
            mb: 5, 
            maxWidth: '450px',
            lineHeight: 1.6,
          }}
        >
          หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือลบออกจากระบบแล้ว
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3}
          sx={{
            mt: 1,
            '& .MuiButton-root': {
              borderRadius: '4px',
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: 'none',
            }
          }}
        >
          <Button 
            variant="contained" 
            component={Link} 
            href="/"
            size="large"
            startIcon={<HomeIcon />}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            กลับสู่หน้าหลัก
          </Button>
          <Button 
            variant="outlined"
            component={Link}
            href="/products"
            size="large"
            startIcon={<ShoppingBagOutlinedIcon />}
            sx={{
              borderColor: 'text.secondary',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'text.primary',
                backgroundColor: 'transparent',
              }
            }}
          >
            ดูสินค้าทั้งหมด
          </Button>
        </Stack>
      </Box>
    </Container>
  );
} 