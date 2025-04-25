'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductList from './components/ProductList';
import ProductFilters from './components/ProductFilters';
import ProductDialog from './components/ProductDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  Stack,
  Snackbar,
  SnackbarOrigin
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

// Product interface based on Prisma schema
export interface Product {
  id: string;
  sku: string | null;
  productImg: string | null;
  productName: string | null;
  slug: string | null;
  productDesc: string | null;
  salesPrice: number | null;
  originalPrice: number | null;
  discount: number | null;
  potSize: string | null;
  plantHeight: string | null;
  preparationTime: string | null;
  stock: number | null;
  stockStatus: string | null;
  category: string | null;
  categoryId: number | null;
  productStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function AdminProductsClient() {
  const { user, getAuthToken } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    searchTerm: ''
  });

  // ตรวจสอบสิทธิ์ admin ด้วยการเรียก API แทนการใช้ state จาก AuthContext
  useEffect(() => {
    // ฟังก์ชันสำหรับตรวจสอบสิทธิ์
    const checkAdminStatus = async () => {
      try {
        console.log('Checking admin status via API...');
        // ใช้ token จาก AuthContext
        const token = getAuthToken();
        
        const response = await fetch('/api/admin/check-auth', {
          credentials: 'include', // ส่ง cookie ไปด้วย
          headers: {
            'Authorization': token ? `Bearer ${token}` : '' // ส่ง token ผ่าน header
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Admin status check result:', data);
          setIsAdmin(true);
          // ถ้าเป็น admin ให้โหลดข้อมูลสินค้า
          fetchProducts();
        } else {
          console.error('Not authorized as admin');
          setIsAdmin(false);
          router.push('/');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [router, getAuthToken]); // เพิ่ม getAuthToken ใน dependency

  // ปรับปรุงการโหลดข้อมูลสินค้า
  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [pagination.page, pagination.limit, filters, isAdmin]);

  // Function to fetch products with current filters and pagination
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.searchTerm) queryParams.append('search', filters.searchTerm);
      
      // ใช้ token จาก AuthContext
      const token = getAuthToken();
      
      // Fetch products from API
      console.log('Fetching products with params:', queryParams.toString());
      const response = await fetch(`/api/admin/products?${queryParams.toString()}`, {
        credentials: 'include', // Include cookies in the request
        headers: {
          'Authorization': token ? `Bearer ${token}` : '' // ส่ง token ผ่าน header
        }
      });
      
      const data = await response.json();
      console.log('API response status:', response.status, response.statusText);
      console.log('API response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
      }
      
      setProducts(data.products);
      setPagination(data.pagination);
      setError('');
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      
      // Type guard to check if err is an Error object with a message property
      if (err instanceof Error) {
        console.error('Error details:', err.message, err.stack);
        setError(err.message);
      } else {
        console.error('Unknown error type:', typeof err, err);
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Function to handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  // Function to handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsNewProduct(false);
    setDialogOpen(true);
  };

  // Function to open dialog for new product
  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    setIsNewProduct(true);
    setDialogOpen(true);
  };

  // Function to save product (create or update)
  const handleSaveProduct = async (product: Partial<Product>): Promise<Product | null> => {
    try {
      setLoading(true);
      
      const isNew = !product.id;
      const method = isNew ? 'POST' : 'PUT';
      const url = '/api/admin/products';
      
      // ใช้ token จาก AuthContext
      const token = getAuthToken();
      
      // Call the API endpoint
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '' // ส่ง token ผ่าน header
        },
        body: JSON.stringify(product),
        credentials: 'include' // Include cookies in the request
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการบันทึกสินค้า');
      }
      
      // Show success message
      setError('');
      setSnackbar({
        open: true,
        message: isNew ? 'เพิ่มสินค้าใหม่เรียบร้อย' : 'อัปเดตสินค้าเรียบร้อย',
        severity: 'success'
      });
      
      // Refresh the products list
      fetchProducts();
      
      // Close dialog
      setDialogOpen(false);
      
      // Return the saved product
      return data.product || null;
    } catch (err) {
      console.error('Error saving product:', err);
      
      if (err instanceof Error) {
        setError(err.message);
        setSnackbar({
          open: true,
          message: err.message,
          severity: 'error'
        });
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        setSnackbar({
          open: true,
          message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
          severity: 'error'
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle snackbar close
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Function to delete a product
  const handleDeleteProduct = async (productId: string) => {
    try {
      setLoading(true);
      
      // ใช้ token จาก AuthContext
      const token = getAuthToken();
      
      // Call the DELETE API endpoint
      const response = await fetch(`/api/admin/products?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '' // ส่ง token ผ่าน header
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }
      
      // Show success message
      setError('');
      setSnackbar({
        open: true,
        message: 'ลบสินค้าเรียบร้อยแล้ว',
        severity: 'success'
      });
      
      // Refresh the products list
      fetchProducts();
      
      // Close dialog
      setDialogOpen(false);
    } catch (err) {
      console.error('Error deleting product:', err);
      
      if (err instanceof Error) {
        setError(err.message);
        setSnackbar({
          open: true,
          message: err.message,
          severity: 'error'
        });
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        setSnackbar({
          open: true,
          message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }
  
  if (isAdmin === false) {
    return <Container sx={{ p: 4 }}><Typography>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 0}}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            ระบบจัดการสินค้า
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            จัดการสินค้า เพิ่ม ลบ แก้ไขข้อมูลสินค้า
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddNewProduct}
          >
            เพิ่มสินค้าใหม่
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={() => fetchProducts()}
          >
            รีเฟรช
          </Button>
        </Stack>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 3fr' }, gap: 3 }}>
        <Box>
          <Paper 
            elevation={1} 
            sx={{ 
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ 
              px: 2, 
              py: 1.5, 
              bgcolor: 'background.neutral',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h6">ตัวกรอง</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <ProductFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </Box>
          </Paper>
        </Box>
        
        <Box>
          {loading ? (
            <Paper 
              elevation={1} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 300,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CircularProgress />
            </Paper>
          ) : (
            <>
              <Paper 
                elevation={1} 
                sx={{ 
                  overflow: 'hidden', 
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <ProductList 
                  products={products} 
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onProductSelect={handleProductSelect}
                  selectedProductId={selectedProduct?.id || null}
                />
              </Paper>
              
              <ProductDialog
                open={dialogOpen}
                product={selectedProduct}
                isNewProduct={isNewProduct}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveProduct}
                onDelete={handleDeleteProduct}
              />
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
}
