"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useCart } from '@/context/CartContext';
import { getProductImagePath } from '@/utils/imageUtils';
import { Product } from '@/types/product';
import { useTheme } from '@mui/material/styles';
import { Snackbar, Alert, Tooltip } from '@mui/material';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Breadcrumbs,
  Divider,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  Rating,
  Chip,
  Stack,
  IconButton,
  useMediaQuery
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import styled from '@emotion/styled';
import Cart from '@/components/Cart';
import RelatedProducts from '@/components/RelatedProducts';
import { useSwipeable } from 'react-swipeable';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

// สไตล์คอมโพเนนต์
const ProductImage = styled(Image)(({ theme }) => ({
  objectFit: 'cover',
  width: '100%',
  height: '100%',
  borderRadius: '8px',
}));

const ProductImageWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '100%',
  overflow: 'hidden',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  '@media (min-width: 960px)': {
    maxHeight: '500px',
  }
}));

const ThumbnailImage = styled(Image)(({ theme }) => ({
  objectFit: 'cover',
  width: '100%',
  height: '100%',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const ThumbnailWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '80px',
  height: '80px',
  overflow: 'hidden',
  borderRadius: '4px',
  margin: '0 8px 8px 0',
  border: '1px solid #e0e0e0',
}));

const QuantityButton = styled(Button)(({ theme }) => ({
  minWidth: '40px',
  height: '40px',
  padding: 0,
}));

const GalleryNavButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  color: '#333',
  zIndex: 10,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  width: 40,
  height: 40,
}));

const TabPanel = (props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// สร้าง ProductDetailClient component
function ProductDetailClient({ slug }: { slug: string }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { addToCart } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // สร้างรูปภาพจำลองสำหรับแกลเลอรี่
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  
  // ดึงข้อมูลสินค้า
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }
        
        const data = await response.json();
        setProduct(data);
        
        // ตั้งค่ารูปภาพหลัก
        const mainImage = getProductImagePath(data);
        setSelectedImage(mainImage);
        
        // สร้างรูปภาพจากข้อมูลที่ได้รับ
        const thumbs = [mainImage]; // เริ่มด้วยรูปภาพหลักเสมอ
        
        // ตรวจสอบว่ามีรูปภาพจากตาราง productimage หรือไม่
        if (data.images && data.images.length > 0) {
          // ดึงรูปภาพจากตาราง productimage
          data.images.forEach((img: any) => {
            if (img.imageName) {
              // สร้าง URL สำหรับรูปภาพ (ปรับให้เข้ากับโครงสร้างไฟล์ของคุณ)
              const imageUrl = `/images/product/${img.imageName}`;
              // เพิ่มเฉพาะรูปภาพที่ไม่ซ้ำกับรูปหลัก
              if (imageUrl !== mainImage && !thumbs.includes(imageUrl)) {
                thumbs.push(imageUrl);
              }
            }
          });
        }
        // ลบการสร้างรูปภาพจำลองเมื่อไม่มีรูปภาพเพิ่มเติม
        
        setThumbnails(thumbs);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug]);

  // เพิ่ม useEffect เพื่อตรวจสอบว่า component mount แล้ว
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // เพิ่ม/ลดจำนวนสินค้า
  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const handleDecreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  // เปลี่ยนแท็บ
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // เพิ่มสินค้าลงตะกร้า
  const handleAddToCart = () => {
    if (product) {
      // ตรวจสอบและใช้รูปภาพที่ถูกต้อง
      const productImage = selectedImage || getProductImagePath(product);
      
      // คำนวณราคาและส่วนลด
      const originalPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : 
                          typeof product.originalPrice === 'number' ? product.originalPrice : 0;
                        
      const salesPrice = typeof product.salesPrice === 'string' ? parseFloat(product.salesPrice) : 
                      typeof product.salesPrice === 'number' ? product.salesPrice : 
                      typeof product.price === 'number' ? product.price : 0;
      
      // ใช้ราคาขาย (salesPrice) หรือราคาปกติ (originalPrice)
      const price = salesPrice || originalPrice || product.price || 0;
      
      // แก้ไข TypeScript error โดยตรวจสอบ id และ name
      const id = (product.id || product.sku || Date.now()).toString();
      const name = product.productName || product.name || 'สินค้า';
      
      // เพิ่มสินค้าลงตะกร้าพร้อมรูปภาพที่ถูกต้องและราคา
      addToCart({ 
        ...product, 
        id,
        name,
        price: price, 
        image: productImage, 
        quantity: quantity, 
      });
      
      // แสดง Snackbar แจ้งเตือนเมื่อเพิ่มสินค้าลงตะกร้า
      setSnackbarMessage(`เพิ่ม "${name}" ลงตะกร้าแล้ว`);
      setSnackbarOpen(true);
    }
  };
  
  // ปิด Snackbar
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  // เลือกรูปภาพจากแกลเลอรี่
  const handleSelectImage = (image: string) => {
    setSelectedImage(image);
  };

  const handleNextImage = () => {
    const currentIndex = thumbnails.indexOf(selectedImage || thumbnails[0]);
    const nextIndex = (currentIndex + 1) % thumbnails.length;
    setSelectedImage(thumbnails[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = thumbnails.indexOf(selectedImage || thumbnails[0]);
    const prevIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
    setSelectedImage(thumbnails[prevIndex]);
  };

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextImage(),
    onSwipedRight: () => handlePrevImage(),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // เพิ่มฟังก์ชันแชร์บน Facebook
  const handleShareOnFacebook = () => {
    if (typeof window !== 'undefined' && product) {
      const currentUrl = window.location.href;
      
      // สร้าง URL สำหรับแชร์บน Facebook พร้อมข้อมูลเพิ่มเติม
      const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
      
      window.open(facebookShareUrl, '_blank', 'width=600,height=400');
      
      // แสดง Snackbar เมื่อกดแชร์
      setSnackbarMessage('เปิดหน้าต่างแชร์บน Facebook แล้ว');
      setSnackbarOpen(true);
    }
  };

  // แสดง Skeleton ขณะโหลดข้อมูล
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Box sx={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs skeleton */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Skeleton variant="text" width={70} height={24} />
              <Skeleton variant="text" width={10} height={24} />
              <Skeleton variant="text" width={100} height={24} />
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: { xs: 3, md: 5 },
              alignItems: { xs: 'flex-start', md: 'flex-start' },
              width: '100%'
            }}>
              <Box sx={{ width: { xs: '100%', md: '40%' }, flexShrink: 0 }}>
                <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
                <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rectangular" width={80} height={80} sx={{ borderRadius: 1 }} />
                  ))}
                </Box>
              </Box>
              <Box sx={{ 
                width: { xs: '100%', md: '60%' }, 
                pl: { md: 4 },
                ml: { md: 'auto' },
                display: 'flex',
                flexDirection: 'column',
                height: { md: '100%' }
              }}>
                {/* ส่วนชื่อและราคา skeleton */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { md: 'flex-end' },
                  borderBottom: { md: '1px solid' },
                  borderColor: { md: 'divider' },
                  pb: { md: 3 },
                  mb: { md: 3 },
                  width: '100%'
                }}>
                  <Skeleton variant="text" height={60} width="90%" sx={{ alignSelf: { md: 'flex-end' } }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { md: 'flex-end' }, width: '100%', mt: 1 }}>
                    <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: 1, alignSelf: 'flex-end' }} />
                  </Box>
                  <Skeleton 
                    variant="rectangular" 
                    height={80} 
                    width="100%" 
                    sx={{ 
                      mt: 2, 
                      borderRadius: 2 
                    }} 
                  />
                </Box>
                
                {/* ส่วนรายละเอียดและปุ่มกด skeleton */}
                <Box sx={{ mt: { xs: 0, md: 'auto' }, width: '100%' }}>
                  <Skeleton variant="text" height={24} width="100%" sx={{ mt: 3 }} />
                  <Skeleton variant="text" height={24} width="90%" sx={{ mt: 1 }} />
                  <Skeleton variant="text" height={24} width="95%" sx={{ mt: 1 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                    <Skeleton variant="text" width={60} height={40} />
                    <Skeleton variant="rectangular" width={120} height={40} sx={{ ml: 2, borderRadius: 1 }} />
                    <Skeleton variant="text" width={150} height={24} sx={{ ml: 2 }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Skeleton variant="rectangular" height={50} width="100%" sx={{ borderRadius: 1 }} />
                    <Skeleton variant="circular" height={40} width={40} />
                  </Box>
                  
                  <Skeleton variant="rectangular" height={180} width="100%" sx={{ mt: 3, borderRadius: 2 }} />
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
        <Footer />
      </Box>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Box sx={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                เกิดข้อผิดพลาด
              </Typography>
              <Typography>{error}</Typography>
              <Button 
                component={Link} 
                href="/" 
                variant="contained" 
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 3 }}
              >
                กลับไปหน้าหลัก
              </Button>
            </Paper>
          </Container>
        </Box>
        <Footer />
      </Box>
    );
  }

  // แสดงข้อความเมื่อไม่พบสินค้า
  if (!product) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Box sx={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                ไม่พบสินค้า
              </Typography>
              <Typography>
                ขออภัย ไม่พบสินค้าที่คุณกำลังค้นหา
              </Typography>
              <Button 
                component={Link} 
                href="/" 
                variant="contained" 
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 3 }}
              >
                กลับไปหน้าหลัก
              </Button>
            </Paper>
          </Container>
        </Box>
        <Footer />
      </Box>
    );
  }

  // คำนวณราคาและส่วนลด
  const originalPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : 
                        typeof product.originalPrice === 'number' ? product.originalPrice : 0;
                        
  const salesPrice = typeof product.salesPrice === 'string' ? parseFloat(product.salesPrice) : 
                    typeof product.salesPrice === 'number' ? product.salesPrice : 
                    typeof product.price === 'number' ? product.price : 0;
  
  const hasDiscount = originalPrice > 0 && salesPrice > 0 && originalPrice !== salesPrice;
  const discountPercent = hasDiscount ? Math.round((1 - salesPrice / originalPrice) * 100) : 0;

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Box sx={{ flex: 1 }}>
        <Container maxWidth={false} sx={{ 
          py: { xs: 2, md: 4 },
          px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
          maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' }, 
          mx: 'auto',
        }}>
          {/* Breadcrumbs */}
          {isMounted && (
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
              <Box 
                component={Link} 
                href="/products" 
                sx={{ 
                  textDecoration: 'none', 
                  color: theme.palette.primary.main,
                  fontFamily: theme.typography.fontFamily,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                สินค้าทั้งหมด
              </Box>
              <Typography sx={{ 
                color: theme.palette.text.secondary,
                fontFamily: theme.typography.fontFamily
              }}>
                {product.productName || product.name || 'สินค้า'}
              </Typography>
            </Breadcrumbs>
          )}
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 3, md: 5 },
          alignItems: { xs: 'center', md: 'flex-start' },
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {/* รูปภาพสินค้า - ด้านซ้าย */}
          <Box sx={{ 
            width: { xs: '100%', md: '50%' },
            mb: { xs: 3, md: 0 },
            position: 'relative',
            flexShrink: 0,
            order: { xs: 1, md: 1 }
          }}>
            <ProductImageWrapper sx={{ 
              boxShadow: 'none', 
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
              borderRadius: 2,
              position: 'relative'
            }} {...swipeHandlers}>
              <ProductImage
                src={selectedImage || getProductImagePath(product)}
                alt={product.productName || product.name || 'Product'}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              {hasDiscount && (
                <Chip 
                  label={`-${discountPercent}%`} 
                  color="primary"
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16, 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    px: 1,
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    zIndex: 5
                  }} 
                />
              )}
              
              {/* Navigation buttons for gallery - only show when there are multiple images */}
              {thumbnails.length > 1 && (
                <>
                  <GalleryNavButton
                    onClick={handlePrevImage}
                    aria-label="previous image"
                    sx={{ 
                      left: 10, 
                      top: '50%', 
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <NavigateBeforeIcon />
                  </GalleryNavButton>
                  <GalleryNavButton
                    onClick={handleNextImage}
                    aria-label="next image"
                    sx={{ 
                      right: 10, 
                      top: '50%', 
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <NavigateNextIcon />
                  </GalleryNavButton>
                </>
              )}
            </ProductImageWrapper>
            
            {/* แกลเลอรี่รูปภาพ - แสดงเฉพาะเมื่อมีรูปภาพมากกว่า 1 รูป */}
            {thumbnails.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'nowrap', 
                mt: 2, 
                gap: 2, 
                justifyContent: 'center',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                pb: 1
              }}>
                {thumbnails.map((thumb, index) => (
                  <ThumbnailWrapper 
                    key={index}
                    onClick={() => handleSelectImage(thumb)}
                    sx={{ 
                      margin: 0,
                      flexShrink: 0,
                      border: selectedImage === thumb ? '2px solid' : '1px solid rgba(0,0,0,0.06)',
                      borderColor: selectedImage === thumb ? 'primary.main' : 'rgba(0,0,0,0.06)',
                      borderRadius: 1,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      transform: selectedImage === thumb ? 'scale(1.05)' : 'scale(1)',
                      opacity: selectedImage === thumb ? 1 : 0.7,
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)',
                        borderColor: 'primary.light'
                      }
                    }}
                  >
                    <ThumbnailImage
                      src={thumb}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="80px"
                    />
                  </ThumbnailWrapper>
                ))}
              </Box>
            )}
            
            {/* Image counter indicator for mobile */}
            {thumbnails.length > 1 && (
              <Box sx={{ 
                position: 'absolute', 
                bottom: 16, 
                right: 16, 
                backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 'medium',
                display: { xs: 'block', md: 'none' }
              }}>
                {thumbnails.indexOf(selectedImage || thumbnails[0]) + 1} / {thumbnails.length}
              </Box>
            )}
          </Box>
          
          {/* รายละเอียดสินค้า - ด้านขวา */}
          <Box sx={{ 
            width: { xs: '100%', md: '50%' },
            height: { md: 'auto' },
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            order: { xs: 2, md: 2 },
            pl: { md: 3 }
          }}>
            {/* ส่วนชื่อและราคา */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              mb: { md: 3 }
            }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, mb: 2 }}>
                {/* ชื่อสินค้า */}
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    mb: { xs: 1, md: 0 },
                    mr: { md: 2 },
                    letterSpacing: '0.5px',
                    flexGrow: 1
                  }}
                >
                  {product.productName || product.name || 'สินค้า'}
                </Typography>
                
                {/* รหัสสินค้า */}
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  alignSelf: { xs: 'flex-start', md: 'center' }
                }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0.5px', fontSize: '0.8rem' }}>
                    SKU: <span style={{ fontWeight: 500 }}>{product.sku || product.id}</span>
                  </Typography>
                </Box>
              </Box>
              
              {/* ราคา */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                py: 2,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                mb: 4
              }}>
                {hasDiscount ? (
                  <>
                    <Typography 
                      variant="h4" 
                      component="span" 
                      sx={{ 
                        fontWeight: 500, 
                        color: 'black',
                        fontFamily: theme.typography.fontFamily,
                        mr: 2
                      }}
                    >
                      ฿{(salesPrice || 0).toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      component="span" 
                      sx={{ 
                        textDecoration: 'line-through', 
                        color: 'text.secondary',
                        mr: 2
                      }}
                    >
                      ฿{(originalPrice || 0).toLocaleString()}
                    </Typography>
              
                    {/* แบบที่ 2: แท็กห้อยแบบริบบิ้น (comment ไว้ เลือกใช้โดยสลับ comment กับแบบอื่น) */}
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '24px',
                        bgcolor: 'error.main',
                        color: 'white',
                        px: 1.5,
                        ml: 2,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          left: -12,
                          top: 0,
                          borderWidth: '12px 12px 12px 0',
                          borderStyle: 'solid',
                          borderColor: 'transparent',
                          borderRightColor: 'error.main'
                        }
                      }}
                    >
                      ประหยัด {discountPercent}%
                    </Box>
                  
                  </>
                ) : (
                  <Typography 
                    variant="h4" 
                    component="span" 
                    sx={{ 
                      fontWeight: 500,
                      color: 'black',
                      fontFamily: theme.typography.fontFamily
                    }}
                  >
                    ฿{((salesPrice || originalPrice || 0)).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* ส่วนรายละเอียดและปุ่มกด */}
            <Box sx={{ mt: { xs: 0, md: 'auto' } }}>
              {/* รายละเอียดสั้น */}
              <Typography variant="body1" paragraph>
                {product.productDesc || product.description || 'ไม่มีคำอธิบายสินค้า'}
              </Typography>
              
              {/* คุณสมบัติสินค้า */}
              {product.potSize && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
                    ขนาดกระถาง:
                  </Typography>
                  <Typography variant="body2" component="span">
                    {product.potSize}
                  </Typography>
                </Box>
              )}
              
              {product.plantHeight && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
                    ความสูงต้นไม้:
                  </Typography>
                  <Typography variant="body2" component="span">
                    {product.plantHeight}
                  </Typography>
                </Box>
              )}
              
              {/* ตัวเลือกจำนวน */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>จำนวน:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={handleDecreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ px: 2, minWidth: '40px', textAlign: 'center' }}>{quantity}</Typography>
                  <IconButton 
                    size="small" 
                    onClick={handleIncreaseQuantity}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  มีสินค้าในคลัง: {product.stock || 'พร้อมจัดส่ง'}
                </Typography>
              </Box>
              
              {/* ปุ่มดำเนินการ */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                    flex: 1,
                    height: '48px',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      boxShadow: '0 6px 20px rgba(0,118,255,0.39)',
                    }
                  }}
                >
                  เพิ่มลงตะกร้า
                </Button>

                <Tooltip title="แชร์บน Facebook">
                  <IconButton 
                    color="primary"
                    onClick={handleShareOnFacebook}
                    sx={{ 
                      border: '1px solid', 
                      borderColor: theme.palette.primary.main,
                      p: 1.5,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: 'rgba(0, 118, 255, 0.05)'
                      }
                    }}
                  >
                    <FacebookIcon />
                  </IconButton>
                </Tooltip>
                
                
              </Box>
              
              {/* ข้อมูลการจัดส่งและการรับประกัน */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  borderRadius: 2,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalShippingIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.subtitle1.fontWeight }}>จัดส่งฟรี</Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily }}>สำหรับคำสั่งซื้อมูลค่า 1,500 บาทขึ้นไป</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VerifiedUserIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.subtitle1.fontWeight }}>รับประกันคุณภาพ</Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily }}>รับประกันต้นไม้ 7 วัน</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PaymentIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontFamily: theme.typography.fontFamily, fontWeight: theme.typography.subtitle1.fontWeight }}>ชำระเงินปลอดภัย</Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily }}>รองรับหลายช่องทางการชำระเงิน</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        </Box>
        
        {/* แท็บข้อมูลเพิ่มเติม */}
        <Box sx={{ mt: 10, mb: 8 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              borderRadius: 2, 
              bgcolor: theme.palette.background.paper,
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="product information tabs"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              centered={!isMobile}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontFamily: theme.typography.fontFamily,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '1rem',
                  textTransform: 'none',
                  py: 2,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                }
              }}
            >
              <Tab label="รายละเอียดสินค้า" id="product-tab-0" aria-controls="product-tabpanel-0" />
              <Tab label="วิธีการดูแล" id="product-tab-1" aria-controls="product-tabpanel-1" />
              
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>รายละเอียดสินค้า</Typography>
              <Typography paragraph>
                {product.productDesc || product.description || 'ไม่มีรายละเอียดสินค้า'}
              </Typography>
              <Typography paragraph>
                ต้นไม้ชนิดนี้เป็นที่นิยมสำหรับการตกแต่งภายในบ้านและสำนักงาน เนื่องจากดูแลง่ายและช่วยเพิ่มความสดชื่นให้กับพื้นที่ ต้นไม้ชนิดนี้สามารถเจริญเติบโตได้ดีในที่ร่มหรือแสงแดดอ่อนๆ และต้องการน้ำในปริมาณปานกลาง
              </Typography>
              <Typography paragraph>
                ลักษณะเด่น:
              </Typography>
              <ul>
                <li>ใบสีเขียวสดใส ช่วยเพิ่มความสดชื่นให้กับพื้นที่</li>
                <li>ดูแลง่าย เหมาะสำหรับผู้เริ่มต้นปลูกต้นไม้</li>
                <li>ช่วยฟอกอากาศและลดมลพิษ</li>
                <li>เหมาะสำหรับวางในห้องนั่งเล่น ห้องทำงาน หรือห้องนอน</li>
              </ul>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>วิธีการดูแล</Typography>
              <Typography variant="subtitle1" gutterBottom>การรดน้ำ</Typography>
              <Typography paragraph>
                รดน้ำเมื่อดินแห้ง ประมาณ 1-2 ครั้งต่อสัปดาห์ ขึ้นอยู่กับสภาพอากาศและความชื้น ระวังอย่าให้น้ำขังในกระถาง
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>แสงแดด</Typography>
              <Typography paragraph>
                ชอบแสงแดดอ่อนๆ หรือแสงแดดกรองผ่านม่าน หลีกเลี่ยงแสงแดดจัดโดยตรง
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>อุณหภูมิ</Typography>
              <Typography paragraph>
                เจริญเติบโตได้ดีในอุณหภูมิ 18-24 องศาเซลเซียส หลีกเลี่ยงการเปลี่ยนแปลงอุณหภูมิอย่างรวดเร็ว
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>การใส่ปุ๋ย</Typography>
              <Typography paragraph>
                ใส่ปุ๋ยสำหรับไม้ใบทุก 2-3 เดือนในช่วงฤดูเติบโต (ฤดูใบไม้ผลิและฤดูร้อน)
              </Typography>
            </TabPanel>
          
          </Paper>
        </Box>
        
        {/* สินค้าแนะนำ */}
        <RelatedProducts productId={product.id} />
        </Container>
      </Box>
      
      {/* Footer */}
      <Footer />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Import ClientOnly component แบบ dynamic เพื่อป้องกัน hydration error
const ClientOnly = dynamic(() => import("@/components/ClientOnly"), { 
  ssr: false
});

// Default export หลักของหน้า
export default function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  return (
    <ClientOnly>
      <ProductDetailClient slug={resolvedParams.slug} />
    </ClientOnly>
  );
}
