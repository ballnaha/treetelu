"use client";

import type { Product } from '../types/product';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  styled, 
  Chip
} from '@mui/material';
import { getProductImagePath } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

// Local interface for backward compatibility with existing code
interface LegacyProduct extends Product {
  name?: string;
  description?: string;
  price?: number;
}

const ProductImageWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  height: '220px',
  width: '100%',
  marginBottom: '10px',
}));

const ProductImage = styled(Image)({
  objectFit: 'cover',
  transition: 'transform 0.5s ease',
});

const DiscountBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  zIndex: 2,
}));

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-3px)',
    '& .MuiCardMedia-img': {
      transform: 'scale(1.05)',
    }
  },
}));

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Cast to LegacyProduct for backward compatibility
  const legacyProduct = product as LegacyProduct;
  
  // คำนวณราคาเดิมและราคาขาย
  const originalPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : 
                        typeof product.originalPrice === 'number' ? product.originalPrice :
                        typeof legacyProduct.price === 'number' ? legacyProduct.price : 0;
                        
  const salesPrice = typeof product.salesPrice === 'string' ? parseFloat(product.salesPrice) :
                    typeof product.salesPrice === 'number' ? product.salesPrice :
                    typeof legacyProduct.price === 'number' ? legacyProduct.price : 0;
  
  // ตรวจสอบว่ามีส่วนลดหรือไม่
  const hasDiscount = originalPrice > 0 && salesPrice > 0 && originalPrice > salesPrice;
  
  // คำนวณเปอร์เซ็นต์ส่วนลด
  const discountPercent = hasDiscount ? Math.round((1 - salesPrice / originalPrice) * 100) : 0;
  
  return (
    <StyledCard 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug || product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <ProductImageWrapper>
          <ProductImage
            src={getProductImagePath(product)}
            alt={product.productName || legacyProduct.name || 'Product'}
            width={300}
            height={220}
            priority
            style={{ 
              objectFit: "cover",
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
          {hasDiscount && discountPercent > 0 && (
            <DiscountBadge size="small" label={`-${discountPercent}%`} />
          )}
        </ProductImageWrapper>
      </Link>
      
      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Link href={`/products/${product.slug || product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography 
            variant="h6" 
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              mb: 0.2,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '25px',
              transition: 'color 0.3s',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            {product.productName || legacyProduct.name || 'Product'}
          </Typography>
        </Link>
        
        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {hasDiscount ? (
              <>
                <Typography 
                  variant="body2" 
                  sx={{ textDecoration: 'line-through', mr: 1, color: 'text.disabled' }}
                >
                  ฿{(originalPrice || 0).toLocaleString()}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">
                  ฿{(salesPrice || 0).toLocaleString()}
                </Typography>
              </>
            ) : (
              <Typography variant="body1" fontWeight={600} color="primary.main">
                ฿{(originalPrice || 0) > 0 ? (originalPrice || 0).toLocaleString() : (salesPrice || 0).toLocaleString()}
              </Typography>
            )}
          </Box>
          
        </Box>
      </CardContent>
    </StyledCard>
  );
} 