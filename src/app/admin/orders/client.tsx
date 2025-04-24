'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import OrderList from './components/OrderList';
import OrderFilters from './components/OrderFilters';
import OrderDialog from './components/OrderDialog';
import { Order } from './components/OrderDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';

export default function AdminOrdersClient() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push('/');
    }
  }, [user, router]);

  // Fetch orders when page loads or filters change
  useEffect(() => {
    if (!user?.isAdmin) return;
    
    fetchOrders();
  }, [pagination.page, pagination.limit, filters, user]);

  // Function to fetch orders with current filters and pagination
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.searchTerm) queryParams.append('search', filters.searchTerm);
      
      // Fetch orders from API
      console.log('Fetching orders with params:', queryParams.toString());
      const response = await fetch(`/api/admin/orders?${queryParams.toString()}`, {
        credentials: 'include' // Include cookies in the request
      });
      
      const data = await response.json();
      console.log('API response status:', response.status, response.statusText);
      console.log('API response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
      }
      
      setOrders(data.orders);
      setPagination(data.pagination);
      setError('');
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      
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

  // Function to handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  // Function to update order status
  const handleUpdateOrderStatus = async (orderId: string, status: string, paymentStatus: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          status,
          paymentStatus
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ');
      }
      
      // Update orders list and selected order
      fetchOrders();
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.order);
      }
      
      alert('อัปเดตสถานะคำสั่งซื้อเรียบร้อย');
    } catch (err: unknown) {
      console.error('Error updating order:', err);
      // Type guard to check if err is an Error object with a message property
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to delete an order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      
      // Call the DELETE API endpoint
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ');
      }
      
      // Show success message
      setError('');
      alert('ลบคำสั่งซื้อเรียบร้อยแล้ว');
      
      // Refresh the orders list
      fetchOrders();
      
      // Clear selected order
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error deleting order:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!user.isAdmin) {
    return <Container sx={{ p: 4 }}><Typography>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
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
            ระบบจัดการคำสั่งซื้อ
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            จัดการและติดตามคำสั่งซื้อของลูกค้า
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={() => fetchOrders()}
          >
            รีเฟรช
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            พิมพ์รายงาน
          </Button>
        </Stack>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        <Box sx={{ width: { xs: '100%', lg: '25%' }, flexShrink: 0 }}>
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
              <OrderFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </Box>
          </Paper>
        </Box>
        
        <Box sx={{ width: { xs: '100%', lg: '75%' }, flexGrow: 1 }}>
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
                <OrderList 
                  orders={orders} 
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onOrderSelect={handleOrderSelect}
                  onUpdateStatus={handleUpdateOrderStatus}
                  selectedOrderId={selectedOrder?.id || null}
                />
              </Paper>
              
              <OrderDialog
                open={dialogOpen}
                order={selectedOrder}
                onClose={() => {
                  setDialogOpen(false);
                  // Optional: Keep the selected order in state or clear it
                  // setSelectedOrder(null);
                }}
                onUpdateStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
              />
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
}
