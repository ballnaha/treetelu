"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  TextField, 
  InputAdornment, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Pagination, 
  CircularProgress,
  SelectChangeEvent,
  Button,
  Breadcrumbs,
  Stack,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
import Cart from '@/components/Cart';
import LoadingAnimation from '@/components/LoadingAnimation';


// ใช้ ProductData แทน Product เพื่อหลีกเลี่ยงการชนกับ Product type ที่มีอยู่แล้ว
interface ProductData {
  id: string;
  productName?: string;
  productImg?: string;
  salesPrice?: string | number;
  originalPrice?: string | number;
  slug?: string;
  category?: string;
}

interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ฟังก์ชันสำหรับสร้าง URL ด้วยพารามิเตอร์
const createUrlWithParams = (params: Record<string, string | number | undefined>) => {
  const url = new URL('/api/products', window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
};

// สร้างฟังก์ชันแปลงชื่อหมวดหมู่เป็นภาษาไทย
const getCategoryThaiName = (englishName: string): string => {
  const categoryMapping: Record<string, string> = {
    'tree': 'ไม้มงคล',
    'succulent': 'ไม้อวบน้ำ',
    'bouquet': 'ช่อดอกไม้',
    'wreath': 'หรีดต้นไม้',
    'souvenir': 'ของชำร่วย',
    'basket': 'ตะกร้าผลไม้'
    // เพิ่มการแปลชื่อหมวดหมู่อื่นๆ ตามต้องการ
  };
  
  return categoryMapping[englishName] || englishName;
};

// สร้างคอมโพเนนต์สำหรับแสดงเนื้อหาหลังจาก hydration เสร็จสิ้น
const ProductsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  
  // State สำหรับข้อมูลและการกรอง
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20
  });
  
  // State สำหรับการกรอง
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  
  // State สำหรับหมวดหมู่
  const [categories, setCategories] = useState<string[]>([]);
  
  // โหลดข้อมูลสินค้า
  const fetchProducts = async () => {
    setLoading(true);
    
    try {
      const params = {
        category,
        search: searchQuery,
        sortBy,
        page,
        pageSize: 20
      };
      
      const url = createUrlWithParams(params);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || {
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 20
      });
      
      // อัปเดต URL
      const queryParams = new URLSearchParams();
      if (category) queryParams.set('category', category);
      if (searchQuery) queryParams.set('search', searchQuery);
      if (sortBy) queryParams.set('sortBy', sortBy);
      if (page > 1) queryParams.set('page', page.toString());
      
      const newUrl = `/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
      
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // โหลดข้อมูลหมวดหมู่
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      
      // แปลงข้อมูลหมวดหมู่เป็นรายการชื่อหมวดหมู่
      const categoryNames = data
        .filter((cat: any) => cat.categoryName)
        .map((cat: any) => cat.categoryName);
      
      setCategories(categoryNames);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // โหลดข้อมูลเมื่อคอมโพเนนต์ถูกโหลดหรือพารามิเตอร์เปลี่ยน
  useEffect(() => {
    fetchProducts();
  }, [category, sortBy, page]);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // จัดการการเปลี่ยนหน้า
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // จัดการการเปลี่ยนการจัดเรียง
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };
  
  // จัดการการเปลี่ยนหมวดหมู่
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setPage(1); // รีเซ็ตหน้ากลับไปหน้าแรกเมื่อเปลี่ยนหมวดหมู่
  };
  
  // จัดการการค้นหา
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1); // รีเซ็ตหน้ากลับไปหน้าแรกเมื่อค้นหา
    fetchProducts();
  };
  
  return (
    <Container maxWidth={false} sx={{ 
      py: 0, 
      px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
      maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' }, 
      mx: 'auto',
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
          สินค้าทั้งหมด
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ mb: 6 }}>
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
          สินค้าทั้งหมด
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        ดูสินค้าทั้งหมดของเรา สามารถค้นหาหรือกรองตามหมวดหมู่ที่คุณต้องการได้
        </Typography>
        
        {/* ตัวกรองและค้นหา */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2, 
          mb: 6,
          alignItems: 'flex-end',
        }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ 
              width: '100%',
              mb: 3 
            }}
          >
            {/* หมวดหมู่ */}
            <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flexGrow: { xs: 1, md: 0 } }}>
              <InputLabel id="category-select-label">หมวดหมู่</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={category}
                label="หมวดหมู่"
                onChange={handleCategoryChange}
                MenuProps={{
                  disableScrollLock: true,
                  transitionDuration: 0
                }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {getCategoryThaiName(cat)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* จัดเรียงตาม */}
            <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flexGrow: { xs: 1, md: 0 } }}>
              <InputLabel id="sort-select-label">จัดเรียงตาม</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortBy}
                label="จัดเรียงตาม"
                onChange={handleSortChange}
                MenuProps={{
                  disableScrollLock: true,
                  transitionDuration: 0
                }}
              >
                <MenuItem value="newest">ล่าสุด</MenuItem>
                <MenuItem value="price_low">ราคา: ต่ำ-สูง</MenuItem>
                <MenuItem value="price_high">ราคา: สูง-ต่ำ</MenuItem>
              </Select>
            </FormControl>

            {/* ช่องค้นหา */}
            <form 
              onSubmit={handleSearch} 
              style={{ 
                display: 'flex', 
                width: '100%'
              }}
            >
              <TextField 
                fullWidth
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    height: { md: '56px' }, // ปรับความสูงให้เท่ากับ Select ใน desktop
                    '& fieldset': {
                      height: { md: '56px' }, // ปรับความสูงของ border ให้เท่ากับ Select
                    }
                  },
                  '& .MuiInputBase-input': {
                    height: { md: '23px' }, // ปรับความสูงของ input ให้อยู่กึ่งกลาง
                    padding: { md: '16.5px 14px' } // ปรับ padding ให้เหมาะสม
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        type="submit"
                        sx={{ 
                          height: { xs: 40, md: '54px' },
                          width: 40,
                          marginRight: '-14px',
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: 'transparent'
                          }
                        }}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Stack>
        </Box>
      </Box>
      
      {/* ตัวแสดงการโหลด */}
      {loading && (
        <Box sx={{ py: 8 }}>
          <LoadingAnimation text="" size="medium" fullHeight={false} />
        </Box>
      )}
      
      {/* แสดงข้อผิดพลาด */}
      {error && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => fetchProducts()}
          >
            ลองใหม่
          </Button>
        </Box>
      )}
      
      {/* แสดงสินค้า */}
      {!loading && !error && products.length > 0 && (
        <>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography variant="body2" color="text.secondary">
              แสดง {products.length} จาก {pagination.totalCount} รายการ
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            mx: -1.5, 
          }}>
            {products.map((product) => (
              <Box key={product.id} sx={{ 
                width: { 
                  xs: '50%', 
                  sm: '50%',
                  md: '33.33%',
                  lg: '25%'
                }, 
                p: 1.5 
              }}>
                <ProductCard product={product} />
              </Box>
            ))}
          </Box>
          
          {/* การแบ่งหน้า */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination 
                count={pagination.totalPages} 
                page={pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
      
      {/* กรณีไม่พบสินค้า */}
      {!loading && !error && products.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary">
            ไม่พบสินค้าที่คุณค้นหา
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
            ลองปรับเปลี่ยนตัวกรองหรือคำค้นหาของคุณ
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setSearchQuery('');
              setCategory('');
              setSortBy('newest');
              setPage(1);
            }}
          >
            ดูสินค้าทั้งหมด
          </Button>
        </Box>
      )}
    </Container>
  );
};

// คอมโพเนนต์หลัก
export default function ProductsClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Box sx={{ flex: 1 }}>
        <ProductsContent />
      </Box>
     
    </Box>
  );
} 