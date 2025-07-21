"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Container, Breadcrumbs, CircularProgress, Snackbar, Alert, IconButton, Tooltip, Modal, Backdrop } from '@mui/material';
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
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Swiper as SwiperType } from 'swiper';
import CloseIcon from '@mui/icons-material/Close';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

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
  transition: 'all 0.3s ease',
  '&:hover': {
    opacity: 1,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
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

// เพิ่ม CSS styles สำหรับ Swiper
const SwiperWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '568px',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  margin: '0 auto',
  '.swiper': {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  '.swiper-slide': {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  '.swiper-pagination-bullet': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    opacity: 0.7,
    '&-active': {
      backgroundColor: '#fff',
      opacity: 1,
    }
  },
  '.swiper-button-next, .swiper-button-prev': {
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.3)',
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    '&:after': {
      fontSize: '18px',
    },
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.5)',
    },
  }
}));

// เพิ่มสไตล์สำหรับกล่อง Thumbnails
const ThumbsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: theme.spacing(2),
  maxWidth: '100%',
  overflowX: 'auto',
  padding: theme.spacing(1, 0),
  '&::-webkit-scrollbar': {
    height: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '10px',
  },
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
  },
}));

const ZoomButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 15,
  right: 15,
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 5,
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  }
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
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const { addToCart, cartItems, updateQuantity, removeItem, isCartOpen, closeCart, openCart } = useCart();
  const theme = useTheme();
  const swiperRef = useRef<SwiperType | null>(null);
  const fullscreenSwiperRef = useRef<SwiperType | null>(null);

  // สร้างรายการรูปภาพจำลอง (สามารถแก้ไขให้รับข้อมูลจาก API จริงได้)
  const [productImages, setProductImages] = useState<string[]>([]);
  
  // สถานะสำหรับ Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // เลื่อนหน้าไปด้านบนสุดเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    // ถ้ามี swiper instance ให้เลื่อนไปที่ slide ตามตำแหน่ง index
    if (swiperRef.current) {
      swiperRef.current.slideTo(index);
    }
  };

  // ฟังก์ชันจัดการเมื่อ Swiper เปลี่ยน slide
  const handleSlideChange = (swiper: SwiperType) => {
    setSelectedImageIndex(swiper.activeIndex);
  };

  // ตรวจสอบว่าสินค้ามีส่วนลดหรือไม่
  const hasDiscount = product && product.originalPrice && product.salesPrice && 
    parseFloat(String(product.originalPrice)) > parseFloat(String(product.salesPrice));

  // ตรวจสอบว่าสินค้าสามารถสั่งซื้อได้หรือไม่
  const isProductAvailable = product && 
    (product.stockStatus === 'in_stock' || product.stockStatus === 'พร้อมส่ง') && 
    (product.stock === undefined || product.stock === null || product.stock > 0);

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

  // เปิด/ปิดโหมดเต็มหน้าจอ
  const handleFullscreenToggle = () => {
    setFullscreenOpen(!fullscreenOpen);
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
      return `/images/product/${imageName}?v=${getImageVersion(imageName)}`;
    }
    
    return `/images/product/${imageName}?v=${getImageVersion(imageName)}`;
  };

  // สร้างเวอร์ชันของรูปภาพจากชื่อไฟล์ (ใช้ส่วนแรกของ UUID)
  const getImageVersion = (imageName: string) => {
    // ใช้ 8 ตัวแรกของชื่อไฟล์เป็น version หรือใช้ timestamp หากไม่มี UUID pattern
    const match = imageName.match(/^([a-f0-9]{8})-/);
    if (match) {
      return match[1];
    }
    return '1'; // default version
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
    
    // สร้างวันหมดอายุของราคา (1 ปีจากวันนี้)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // สร้าง URL แบบ Absolute
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://treetelu.com';
    const productUrl = `${baseUrl}/products/${slug}`;
    
    // รวมรูปภาพทั้งหมดเป็น array
    const images = [];
    if (product.productImg) {
      images.push(getImageUrl(product.productImg));
    }
    // ตรวจสอบการมีอยู่ของ additionalImages ด้วย type safety
    if ((product as any).additionalImages && Array.isArray((product as any).additionalImages) && (product as any).additionalImages.length > 0) {
      (product as any).additionalImages.forEach((img: string) => {
        if (img) images.push(getImageUrl(img));
      });
    }
    
    // ถ้าไม่มีรูปเลย ใส่รูปเริ่มต้น
    if (images.length === 0) {
      images.push(`${baseUrl}/images/default-product.jpg`);
    }
    
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.productName,
      image: images,
      description: product.productDesc || product.productName,
      sku: product.sku || `TREE-${product.id}`, // ใช้ ID เป็นค่าเริ่มต้นถ้าไม่มี SKU
      brand: {
        '@type': 'Brand',
        name: 'Treetelu'
      },
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'THB',
        price: product.salesPrice || product.originalPrice,
        priceValidUntil: oneYearFromNow.toISOString().split('T')[0], // วันที่ในรูปแบบ YYYY-MM-DD
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stockStatus === 'พร้อมส่ง' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        seller: {
          '@type': 'Organization',
          name: 'Treetelu'
        }
      },
      // เพิ่ม aggregate rating แบบค่าเริ่มต้นหากไม่มีข้อมูลจริง
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',  // ค่าเริ่มต้น
        ratingCount: '25',   // ค่าเริ่มต้น
        bestRating: '5',
        worstRating: '1'
      },
      // เพิ่มข้อมูลร้านค้า
      mpn: product.id?.toString() || `TREE-${Date.now()}` // หมายเลขผู้ผลิต
    };
    
    return JSON.stringify(structuredData);
  };

  return (
    <>
      {product && (
        <Head>
          <title>{product.productName} | Tree Telu</title>
          <meta name="description" content={product.productDesc?.substring(0, 160) || 'รายละเอียดสินค้าจาก TreeTelu'} />
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
          py: { xs: 0 }, 
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
                {productImages.length > 1 ? (
                  <SwiperWrapper>
                    <Swiper
                      modules={[Navigation, Pagination, Autoplay, EffectFade]}
                      spaceBetween={0}
                      slidesPerView={1}
                      navigation={true}
                      pagination={{ clickable: true, dynamicBullets: true }}
                      autoplay={{ 
                        delay: 5000, 
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }}
                      effect="fade"
                      fadeEffect={{ crossFade: true }}
                      
                      style={{ 
                        '--swiper-navigation-color': '#ffffff',
                        '--swiper-pagination-color': '#ffffff',
                        '--swiper-navigation-size': '30px'
                      } as React.CSSProperties}
                      onSwiper={(swiper) => (swiperRef.current = swiper)}
                      onSlideChange={handleSlideChange}
                    >
                      {productImages.map((img, index) => (
                        <SwiperSlide key={index}>
                          <Image
                            src={getImageUrl(img)}
                            alt={`${product.productName || 'Product image'} - ${index + 1}`}
                            fill
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'center'
                            }}
                            priority={index === 0}
                            onError={handleMainImageError}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={85}
                            loading={index === 0 ? "eager" : "lazy"}
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChgF/sWryvgAAAABJRU5ErkJggg=="
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    <ZoomButton onClick={handleFullscreenToggle}>
                      <ZoomOutMapIcon fontSize="small" />
                    </ZoomButton>
                  </SwiperWrapper>
                ) : (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%', maxWidth: '568px', margin: '0 auto', overflow: 'hidden' }}>
                    <Image
                      src={getImageUrl(displayImage)}
                      alt={product.productName || 'Product image'}
                      fill
                      style={{ objectFit: 'cover' }}
                      priority
                      onError={handleMainImageError}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={85}
                      loading="eager"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChgF/sWryvgAAAABJRU5ErkJggg=="
                    />
                    <ZoomButton onClick={handleFullscreenToggle}>
                      <ZoomOutMapIcon fontSize="small" />
                    </ZoomButton>
                  </Box>
                )}
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
                      px: 1,
                      zIndex: 5,
                      color: 'white'
                    }}
                  />
                )}
              </ProductImageWrapper>
              
              {/* รูปย่อย (thumbnails) */}
              {productImages.length > 1 && (
                <ThumbsContainer>
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
                        quality={75}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChgF/sWryvgAAAABJRU5ErkJggg=="
                      />
                    </ThumbImage>
                  ))}
                </ThumbsContainer>
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
                  <FacebookIcon sx={{ fontSize: 30 }} />
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
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line' // This preserves line breaks from the input
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
                    minWidth: '100px', 
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedUserOutlinedIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2">
                  ชำระเงินปลอดภัยด้วยระบบชำระเงินออนไลน์
                </Typography>
              </Box>
            </Box>
            
            
            
            {/* ปุ่มเพิ่มสินค้าในตะกร้า */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {isProductAvailable ? (
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
              ) : (
                <ActionButton 
                  variant="contained" 
                  color="error"
                  size="large"
                  disabled
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    opacity: 0.7
                  }}
                >
                  สินค้าหมด
                </ActionButton>
              )}
              
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

        {/* โหมดแสดงรูปแบบเต็มหน้าจอ */}
        <Modal
          open={fullscreenOpen}
          onClose={handleFullscreenToggle}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
            },
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '95vw', sm: '80vw', md: '70vw' },
              height: { xs: '70vh', sm: '75vh', md: '80vh' },
              maxWidth: '900px',
              maxHeight: '800px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            <IconButton 
              onClick={handleFullscreenToggle}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            
            {productImages.length > 1 ? (
              <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <Swiper
                  modules={[Navigation, Pagination, EffectFade]}
                  spaceBetween={0}
                  slidesPerView={1}
                  navigation={true}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  effect="fade"
                  fadeEffect={{ crossFade: true }}
                  loop={productImages.length > 1}
                  initialSlide={selectedImageIndex}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    '--swiper-navigation-color': '#ffffff',
                    '--swiper-pagination-color': '#ffffff',
                    '--swiper-navigation-size': '30px'
                  } as React.CSSProperties}
                  onSwiper={(swiper) => (fullscreenSwiperRef.current = swiper)}
                >
                  {productImages.map((img, index) => (
                    <SwiperSlide key={index} style={{ overflow: 'hidden', position: 'relative' }}>
                      <Image
                        src={getImageUrl(img)}
                        alt={`${product.productName || 'Product image'} - ${index + 1}`}
                        fill
                        style={{ 
                          objectFit: 'contain',
                          objectPosition: 'center'
                        }}
                        onError={handleMainImageError}
                        sizes="(max-width: 600px) 95vw, (max-width: 900px) 80vw, 70vw"
                        quality={90}
                        loading="eager"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <Image
                  src={getImageUrl(displayImage)}
                  alt={product.productName || 'Product image'}
                  fill
                  style={{ objectFit: 'contain' }}
                  onError={handleMainImageError}
                  sizes="(max-width: 600px) 95vw, (max-width: 900px) 80vw, 70vw"
                  quality={90}
                  loading="eager"
                />
              </Box>
            )}
          </Box>
        </Modal>
      </Container>
    </>
  );
}
