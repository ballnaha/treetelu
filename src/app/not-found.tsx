import Link from 'next/link';
import { Box, Button, Container, Typography, Stack } from '@mui/material';

export default function NotFound() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh'
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom align="center" sx={{ 
          fontSize: { xs: '6rem', md: '8rem' },
          fontWeight: 700,
          color: 'primary.main'
        }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
          ไม่พบหน้าที่คุณกำลังค้นหา
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4, maxWidth: '600px' }}>
          หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย ลบ หรือไม่มีอยู่ในระบบ กรุณาตรวจสอบ URL อีกครั้งหรือกลับไปยังหน้าหลัก
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button 
            variant="contained" 
            component={Link} 
            href="/"
            size="large"
          >
            กลับสู่หน้าหลัก
          </Button>
          <Button 
            variant="outlined"
            component={Link}
            href="/products"
            size="large"
          >
            ดูสินค้าทั้งหมด
          </Button>
        </Stack>
      </Box>
    </Container>
  );
} 