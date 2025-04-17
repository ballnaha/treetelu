'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Skeleton, Divider } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { styled } from '@mui/material/styles';

// แก้ไขปัญหา TypeScript สำหรับ Grid
import { Grid as MuiGrid } from '@mui/material';
const Grid = MuiGrid as any;

// ประเภทข้อมูลสำหรับสินค้าที่เกี่ยวข้อง
interface RelatedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  imageName: string;
  originalPrice: number;
  salesPrice: number;
  hasDiscount: boolean;
  discountPercent: number;
}

interface RelatedProductsProps {
  productId: string;
}

// Styled components
const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 8,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: 'none',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  },
}));

const ProductImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingTop: '100%', // 1:1 aspect ratio
  width: '100%',
  overflow: 'hidden',
  backgroundColor: '#f7f7f7', // สีพื้นหลังรูปภาพ
}));

const ProductImage = styled(Image)(({ theme }) => ({
  objectFit: 'cover',
  objectPosition: 'center',
  transition: 'transform 0.5s ease-in-out',
  width: '100%',
  height: '100%',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const DiscountBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  left: 12,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: '4px 8px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  borderRadius: 4,
  zIndex: 2,
}));

const ProductName = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  height: '30px',
  marginBottom: theme.spacing(1),
}));

const ProductSku = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  marginBottom: 8,
}));

const PriceWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: theme.spacing(1),
}));

const OriginalPrice = styled(Typography)(({ theme }) => ({
  color: '#9e9e9e',
  textDecoration: 'line-through',
  fontSize: '0.85rem',
  letterSpacing: '0.01em',
  marginRight: theme.spacing(1),
}));

const SalesPrice = styled(Typography)(({ theme }) => ({
  color: '#1D9679',
  fontWeight: 600,
  fontSize: '1.05rem',
  letterSpacing: '0.02em',
}));

const RelatedProducts = ({ productId }: RelatedProductsProps) => {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        // ตรวจสอบว่า productId มีค่า
        if (!productId) {
          setProducts([]);
          return;
        }
        
        const response = await fetch(`/api/products/related/${productId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching related products: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch related products:', error);
        setError('ไม่สามารถโหลดข้อมูลสินค้าที่เกี่ยวข้องได้');
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchRelatedProducts();
    } else {
      setLoading(false);
    }
  }, [productId]);

  // ถ้าไม่มีสินค้าที่เกี่ยวข้องและไม่ได้กำลังโหลดอยู่ ไม่ต้องแสดงส่วนนี้
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 10, mb: 8 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
        สินค้าที่คุณอาจสนใจ
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      {loading ? (
        // แสดง Skeleton ขณะโหลดข้อมูล
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Card key={item} sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
              <Box sx={{ pt: '100%', position: 'relative', backgroundColor: '#f7f7f7' }}>
                <Skeleton
                  variant="rectangular"
                  sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </Box>
              <CardContent>
                <Skeleton variant="text" height={40} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="60%" height={30} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3 }}>
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
              <ProductCard>
                <ProductImageContainer>
                  {product.hasDiscount && (
                    <DiscountBadge>-{product.discountPercent}%</DiscountBadge>
                  )}
                  <ProductImage
                    src={`/images/product/${product.imageName}`}
                    alt={product.name}
                    fill
                    sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 20vw"
                  />
                </ProductImageContainer>
                <CardContent>
                  <ProductName variant="body1">
                    {product.name}
                  </ProductName>
                  <ProductSku>
                    SKU: {product.sku}
                  </ProductSku>
                  <PriceWrapper>
                    {product.hasDiscount && product.originalPrice !== product.salesPrice && (
                      <OriginalPrice>
                        ฿{product.originalPrice.toLocaleString()}
                      </OriginalPrice>
                    )}
                    <SalesPrice>
                      ฿{product.salesPrice.toLocaleString()}
                    </SalesPrice>
                  </PriceWrapper>
                </CardContent>
              </ProductCard>
            </Link>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RelatedProducts; 