"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Typography, styled, Container, Card, CardContent, CardActionArea } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface TreeProduct {
  id: string | number;
  productName: string;
  productDesc: string;
  imageUrl?: string;
  productImg?: string;
  price?: number;
  salesPrice?: number;
  originalPrice?: number;
  oldPrice?: number;
  slug: string;
  category?: string;
  type?: string;
}

// เพิ่มตัวเลือกสำหรับประเภทสินค้า
type ProductCategory = 'tree' | 'succulent' | 'souvenir' | 'bouquet' | 'wreath';

interface CategorySwiperProps {
  category?: ProductCategory;
  title?: string;
  subtitle?: string;
}

const CategoryTitle = styled(Typography)(({ theme }) => ({
  position: "relative",
  paddingBottom: theme.spacing(3),
  marginBottom: theme.spacing(2),
  textAlign: "left",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    transform: "none",
    width: 48,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

const CategorySubtitle = styled(Typography)(({ theme }) => ({
  textAlign: "left",
  color: theme.palette.text.secondary,
  maxWidth: "800px",
  margin: 0,
  marginBottom: theme.spacing(6),
  fontSize: "1.1rem",
  [theme.breakpoints.down('sm')]: {
    fontSize: "0.95rem"
  }
}));

const ProductCardWrapper = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  }
}));

const ProductImageWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '190px',
  overflow: 'hidden',
}));

const ProductInfoWrapper = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  backgroundColor: '#ffffff',
}));

const ProductName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: '#333333',
  fontSize: '0.95rem',
  lineHeight: 1.4,
  marginBottom: theme.spacing(0.75),
  paddingTop: theme.spacing(0.5),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  height: '42px',
  letterSpacing: '0.01em',
}));

const ProductDescription = styled(Typography)(({ theme }) => ({
  color: '#666666',
  fontSize: '0.82rem',
  lineHeight: '1.4',
  marginBottom: theme.spacing(1.25),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  height: '38px',
  letterSpacing: '0.01em',
}));

// ปรับแต่ง PriceWrapper ให้มีลักษณะเหมือนกับหมวดอื่น
const PriceWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  marginTop: theme.spacing(0.75),
  flexDirection: 'row',
  justifyContent: 'flex-start',
  gap: theme.spacing(1),
}));

const ProductOldPrice = styled(Typography)(({ theme }) => ({
  color: '#9e9e9e',
  textDecoration: 'line-through',
  fontSize: '0.85rem',
  letterSpacing: '0.1em',
  fontWeight: 400,
}));

const ProductPrice = styled(Typography)(({ theme }) => ({
  color: '#1D9679',
  fontWeight: 600,
  fontSize: '1.05rem',
  letterSpacing: '0.02em',
}));

// เพิ่มฟังก์ชันสำหรับแก้ไข URL รูปภาพให้ถูกต้อง
const getValidImageUrl = (url: string | undefined): string => {
  // ถ้าไม่มี URL หรือเป็น undefined หรือ null ให้ใช้รูปภาพตัวอย่าง
  if (!url || url === 'undefined' || url === 'null') {
    return '/images/og-image.jpg';
  }
  
  // ถ้า URL เป็น URL แบบเต็ม (https:// หรือ http://) ให้ใช้เลย
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // ถ้า URL เริ่มต้นด้วย / แล้ว
  if (url.startsWith('/')) {
    // ถ้าเป็น path ที่มี /images/ อยู่แล้ว ให้ใช้เลย
    if (url.includes('/images/')) {
      return url;
    }
    // ถ้าเป็น path ที่ขึ้นต้นด้วย / แต่ไม่มี /images/ ให้เพิ่ม /images/product
    return `/images/product${url}`;
  }
  
  // ถ้าเป็นชื่อไฟล์เฉยๆ (เช่น "11_67a1b21ddf933.png") ให้นำไปไว้ใน /images/product
  return `/images/product/${url}`;
};

// ฟังก์ชันสำหรับจัดการเมื่อรูปภาพโหลดไม่สำเร็จ
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  target.onerror = null; // ป้องกันการเกิด loop
  target.src = '/images/og-image.jpg'; // ใช้รูป default เมื่อโหลดไม่สำเร็จ
};

// เพิ่ม ViewAllLink สำหรับลิงก์ "ดูทั้งหมด"
const ViewAllLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: 500,
  marginLeft: 'auto',
  transition: 'all 0.3s ease',
  '&:hover': {
    textDecoration: 'none',
    color: theme.palette.primary.dark,
  },
}));

export default function CategorySwiper({ 
  category = 'tree', 
  title = 'ต้นไม้มงคล',
}: CategorySwiperProps) {
  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลสินค้าตามประเภทที่กำหนด
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ดึงข้อมูลโดยตรงจาก API โดยกำหนด category ตามที่ต้องการ
        const url = `/api/products?category=${category}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          // ปรับให้รองรับโครงสร้างข้อมูลใหม่ - ข้อมูลอยู่ใน property 'products'
          const productArray = data.products || [];
          
          if (productArray.length > 0) {
            // แปลงข้อมูลจาก API ให้ตรงกับโครงสร้างที่ต้องการ
            const formattedProducts = productArray.map((product: any) => {
              // ดึงประเภทย่อยจากชื่อสินค้า
              const productName = product.productName || '';
              let typePattern = category === 'tree' 
                ? /^(ต้น|ไม้|กระถาง|ดอก)[\w\s]*/
                : /^(กระบอง|แคคตัส|สวน|ซัคคู)[\w\s]*/;
              
              const typeMatch = productName.match(typePattern);
              const type = typeMatch ? typeMatch[0].trim() : '';
              
              // แก้ไข URL รูปภาพให้ถูกต้อง
              const imageUrl = product.productImg ? getValidImageUrl(product.productImg) : '/images/product/default-tree.webp';
              
              return {
                id: product.id,
                productName: product.productName || 'สินค้า',
                productDesc: product.productDesc || '',
                imageUrl: imageUrl,
                price: product.salesPrice ? parseFloat(product.salesPrice) : 0,
                oldPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
                slug: product.slug || `product-${product.id}`,
                type: type
              };
            });
            
            // จำกัดเพียง 8 ชิ้น
            setProducts(formattedProducts.slice(0, 8));
          } else {
            // ถ้าไม่มีข้อมูลให้แสดงอาร์เรย์ว่าง
            setProducts([]);
          }
        } else {
          console.error('API responded with status:', response.status);
          setProducts([]);
        }
      } catch (error) {
        console.error(`Error fetching ${category} products:`, error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography>กำลังโหลดข้อมูล...</Typography>
      </Box>
    );
  }

  // ถ้าไม่มีข้อมูลให้ไม่แสดง component
  if (!products.length) {
    return null;
  }

  return (
    <Box sx={{ py: 4, backgroundColor: '#f9f9f9' }}>
      <Container maxWidth={false} sx={{ 
        px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
        maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1400px' }, 
        mx: 'auto',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
          <CategoryTitle variant="h4">{title}</CategoryTitle>
          <ViewAllLink href={`/products?category=${category}`}>
            ดูทั้งหมด <ArrowRightAltIcon sx={{ ml: 0.5, fontSize: '1.2rem' }} />
          </ViewAllLink>
        </Box>
        
        
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={15}
          slidesPerView={2}
          navigation={false}
          pagination={false}
          autoplay={false}
          breakpoints={{
            320: {
              slidesPerView: 1.5,
            },
            640: {
              slidesPerView: 2.3,
            },
            768: {
              slidesPerView: 3.3,
            },
            1024: {
              slidesPerView: 4.5,
            },
          }}
          style={{ 
            paddingBottom: '40px',
            '--swiper-navigation-color': '#1D9679',
            '--swiper-pagination-color': '#1D9679'
          } as React.CSSProperties}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id.toString()}>
              <ProductCardWrapper>
                <CardActionArea component={Link} href={`/products/${product.slug}`}>
                  <ProductImageWrapper>
                    <Image
                      src={getValidImageUrl(product.imageUrl || product.productImg)}
                      alt={product.productName}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      onError={handleImageError}
                      unoptimized={true}
                      loading="eager"
                    />
                  </ProductImageWrapper>
                  <ProductInfoWrapper>
                    <ProductName variant="subtitle1">{product.productName}</ProductName>
                    
                    <PriceWrapper>
                      {((product.oldPrice && product.oldPrice !== product.price) || 
                        (product.originalPrice && product.originalPrice !== product.salesPrice)) && (
                        <ProductOldPrice variant="body2">
                          ฿{(product.oldPrice || product.originalPrice || 0).toLocaleString()}
                        </ProductOldPrice>
                      )}
                      <ProductPrice variant="body1">฿{(product.price || product.salesPrice || 0).toLocaleString()}</ProductPrice>
                    </PriceWrapper>
                  </ProductInfoWrapper>
                </CardActionArea>
              </ProductCardWrapper>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Box>
  );
} 