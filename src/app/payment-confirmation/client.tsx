"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  Divider,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Card,
  CardContent,
  Chip,
  Backdrop,
  useTheme,
  Breadcrumbs,
  Stack,
  Dialog,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import dynamic from 'next/dynamic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import Footer from '@/components/Footer';

// Import ClientOnly component แบบ dynamic เพื่อป้องกัน hydration error
// const ClientOnly = dynamic(() => import("@/components/ClientOnly"), { 
//   ssr: false
// });

// สร้าง styled components
const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  marginBottom: theme.spacing(1),
  position: 'relative',
  paddingBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  border: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
}));

const StyledCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(45deg, #24B493 0%, #4CC9AD 100%)',
  borderRadius: '16px 16px 0 0',
  color: 'white',
}));

const UploadButton = styled('label')(({ theme }) => ({
  border: `1px dashed ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: theme.palette.grey[50],
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.primary.main,
  },
}));

const PreviewContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  backgroundColor: theme.palette.background.paper,
}));

const FileInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const FileActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
}));

const FileChip = styled(Chip)(({ theme }) => ({
  maxWidth: '100%',
  width: '100%',
  fontWeight: 500,
  marginBottom: theme.spacing(1.5),
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
}));

const BankCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: '#fff',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
}));

// สร้าง wrapper component สำหรับการทำงานฝั่ง client
export default function PaymentConfirmationClient() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [orderNumber, setOrderNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [isValidPath, setIsValidPath] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // ตรวจสอบว่า path ถูกต้องหรือไม่
  useEffect(() => {
    // ตรวจสอบว่าเป็น path ที่ถูกต้องหรือไม่
    const validPaths = ['/payment-confirmation'];
    if (!validPaths.includes(pathname)) {
      // ถ้าไม่ใช่ path ที่ถูกต้อง ให้ redirect ไปที่หน้า 404
      router.replace('/404');
      return;
    }
    
    // ถ้าเป็น path ที่ถูกต้อง
    setIsValidPath(true);
    
    // ตรวจสอบ URL parameters สำหรับ orderNumber
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumberParam = urlParams.get('orderNumber');
    if (orderNumberParam) {
      setOrderNumber(orderNumberParam);
      setIsAutoFilled(true);
    }
    
    // เพิ่ม meta tag เพื่อป้องกันการ cache
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
    
    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);
    
    const expires = document.createElement('meta');
    expires.httpEquiv = 'Expires';
    expires.content = '0';
    document.head.appendChild(expires);
    
    // ลบ meta tags เมื่อ component unmount
    return () => {
      document.head.removeChild(meta);
      document.head.removeChild(pragma);
      document.head.removeChild(expires);
    };
  }, [pathname, router]);

  // ถ้า path ไม่ถูกต้อง ให้ไม่แสดงเนื้อหา
  if (!isValidPath) {
    return null;
  }

  // จัดการการเปลี่ยนแปลงหมายเลขคำสั่งซื้อ
  const handleOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderNumber(e.target.value);
    setError(null);
  };

  // จัดการการเปลี่ยนแปลงจำนวนเงิน
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // อนุญาตเฉพาะตัวเลขและจุดทศนิยม
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };
  
  // จัดการการอัพโหลดสลิป
  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.match('image.*')) {
        setError('โปรดอัพโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF)');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      setSlip(file);
      setError(null);
      
      // สร้าง URL สำหรับแสดงตัวอย่างรูปภาพ
      const reader = new FileReader();
      reader.onload = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // จัดการการลบสลิป
  const handleRemoveSlip = () => {
    setSlip(null);
    setSlipPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลก่อนส่ง
    if (!orderNumber) {
      setError('กรุณาระบุหมายเลขคำสั่งซื้อ');
      return;
    }
    
    if (!amount) {
      setError('กรุณาระบุจำนวนเงินที่โอน');
      return;
    }
    
    if (!slip) {
      setError('กรุณาอัพโหลดหลักฐานการโอนเงิน (สลิป)');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // สร้าง FormData สำหรับส่งข้อมูล
      const formData = new FormData();
      formData.append('orderNumber', orderNumber);
      formData.append('amount', amount);
      formData.append('slip', slip);
      
      // เพิ่ม timestamp เพื่อป้องกันการ cache
      const timestamp = Date.now();
      const apiUrl = `/api/payment-confirmation?t=${timestamp}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // เพิ่ม headers เพื่อป้องกันการ cache
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
      
      console.log('Payment confirmation result:', result);
      
      // เก็บ orderNumber จาก response
      setConfirmedOrderNumber(result.data.orderNumber);
      
      // รีเซ็ตฟอร์มและแสดงข้อความสำเร็จ
      setOrderNumber('');
      setAmount('');
      setSlip(null);
      setSlipPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setSuccess(true);
      setOpenSnackbar(true);
      
    } catch (error: any) {
      console.error('Error submitting payment confirmation:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการปิด Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // เปิด Dialog QR Code
  const handleOpenQRDialog = () => {
    setOpenQRDialog(true);
  };

  // ปิด Dialog QR Code
  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
  };

  // ถ้าส่งข้อมูลสำเร็จ แสดงหน้ายืนยัน
  if (success) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Box 
          sx={{ 
            flex: 1,
            position: 'relative',
            py: { xs: 4, md: 6 },
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white'
          }}
        >
          <Container maxWidth="lg">
            <StyledCard>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    background: 'linear-gradient(45deg, #24B493 0%, #4CC9AD 100%)', 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto',
                    boxShadow: '0 5px 10px rgba(36, 180, 147, 0.2)'
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  แจ้งชำระเงินสำเร็จ
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  ขอบคุณสำหรับการแจ้งชำระเงิน เราจะตรวจสอบและยืนยันการชำระเงินโดยเร็วที่สุด
                </Typography>
                
                <Chip 
                  label={`หมายเลขคำสั่งซื้อ: ${confirmedOrderNumber}`} 
                  sx={{ mb: 3 }}
                  color="primary"
                  variant="outlined"
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/payment-confirmation"
                    onClick={() => setSuccess(false)}
                    sx={{ borderRadius: 2 }}
                  >
                    แจ้งชำระเงินอีกครั้ง
                  </Button>
                  <Button
                    variant="contained"
                    component={Link}
                    href="/"
                    sx={{ borderRadius: 2 }}
                  >
                    กลับสู่หน้าหลัก
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      {/* QR Code Dialog */}
      <Dialog
        open={openQRDialog}
        onClose={handleCloseQRDialog}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
            backgroundColor: '#fff'
          }
        }}
      >
        <Box sx={{ position: 'relative', width: { xs: 300, sm: 400, md: 600 }, height: { xs: 300, sm: 400, md: 600 } }}>
          <Image
            src="/images/qr_scb.jpg"
            alt="QR Code สำหรับชำระเงิน"
            fill
            style={{ objectFit: 'contain' }}
            quality={90}
          />
        </Box>
        <IconButton
          onClick={handleCloseQRDialog}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'grey.700',
            bgcolor: 'white',
            '&:hover': {
              bgcolor: 'grey.100'
            },
            boxShadow: 1
          }}
        >
          <CloseIcon />
        </IconButton>
      </Dialog>
      
      <Box 
        sx={{ 
          flex: 1,
          py: { xs: 0, md: 0, lg: 0 },
          backgroundColor: 'white', 
        }}
      >
        <Container sx={{ 
          maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' },
          px: { xs: 2, sm: 3, lg: 4, xl: 5 },
          mx: 'auto'
        }} disableGutters>
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
              แจ้งชำระเงิน
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
            แจ้งชำระเงิน
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            กรุณากรอกข้อมูลการชำระเงินให้ครบถ้วน เพื่อความรวดเร็วในการตรวจสอบ
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 1 }}
            >
              {error}
            </Alert>
          )}
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box sx={{ flex: 7, width: '100%' }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ReceiptLongIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                  ข้อมูลการชำระเงิน
                </Typography>
                
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    {/* แสดงข้อความเมื่อมีการ auto-fill orderNumber */}
                    {isAutoFilled && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          หมายเลขคำสั่งซื้อได้ถูกกรอกอัตโนมัติจากประวัติการสั่งซื้อของคุณ
                        </Typography>
                      </Alert>
                    )}
                    
                    <TextField
                      fullWidth
                      label="หมายเลขคำสั่งซื้อ"
                      value={orderNumber}
                      onChange={handleOrderNumberChange}
                      required
                      size="small"
                      placeholder="เช่น TT250100x"
                    />
                    
                    <TextField
                      fullWidth
                      label="จำนวนเงินที่โอน"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="เช่น 1500"
                      variant="outlined"
                      required
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="ธนาคารที่โอนเงิน"
                      value="ธนาคารไทยพาณิชย์"
                      InputProps={{
                        readOnly: true,
                      }}
                      variant="outlined"
                      sx={{ mb: 3 }}
                    />
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        หลักฐานการโอนเงิน (สลิป)
                      </Typography>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleSlipUpload}
                        id="slip-upload"
                      />
                      
                      {!slipPreview ? (
                        <UploadButton htmlFor="slip-upload">
                          <CloudUploadIcon sx={{ fontSize: 30, color: 'primary.main', mb: 1 }} />
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            คลิกเพื่ออัพโหลดภาพสลิป
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            JPG, PNG, GIF ขนาดไม่เกิน 5MB
                          </Typography>
                        </UploadButton>
                      ) : (
                        <PreviewContainer>
                          <Box sx={{ position: 'relative', height: 220 }}>
                            <Image
                              src={slipPreview}
                              alt="สลิปการโอนเงิน"
                              fill
                              style={{ objectFit: 'contain' }}
                            />
                          </Box>
                          <FileInfo>
                            <Typography variant="subtitle2" color="primary.main" gutterBottom>
                              หลักฐานการโอนเงิน
                            </Typography>
                            
                            <FileActions sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <FileChip
                                label={slip?.name}
                                size="medium"
                                variant="outlined"
                                color="primary"
                                icon={<ReceiptLongIcon />}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={handleRemoveSlip}
                                color="error"
                                startIcon={<InfoOutlinedIcon />}
                                sx={{ borderRadius: 2, alignSelf: 'flex-end' }}
                              >
                                ลบหลักฐาน
                              </Button>
                            </FileActions>
                          </FileInfo>
                        </PreviewContainer>
                      )}
                    </Box>
                    
                    <Box sx={{ mt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ borderRadius: 2 }}
                      >
                        {loading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการชำระเงิน'}
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </Paper>
            </Box>
            
            <Box sx={{ flex: 5, width: '100%' }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountBalanceIcon sx={{ mr: 1, fontSize: 24, color: 'primary.main' }} />
                  ข้อมูลบัญชี
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    ธนาคารไทยพาณิชย์ (SCB)
                  </Typography>
                  
                  <Stack spacing={1.5} sx={{ mb: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>ชื่อบัญชี:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>นาย ธัญญา รัตนาวงศ์ไชยา</Typography>
                    </Stack>
                    
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>เลขที่บัญชี:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>264-221037-2</Typography>
                    </Stack>
                    
                  </Stack>
                  
                  {/* QR Code สำหรับการสแกนจ่ายเงิน */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    flexDirection: 'column',
                    mt: 3,
                    mb: 3
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                      สแกนเพื่อชำระเงิน
                    </Typography>
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        width: 200, 
                        height: 200, 
                        border: '1px solid #eee',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.9,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      onClick={handleOpenQRDialog}
                    >
                      <Image
                        src="/images/qr_scb.jpg"
                        alt="QR Code สำหรับชำระเงิน (คลิกเพื่อขยาย)"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        bgcolor: 'rgba(255,255,255,0.8)', 
                        py: 0.5,
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" sx={{ color: 'primary.main' }}>
                          คลิกเพื่อขยาย
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    เมื่อแจ้งชำระเงินแล้ว ทางร้านจะตรวจสอบและจัดส่งสินค้าภายใน 1-3 วันทำการ
                  </Typography>
                </Alert>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    component={Link}
                    href="/"
                    startIcon={<ArrowBackIcon />}
                    size="small"
                  >
                    กลับไปยังหน้าหลัก
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
} 