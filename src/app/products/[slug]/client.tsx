"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Breadcrumbs, CircularProgress, Snackbar, Alert, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import Cart from '@/components/Cart';
import Button from '@mui/material/Button';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import RelatedProducts from '@/components/RelatedProducts';
import { useTheme } from '@mui/material/styles';
import LoadingAnimation from '@/components/LoadingAnimation';
import Head from 'next/head';

// Custom styled components
const ProductImageWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '500px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
  [theme.breakpoints.down('md')]: {
    height: '400px',
  },
  [theme.breakpoints.down('sm')]: {
    height: '300px',
  },
}));

const ThumbImage = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected?: boolean }>(({ theme, selected }) => ({
  width: '80px',
  height: '80px',
  borderRadius: '8px',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  opacity: selected ? 1 : 0.7,
  transition: 'all 0.2s ease',
  '&:hover': {
    opacity: 1,
    transform: 'translateY(-2px)',
  },
  [theme.breakpoints.down('sm')]: {
    width: '60px',
    height: '60px',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '30px',
  fontWeight: 600,
  padding: '10px 20px',
  textTransform: 'none',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  marginTop: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  backgroundColor: '#fcfcfc',
}));

interface ProductDetailClientProps {
  slug: string;
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cartItems, updateQuantity, removeItem, isCartOpen, closeCart, openCart } = useCart();
  const theme = useTheme();

  // สร้างรายการรูปภาพจำลอง (สามารถแก้ไขให้รับข้อมูลจาก API จริงได้)
  const [productImages, setProductImages] = useState<string[]>([]);
  
  // สถานะสำหรับ Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    async function fetchProductDetail() {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/products/${slug}`, {
          headers: {
            'Cache-Control': 'no-store',
          },
          next: { revalidate: 60 } // Revalidate data every 60 seconds
        });
        
        if (!res.ok) {
          const errorStatus = res.status;
          if (errorStatus === 404) {
            throw new Error('ไม่พบข้อมูลสินค้า');
          } else {
            throw new Error(`เกิดข้อผิดพลาดในการโหลดข้อมูล (${errorStatus})`);
          }
        }
        
        const data = await res.json();
        
        // แปลงชื่อและคำอธิบายสินค้าให้อยู่ในรูปแบบที่อ่านได้
        if (data.productName) {
          try {
            data.productName = decodeURIComponent(data.productName);
          } catch (decodeError) {
            console.warn('Failed to decode product name:', decodeError);
            // ใช้ข้อมูลเดิมถ้า decode ไม่ได้
          }
        }
        
        if (data.productDesc) {
          try {
            data.productDesc = decodeURIComponent(data.productDesc);
          } catch (decodeError) {
            console.warn('Failed to decode product description:', decodeError);
            // ใช้ข้อมูลเดิมถ้า decode ไม่ได้
          }
        }
        
        setProduct(data);
        
        // ดึงข้อมูลรูปภาพสินค้าจาก API ที่ได้มา
        const imagesList = [];
        
        // เริ่มด้วยรูปหลักเสมอ (ถ้ามี)
        if (data.productImg) {
          imagesList.push(data.productImg);
        }
        
        // เพิ่มรูปเพิ่มเติมจาก images array (ถ้ามี)
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          // กรองรูปที่ไม่ซ้ำกับรูปหลักออกไป
          const additionalImages = data.images
            .filter((img: any) => img && img.imageName) // ตรวจสอบว่ามีข้อมูลรูปภาพจริง
            .map((img: any) => img.imageName)
            .filter((imgName: string) => imgName !== data.productImg);
          
          imagesList.push(...additionalImages);
        }
        
        // ถ้ามีรูปอย่างน้อย 1 รูป
        if (imagesList.length > 0) {
          setProductImages(imagesList);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลสินค้าได้ โปรดลองอีกครั้งในภายหลัง');
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetail();
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      // เพิ่มสินค้าลงตะกร้าตามจำนวนที่เลือก
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      // แทนที่จะเปิด Cart ให้แสดง Snackbar แทน
      setSnackbarMessage(`เพิ่ม "${product.productName}" จำนวน ${quantity} ชิ้นในตะกร้าเรียบร้อยแล้ว`);
      setSnackbarOpen(true);
    }
  };

  // จัดการการเปลี่ยนแปลงจำนวนสินค้า
  const handleQuantityChange = (newQuantity: number) => {
    // ตรวจสอบว่าจำนวนไม่น้อยกว่า 1
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // เปลี่ยนรูปที่แสดง
  const handleImageChange = (index: number) => {
    setSelectedImageIndex(index);
  };

  // ตรวจสอบว่าสินค้ามีส่วนลดหรือไม่
  const hasDiscount = product && product.originalPrice && product.salesPrice && 
    parseFloat(String(product.originalPrice)) > parseFloat(String(product.salesPrice));

  // ฟังก์ชันคำนวณเปอร์เซ็นต์ส่วนลด
  const calculateDiscount = () => {
    if (!product || !hasDiscount) return 0;
    
    const originalPrice = parseFloat(String(product.originalPrice));
    const salesPrice = parseFloat(String(product.salesPrice));
    
    return Math.round(((originalPrice - salesPrice) / originalPrice) * 100);
  };

  // ฟังก์ชันปิด Snackbar
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // ฟังก์ชันสำหรับแชร์ไปยัง Facebook
  const handleShareToFacebook = () => {
    const productUrl = `${window.location.origin}/products/${slug}`;
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(fbShareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LoadingAnimation text="" size="medium" />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.08)'
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'ไม่พบข้อมูลสินค้า'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            โปรดลองใหม่อีกครั้ง หรือเลือกดูสินค้าอื่น
          </Typography>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/products"
            sx={{ 
              borderRadius: '30px',
              px: 3
            }}
          >
            กลับไปหน้าสินค้า
          </Button>
        </Paper>
      </Container>
    );
  }

  // หาชื่อรูปภาพที่ต้องแสดง
  const displayImage = productImages.length > 0 
    ? productImages[selectedImageIndex]
    : product.productImg;

  // สร้าง URL ของรูปภาพ
  const getImageUrl = (imageName: string | undefined, isThumbnail: boolean = false) => {
    // ถ้าไม่มีชื่อรูปภาพ ให้ใช้รูป placeholder
    if (!imageName || imageName === 'undefined' || imageName === 'null') {
      return '/images/product/og-image.jpg'; // รูป placeholder จากที่มีในโฟลเดอร์
    }
    
    // ตรวจสอบว่ารูปภาพมี path เต็มหรือเปล่า
    if (imageName.startsWith('http') || imageName.startsWith('/')) {
      return imageName;
    }

    // ตรวจสอบว่ามีรูป thumbnail หรือไม่
    if (isThumbnail) {
      return `/images/product/${imageName}`;
    }
    
    return `/images/product/${imageName}`;
  };

  // ตรวจสอบว่ารูป thumbnail มีอยู่จริงหรือไม่
  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>, img: string) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // ป้องกันการเกิด loop
    target.src = '/images/product/og-image.jpg'; // ใช้รูป placeholder เมื่อโหลดไม่สำเร็จ
  };
  
  // ฟังก์ชันจัดการเมื่อรูปหลักโหลดไม่สำเร็จ
  const handleMainImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; // ป้องกันการเกิด loop
    target.src = '/images/product/og-image.jpg'; // ใช้รูป placeholder เมื่อโหลดไม่สำเร็จ
  };

  // สร้าง Structured Data สำหรับ SEO
  const generateStructuredData = () => {
    if (!product) return null;
    
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.productName,
      image: product.productImg ? getImageUrl(product.productImg) : '',
      description: product.productDesc,
      sku: product.sku,
      offers: {
        '@type': 'Offer',
        url: `${typeof window !== 'undefined' ? window.location.href : ''}`,
        priceCurrency: 'THB',
        price: product.salesPrice || product.originalPrice,
        availability: product.stockStatus === 'พร้อมส่ง' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      }
    };
    
    return JSON.stringify(structuredData);
  };

  return (
    <>
      {product && (
        <Head>
          <title>{product.productName} | Tree Telu</title>
          <meta name="description" content={product.productDesc?.substring(0, 160) || 'รายละเอียดสินค้าจาก Tree Telu'} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: generateStructuredData() || '' }}
          />
        </Head>
      )}
      
      <Cart 
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClose={closeCart}
        isOpen={isCartOpen}
      />
      
      {/* Snackbar แจ้งเตือนเมื่อเพิ่มสินค้าในตะกร้า */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="standard"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

        <Container maxWidth={false} sx={{ 
          py: { xs: 2, sm: 3, md: 4 }, 
          px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
          maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' }, 
          mx: 'auto',
        }}>
          {/* Breadcrumbs */}
          <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: { xs: 2, sm: 3 }, display: { xs: 'none', sm: 'flex' } }}>
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
                fontFamily: theme.typography.fontFamily,
                color: theme.palette.primary.main,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              สินค้าทั้งหมด
            </Box>
              
            <Typography color="text.primary">
                {product.productName || 'รายละเอียดสินค้า'}
            </Typography>
          </Breadcrumbs>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 3, md: 4 } }}>
          {/* รูปภาพสินค้า */}
          <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 50%' }, width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* รูปหลัก */}
              <ProductImageWrapper>
                <Image
                  src={getImageUrl(displayImage)}
                  alt={product.productName || 'Product image'}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  onError={handleMainImageError}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={85}
                />
                {hasDiscount && (
                  <Chip 
                    label={`-${calculateDiscount()}%`} 
                    color="primary"
                    sx={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 16,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      px: 1
                    }}
                  />
                )}
              </ProductImageWrapper>
              
              {/* รูปย่อย (thumbnails) */}
              {productImages.length > 1 && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1.5, sm: 2 }, 
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  mt: { xs: 1.5, sm: 2 }
                }}>
                  {productImages.map((img, index) => (
                    <ThumbImage 
                      key={index} 
                      selected={index === selectedImageIndex}
                      onClick={() => handleImageChange(index)}
                    >
                      <Image
                        src={getImageUrl(img, true)}
                        alt={`${product.productName || 'Product'} - รูปที่ ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        onError={(e) => handleThumbnailError(e, img)}
                        sizes="(max-width: 768px) 60px, 80px"
                        loading="eager"
                      />
                    </ThumbImage>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* รายละเอียดสินค้า */}
          <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 50%' }, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.75rem', md: '2.25rem' } 
                }}
              >
                {product.productName}
              </Typography>
              
              {/* ปุ่มแชร์ Facebook */}
              <Tooltip title="แชร์ไปยัง Facebook" arrow>
                <IconButton 
                  onClick={handleShareToFacebook}
                  sx={{ 
                    color: '#4267B2', 
                    ml: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(66, 103, 178, 0.08)',
                    } 
                  }}
                >
                  <FacebookIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 2, mb: 3 }}>
              {hasDiscount && (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    textDecoration: 'line-through', 
                    color: 'text.disabled',
                    mr: 2,
                    fontWeight: 400
                  }}
                >
                  ฿{parseFloat(String(product.originalPrice)).toLocaleString()}
                </Typography>
              )}
              <Typography 
                variant="h4" 
                color="primary.main" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', md: '2rem' } 
                }}
              >
                ฿{parseFloat(String(product.salesPrice || product.originalPrice)).toLocaleString()}
              </Typography>
            </Box>
            
            {product.productDesc && (
              <Typography 
                variant="body1" 
                sx={{ 
                  mt: 2,
                  color: 'text.secondary',
                  lineHeight: 1.7
                }}
              >
                {product.productDesc}
              </Typography>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            {/* ตัวเลือกจำนวนสินค้า */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                จำนวน
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  size="small" 
                  onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  sx={{ 
                    p: 0.5, 
                    width: 36, 
                    height: 36,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '50%',
                    mr: 1
                  }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                
                <Box 
                  sx={{ 
                    minWidth: '60px', 
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    mx: 1
                  }}
                >
                  <Typography variant="body1" fontWeight={500}>
                    {quantity}
                  </Typography>
                </Box>
                
                <IconButton 
                  size="small" 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  sx={{ 
                    p: 0.5, 
                    width: 36, 
                    height: 36,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '50%',
                    ml: 1
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            {/* รายละเอียดเพิ่มเติม */}
            <InfoCard>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                รายละเอียดสินค้า
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {product.potSize && (
                  <Box sx={{ display: 'flex', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ width: '140px', color: 'text.secondary' }}>
                      ขนาดกระถาง:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {product.potSize}
                    </Typography>
                  </Box>
                )}
                
                {product.plantHeight && (
                  <Box sx={{ display: 'flex', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ width: '140px', color: 'text.secondary' }}>
                      ความสูงของต้นไม้:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {product.plantHeight}
                    </Typography>
                  </Box>
                )}
                
                {product.preparationTime && (
                  <Box sx={{ display: 'flex', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ width: '140px', color: 'text.secondary' }}>
                      ระยะเวลาเตรียมสินค้า:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {product.preparationTime}
                    </Typography>
                  </Box>
                )}
                
                {product.stockStatus && (
                  <Box sx={{ display: 'flex', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ width: '140px', color: 'text.secondary' }}>
                      สถานะสินค้า:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: product.stockStatus === 'พร้อมส่ง' ? 'success.main' : 'warning.main'
                      }}
                    >
                      {product.stockStatus}
                    </Typography>
                  </Box>
                )}
              </Box>
            </InfoCard>
            
            {/* ข้อมูลการจัดส่ง */}
            <Box sx={{ mt: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShippingOutlinedIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2">
                  ส่งฟรีเมื่อสั่งซื้อขั้นต่ำ 1,500 บาท
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleOutlineIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2">
                  รับประกันคุณภาพสินค้า 7 วัน
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedUserOutlinedIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2">
                  ชำระเงินปลอดภัยด้วยระบบชำระเงินออนไลน์
                </Typography>
              </Box>
            </Box>
            
            
            
            {/* ปุ่มเพิ่มสินค้าในตะกร้า */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <ActionButton 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleAddToCart}
                startIcon={<AddShoppingCartIcon />}
                fullWidth
                sx={{ 
                  py: 1.5,
                  backgroundColor: '#1D9679',
                  '&:hover': {
                    backgroundColor: '#17806A'
                  }
                }}
              >
                เพิ่มในตะกร้า
              </ActionButton>
              
              <ActionButton
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<ShoppingBagIcon />}
                fullWidth
                href="/products"
                LinkComponent={Link}
                sx={{ 
                  py: 1.5,
                  borderColor: '#1D9679',
                  color: '#1D9679',
                  '&:hover': {
                    borderColor: '#17806A',
                    backgroundColor: 'rgba(29, 150, 121, 0.04)'
                  }
                }}
              >
                เลือกซื้อสินค้าต่อ
              </ActionButton>
            </Box>
          </Box>
        </Box>

        {/* สินค้าที่เกี่ยวข้อง */}
        {product.id && (
          <RelatedProducts productId={product.id.toString()} />
        )}
      </Container>
    </>
  );
}
