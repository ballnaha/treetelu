'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import UpdateIcon from '@mui/icons-material/Update';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Link from 'next/link';
import OrderDetailDialog, { Order as DetailOrder } from './components/OrderDetailDialog';

// สถิติแบบจำลอง
interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: RecentOrder[];
  salesByMonth: MonthSales[];
  orderStatusDistribution: StatusData[];
  salesGrowthRate: number;
  customersGrowthRate: number;
}

// ปรับให้มีโครงสร้างเดียวกับ DetailOrder แต่ข้อมูลอาจจะน้อยกว่า
interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
  // เพิ่มฟิลด์ที่จำเป็นเพื่อให้เข้ากับ Order interface
  totalAmount?: number;
  shippingCost?: number;
  discount?: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  shippingInfo?: {
    receiverName?: string;
    receiverLastname?: string;
    receiverPhone?: string;
    addressLine?: string;
    provinceName?: string;
    amphureName?: string;
    tambonName?: string;
    zipCode?: string;
  };
  orderItems?: Array<{
    id: string;
    productName: string;
    productImg?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface MonthSales {
  month: string;
  sales: number;
}

interface StatusData {
  status: string;
  count: number;
}

// ฟังก์ชันแปลสถานะ
const translateOrderStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'PENDING': 'รอดำเนินการ',
    'PROCESSING': 'กำลังดำเนินการ',
    'PAID': 'ชำระเงินแล้ว',
    'SHIPPED': 'จัดส่งแล้ว',
    'DELIVERED': 'จัดส่งสำเร็จ',
    'CANCELLED': 'ยกเลิก'
  };
  
  return statusMap[status] || status;
};

// ฟังก์ชันรับสีตามสถานะ
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'PENDING': 'warning',
    'PROCESSING': 'info',
    'PAID': 'success',
    'SHIPPED': 'info',
    'DELIVERED': 'success',
    'CANCELLED': 'error'
  };
  
  return colorMap[status] || 'default';
};

// ฟังก์ชันจัดรูปแบบเงิน
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function AdminDashboardClient() {
  const { user, getAuthToken } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DetailOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('Checking admin status via API...');
        const token = getAuthToken();
        
        const response = await fetch('/api/admin/check-auth', {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Admin status check result:', data);
          setIsAdmin(true);
          fetchDashboardData();
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
  }, [router, getAuthToken]);
  
  // ดึงข้อมูลแดชบอร์ด
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // ใช้ API ที่สร้างขึ้น
      const token = getAuthToken();
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setStats(result.data);
        setError('');
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด');
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle view order details
  const handleViewOrderDetail = async (order: RecentOrder) => {
    try {
      // แสดง loading
      setOrderLoading(true);
      setShowOrderDetail(true); // เปิดไดอะล็อกก่อนเพื่อแสดง loading
      
      try {
        // สร้าง URL endpoint แบบไม่มี [id] ในพาธ เพื่อให้ Next.js ไม่สับสน
        const apiUrl = `/api/admin/orders?orderId=${order.id}`;
        
        // ดึงข้อมูลคำสั่งซื้อแบบเต็มจาก API
        const token = getAuthToken();
        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          // ลอง fallback ไปใช้ข้อมูลเดิมแทน
          console.warn('Could not fetch order details from API, using dashboard data instead');
          
          // สร้างข้อมูลจากข้อมูลในแดชบอร์ด
          const fallbackOrder: DetailOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: 'PENDING',
            paymentMethod: 'BANK_TRANSFER',
            totalAmount: order.amount,
            shippingCost: 0,
            discount: 0,
            finalAmount: order.amount,
            createdAt: order.date,
            updatedAt: order.date,
            customerInfo: {
              firstName: order.customerName.split(' ')[0] || '',
              lastName: order.customerName.split(' ').length > 1 ? order.customerName.split(' ').slice(1).join(' ') : '',
              email: '',
              phone: ''
            },
            shippingInfo: {
              receiverName: '',
              receiverLastname: '',
              receiverPhone: '',
              addressLine: '',
              provinceName: '',
              amphureName: '',
              tambonName: '',
              zipCode: ''
            },
            orderItems: [
              {
                id: '1',
                productName: 'ไม่สามารถโหลดข้อมูลสินค้าได้',
                productImg: '',
                quantity: 1,
                unitPrice: order.amount,
                totalPrice: order.amount
              }
            ]
          };
          
          setSelectedOrder(fallbackOrder);
          return;
        }
        
        const result = await response.json();
        
        if (result.success && (result.data || result.order)) {
          // ใช้ข้อมูลที่ได้จาก API แทน (รองรับทั้งรูปแบบ data และ order)
          setSelectedOrder(result.data || result.order);
        } else {
          throw new Error(result.message || 'ไม่พบข้อมูลคำสั่งซื้อ');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        // แสดงข้อความแจ้งเตือน
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
      }
    } finally {
      setOrderLoading(false);
    }
  };
  
  // แสดงหน้าโหลดข้อมูล
  if (isAdmin === null || (loading && !stats)) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>กำลังโหลดข้อมูล...</Typography>
        </Box>
      </Container>
    );
  }
  
  // ถ้าไม่ใช่ admin ให้แสดงข้อความ
  if (isAdmin === false) {
    return <Container sx={{ p: 4 }}><Typography>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, position: 'relative' }}>
      {/* แสดง Loading Overlay เมื่อกำลังโหลดข้อมูลและมี stats อยู่แล้ว */}
      {loading && stats && (
        <Box 
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 9999,
          }}
        >
          <Paper 
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography sx={{ mt: 2 }}>กำลังโหลดข้อมูล...</Typography>
          </Paper>
        </Box>
      )}

      {/* หัวข้อหน้า */}
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
            แดชบอร์ด
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            ภาพรวมและสถิติต่างๆ ของร้าน Tree Telu
          </Typography>
        </Box>
        
        <Button 
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
        </Button>
      </Box>
      
      {/* แสดงข้อความข้อผิดพลาด */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* ข้อมูลสรุป (Summary Cards) */}
      {stats && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4, position: 'relative' }}>
            {/* บัตรแสดงยอดคำสั่งซื้อ */}
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    right: -15, 
                    width: 80, 
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    opacity: 0.1,
                    zIndex: 0
                  }} 
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ShoppingCartIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      คำสั่งซื้อทั้งหมด
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    มี {stats.pendingOrders} คำสั่งซื้อที่รอดำเนินการ
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            {/* บัตรแสดงยอดขาย */}
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    right: -15, 
                    width: 80, 
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    opacity: 0.1,
                    zIndex: 0
                  }} 
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MonetizationOnIcon sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      ยอดขายทั้งหมด
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {formatCurrency(stats.totalSales)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {stats.salesGrowthRate >= 0 ? (
                      <>
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">
                          +{stats.salesGrowthRate}% จากเดือนที่แล้ว
                        </Typography>
                      </>
                    ) : (
                      <>
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" color="error.main">
                          {stats.salesGrowthRate}% จากเดือนที่แล้ว
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
            
            {/* บัตรแสดงจำนวนสินค้า */}
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    right: -15, 
                    width: 80, 
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'info.main',
                    opacity: 0.1,
                    zIndex: 0
                  }} 
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InventoryIcon sx={{ color: 'info.main', mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      สินค้าทั้งหมด
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    มี {stats.lowStockProducts} รายการที่ใกล้หมดสต๊อก
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            {/* บัตรแสดงจำนวนลูกค้า */}
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    right: -15, 
                    width: 80, 
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'secondary.main',
                    opacity: 0.1,
                    zIndex: 0
                  }} 
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon sx={{ color: 'secondary.main', mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      ลูกค้าทั้งหมด
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalCustomers}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {stats.customersGrowthRate >= 0 ? (
                      <>
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">
                          +{stats.customersGrowthRate}% จากเดือนที่แล้ว
                        </Typography>
                      </>
                    ) : (
                      <>
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" color="error.main">
                          {stats.customersGrowthRate}% จากเดือนที่แล้ว
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          {/* แสดงข้อมูลแถวที่ 2 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {/* คำสั่งซื้อล่าสุด */}
            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(66.66% - 12px)' } }}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <CardHeader 
                  title={
                    <Typography variant="h6" component="div">
                      คำสั่งซื้อล่าสุด
                    </Typography>
                  }
                  action={
                    <IconButton component={Link} href="/admin/orders">
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <List>
                    {stats.recentOrders.map((order, index) => (
                      <React.Fragment key={order.id}>
                        <ListItem
                          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                          secondaryAction={
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewOrderDetail(order)}
                            >
                              รายละเอียด
                            </Button>
                          }
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mb: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {order.orderNumber}
                            </Typography>
                            <Chip 
                              label={translateOrderStatus(order.status)} 
                              size="small" 
                              color={getStatusColor(order.status) as any}
                              sx={{ height: 24 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 2 }, width: '100%' }}>
                            <Typography variant="body2" component="span" color="text.secondary">
                              ลูกค้า: {order.customerName}
                            </Typography>
                            <Typography variant="body2" component="span" color="text.secondary">
                              ยอดรวม: {formatCurrency(order.amount)}
                            </Typography>
                            <Typography variant="body2" component="span" color="text.secondary">
                              วันที่: {new Date(order.date).toLocaleDateString('th-TH')}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < stats.recentOrders.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      variant="text" 
                      component={Link} 
                      href="/admin/orders"
                    >
                      ดูทั้งหมด
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            
            {/* การกระจายสถานะคำสั่งซื้อ */}
            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.33% - 12px)' } }}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <CardHeader 
                  title={
                    <Typography variant="h6" component="div">
                      สถานะคำสั่งซื้อ
                    </Typography>
                  }
                />
                <Divider />
                <CardContent>
                  <List>
                    {stats.orderStatusDistribution.map((item, index) => (
                      <ListItem key={item.status} disablePadding sx={{ py: 1 }}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" component="span">
                              {translateOrderStatus(item.status)}
                            </Typography>
                            <Typography variant="body2" component="span" fontWeight="medium">
                              {item.count}
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', mt: 1 }}>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: 4, 
                                bgcolor: 'background.neutral',
                                borderRadius: 2,
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: `${(item.count / stats.totalOrders) * 100}%`,
                                  height: '100%',
                                  bgcolor: getStatusColor(item.status) + '.main',
                                  borderRadius: 2
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          {/* แสดงข้อมูลแถวที่ 3 */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* ยอดขายรายเดือน */}
            <Box sx={{ flex: '1 1 100%' }}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  height: '100%',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <CardHeader 
                  title={
                    <Typography variant="h6" component="div">
                      ยอดขายรายเดือน
                    </Typography>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UpdateIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
                      </Typography>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                      ข้อมูลกราฟแสดงยอดขายรายเดือนจะแสดงในที่นี้
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      height: '100%',
                      mt: 2
                    }}>
                      {stats.salesByMonth.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / stats.salesByMonth.length}%` }}>
                          <Box 
                            sx={{ 
                              width: '75%', 
                              bgcolor: 'primary.main',
                              minHeight: 50,
                              borderRadius: '4px 4px 0 0',
                              height: `${(item.sales / Math.max(...stats.salesByMonth.map(i => i.sales))) * 100}%`,
                              maxHeight: '80%',
                              transition: 'height 0.3s ease',
                              '&:hover': {
                                bgcolor: 'primary.dark',
                                transform: 'translateY(-4px)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                              }
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {item.month}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}
      
      {/* Order Detail Dialog */}
      <OrderDetailDialog
        open={showOrderDetail}
        order={selectedOrder}
        onClose={() => setShowOrderDetail(false)}
        loading={orderLoading}
      />
    </Container>
  );
} 