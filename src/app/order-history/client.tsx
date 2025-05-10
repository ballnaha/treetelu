'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { formatThaiDate } from '@/utils/dateUtils';
import Link from 'next/link';
import Image from 'next/image';

// ประเภทข้อมูลสำหรับคำสั่งซื้อ
interface OrderItem {
  id: string;
  productName: string;
  productImg: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingInfo {
  receiverName: string;
  receiverLastname: string;
  receiverPhone: string;
  addressLine: string;
  addressLine2?: string;
  provinceName: string;
  amphureName: string;
  tambonName: string;
  zipCode: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  shippingCost: number;
  discount: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
  adminComment?: string;
  customerInfo: CustomerInfo;
  shippingInfo: ShippingInfo;
  orderItems: OrderItem[];
  paymentInfo?: {
    slipUrl?: string;
  };
  paymentConfirmations?: {
    slipUrl: string;
    createdAt: string;
  }[];
}

// แปลสถานะเป็นภาษาไทย
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

// แปลสถานะการชำระเงินเป็นภาษาไทย
const translatePaymentStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'PENDING': 'รอชำระเงิน',
    'CONFIRMED': 'ยืนยันแล้ว',
    'REJECTED': 'ปฏิเสธ'
  };
  
  return statusMap[status] || status;
};

// แปลวิธีการชำระเงินเป็นภาษาไทย
const translatePaymentMethod = (method: string) => {
  const methodMap: Record<string, string> = {
    'BANK_TRANSFER': 'โอนเงินผ่านธนาคาร',
    'CREDIT_CARD': 'บัตรเครดิต',
    'PROMPTPAY': 'พร้อมเพย์',
    'COD': 'เก็บเงินปลายทาง'
  };
  
  return methodMap[method] || method;
};

// รหัสสีสำหรับสถานะต่างๆ
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

const getPaymentStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'PENDING': 'warning',
    'CONFIRMED': 'success',
    'REJECTED': 'error'
  };
  
  return colorMap[status] || 'default';
};

// รายการสถานะออเดอร์
const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รอดำเนินการ' },
  { value: 'PROCESSING', label: 'กำลังดำเนินการ' },
  { value: 'PAID', label: 'ชำระเงินแล้ว' },
  { value: 'SHIPPED', label: 'จัดส่งแล้ว' },
  { value: 'DELIVERED', label: 'จัดส่งสำเร็จ' },
  { value: 'CANCELLED', label: 'ยกเลิก' }
];

// รายการสถานะการชำระเงิน
const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รอชำระเงิน' },
  { value: 'CONFIRMED', label: 'ยืนยันแล้ว' },
  { value: 'REJECTED', label: 'ปฏิเสธ' }
];

export default function OrderHistoryClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // สถานะต่างๆ
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentImage, setPaymentImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // เพิ่ม theme และ isMobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // สถานะตัวกรอง
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  // สถานะการแบ่งหน้า
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 0
  });
  
  // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่ ถ้าไม่ล็อกอินให้เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // ดึงข้อมูลคำสั่งซื้อเมื่อหน้าโหลด หรือเมื่อมีการเปลี่ยนหน้า หรือเมื่อมีการเปลี่ยนตัวกรอง
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, pagination.page, filters]);
  
  // ฟังก์ชันสำหรับดึงข้อมูลคำสั่งซื้อ
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // สร้าง query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      // เพิ่ม query parameters สำหรับตัวกรอง
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.search) queryParams.append('search', filters.search);
      
      // เรียกใช้ API
      const response = await fetch(`/api/orders/user-orders?${queryParams.toString()}`, {
        credentials: 'include' // รวม cookies ในการร้องขอ
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
      }
      
      // อัปเดตข้อมูล
      setOrders(data.orders);
      setPagination(data.pagination);
      setError('');
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };
  
  // ฟังก์ชันสำหรับเลือกคำสั่งซื้อที่ต้องการดูรายละเอียด
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    
    // ค้นหารูปหลักฐานการชำระเงิน
    const slipUrl = order.paymentInfo?.slipUrl || 
                   (order.paymentConfirmations && order.paymentConfirmations.length > 0 ? 
                     order.paymentConfirmations[0].slipUrl : null);
    setPaymentImage(slipUrl || null);
    
    setShowOrderDetail(true);
  };
  
  // ฟังก์ชันสำหรับเปลี่ยนแปลงค่าตัวกรอง
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // เมื่อเปลี่ยนตัวกรอง ให้กลับไปหน้าแรก
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // ฟังก์ชันสำหรับรีเซ็ตตัวกรอง
  const handleResetFilters = () => {
    setFilters({
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // แสดงข้อความกำลังโหลดหากกำลังตรวจสอบการล็อกอิน
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // ถ้ายังไม่ได้ล็อกอิน ไม่แสดงอะไร (จะเปลี่ยนเส้นทางด้วย useEffect)
  if (!user) {
    return null;
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* หัวข้อหน้า */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            ประวัติการสั่งซื้อ
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ดูรายการคำสั่งซื้อและติดตามสถานะการจัดส่งของคุณ
          </Typography>
        </Box>
        
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          sx={{ minWidth: 120 }}
        >
          {showFilterPanel ? 'ซ่อนตัวกรอง' : 'กรองข้อมูล'}
        </Button>
      </Box>
      
      {/* พาเนลตัวกรอง */}
      {showFilterPanel && (
        <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>ตัวกรองข้อมูล</Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel id="status-select-label">สถานะคำสั่งซื้อ</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="status-select"
                  name="status"
                  value={filters.status}
                  label="สถานะคำสั่งซื้อ"
                  onChange={handleFilterChange}
                >
                  {ORDER_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel id="payment-status-select-label">สถานะการชำระเงิน</InputLabel>
                <Select
                  labelId="payment-status-select-label"
                  id="payment-status-select"
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  label="สถานะการชำระเงิน"
                  onChange={handleFilterChange}
                >
                  {PAYMENT_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box>
              <TextField
                fullWidth
                id="date-from"
                name="dateFrom"
                label="ตั้งแต่วันที่"
                type="date"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                id="date-to"
                name="dateTo"
                label="ถึงวันที่"
                type="date"
                value={filters.dateTo}
                onChange={handleFilterChange}
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            
            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 4' } }}>
              <TextField
                fullWidth
                id="search"
                name="search"
                label="ค้นหา (เลขคำสั่งซื้อ)"
                type="text"
                value={filters.search}
                onChange={handleFilterChange}
                size="small"
                placeholder="ระบุเลขคำสั่งซื้อที่ต้องการค้นหา"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  endAdornment: filters.search ? (
                    <IconButton
                      size="small"
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={handleResetFilters}
              sx={{ mr: 1 }}
            >
              ล้างตัวกรอง
            </Button>
            <Button 
              variant="contained" 
              onClick={fetchOrders}
            >
              ค้นหา
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* แสดงข้อความข้อผิดพลาด */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* แสดงข้อความเมื่อไม่มีคำสั่งซื้อ */}
      {!loading && orders.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>ไม่พบประวัติการสั่งซื้อ</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {Object.values(filters).some(v => v !== '') 
              ? 'ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา ลองเปลี่ยนตัวกรองและค้นหาอีกครั้ง'
              : 'คุณยังไม่มีคำสั่งซื้อ ลองเลือกดูสินค้าของเราและเริ่มช้อปปิ้งเลย'}
          </Typography>
          {!Object.values(filters).some(v => v !== '') && (
            <Button variant="contained" component={Link} href="/products">
              ดูสินค้าทั้งหมด
            </Button>
          )}
        </Paper>
      )}
      
      {/* แสดงรายการคำสั่งซื้อ */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        orders.length > 0 && (
          <Box>
            {isMobile ? (
              /* Mobile View - Card Layout */
              <Stack spacing={2}>
                {orders.map((order) => (
                  <Card 
                    key={order.id} 
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: 1
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            #{order.orderNumber}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary">
                            {order.createdAt ? formatThaiDate(new Date(order.createdAt)) : '-'}
                          </Typography>
                        </Stack>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        {/* เพิ่มส่วนแสดงชื่อ-นามสกุลลูกค้า */}
                        {order.customerInfo && (
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              ชื่อผู้สั่งซื้อ:
                            </Typography>
                            <Typography variant="body2">
                              {order.customerInfo.firstName} {order.customerInfo.lastName}
                            </Typography>
                          </Stack>
                        )}
                        
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            ยอดรวม:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            ฿{order.finalAmount.toLocaleString()}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                          <Chip 
                            size="small" 
                            label={translateOrderStatus(order.status)} 
                            color={getStatusColor(order.status) as any}
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            size="small" 
                            label={translatePaymentStatus(order.paymentStatus)} 
                            color={getPaymentStatusColor(order.paymentStatus) as any}
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Stack>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => handleOrderSelect(order)}
                          >
                            ดูรายละเอียด
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              /* Desktop View - Table Layout */
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'background.neutral' }}>
                    <TableRow>
                      <TableCell>หมายเลขคำสั่งซื้อ</TableCell>
                      <TableCell>วันที่สั่งซื้อ</TableCell>
                      <TableCell>ชื่อผู้สั่งซื้อ</TableCell>
                      <TableCell>ยอดรวม</TableCell>
                      <TableCell>สถานะ</TableCell>
                      <TableCell>การชำระเงิน</TableCell>
                      <TableCell align="center">การดำเนินการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {order.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.createdAt ? formatThaiDate(new Date(order.createdAt)) : '-'}
                        </TableCell>
                        <TableCell>
                          {order.customerInfo ? 
                            `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 
                            '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            ฿{order.finalAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={translateOrderStatus(order.status)} 
                            color={getStatusColor(order.status) as any}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={translatePaymentStatus(order.paymentStatus)} 
                            color={getPaymentStatusColor(order.paymentStatus) as any}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => handleOrderSelect(order)}
                            >
                              ดูรายละเอียด
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {/* การแบ่งหน้า */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination 
                  count={pagination.totalPages} 
                  page={pagination.page} 
                  onChange={handlePageChange} 
                  color="primary" 
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            )}
          </Box>
        )
      )}
      
      {/* Modal แสดงรายละเอียดคำสั่งซื้อ */}
      <Dialog
        open={showOrderDetail}
        onClose={() => setShowOrderDetail(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: 'background.neutral',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              รายละเอียดคำสั่งซื้อ #{selectedOrder.orderNumber}
              <IconButton onClick={() => setShowOrderDetail(false)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 3 }}>
              <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">
                  วันที่สั่งซื้อ: {formatThaiDate(new Date(selectedOrder.createdAt))}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={translateOrderStatus(selectedOrder.status)} 
                    color={getStatusColor(selectedOrder.status) as any}
                  />
                  <Chip 
                    size="small" 
                    label={translatePaymentStatus(selectedOrder.paymentStatus)} 
                    color={getPaymentStatusColor(selectedOrder.paymentStatus) as any}
                  />
                </Box>
              </Box>
              
              {/* แสดงข้อความจากแอดมิน (ถ้ามี) */}
              {selectedOrder.adminComment && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'primary.main',
                    bgcolor: 'primary.lighter'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="primary.dark" sx={{ mb: 1 }}>
                    ข้อความจากทีมงาน
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {selectedOrder.adminComment}
                  </Typography>
                </Paper>
              )}

              {/* รายการสินค้า */}
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                รายการสินค้า
              </Typography>


              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.neutral' }}>
                      <TableCell>สินค้า</TableCell>
                      <TableCell align="right">ราคาต่อหน่วย</TableCell>
                      <TableCell align="right">จำนวน</TableCell>
                      <TableCell align="right">รวม</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.productImg && (
                              <Box 
                                component="img" 
                                src={`${item.productImg}`} 
                                alt={item.productName}
                                sx={{ width: 40, height: 40, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/40';
                                }}
                              />
                            )}
                            <Typography variant="body2">{item.productName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">฿{(item.unitPrice || 0).toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{item.quantity}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>฿{(item.totalPrice || 0).toLocaleString()}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* สรุปราคา */}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="body2">รวมค่าสินค้า:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">฿{(selectedOrder.totalAmount || 0).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="body2">ค่าจัดส่ง:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">฿{(selectedOrder.shippingCost || 0).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                    {selectedOrder.discount > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="body2">ส่วนลด:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">-฿{(selectedOrder.discount || 0).toLocaleString()}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">ยอดรวมทั้งสิ้น:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700}>฿{(selectedOrder.finalAmount || 0).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* ข้อมูลการจัดส่ง */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    ข้อมูลการจัดส่ง
                  </Typography>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {selectedOrder.shippingInfo && (
                        <>
                          <Box>
                            <Typography variant="caption" color="text.secondary">ผู้รับ</Typography>
                            <Typography variant="body2">{selectedOrder.shippingInfo.receiverName || ''} {selectedOrder.shippingInfo.receiverLastname || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">เบอร์โทรศัพท์</Typography>
                            <Typography variant="body2">{selectedOrder.shippingInfo.receiverPhone || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">ที่อยู่</Typography>
                            <Typography variant="body2">
                              {selectedOrder.shippingInfo.addressLine || ''}
                              {selectedOrder.shippingInfo.addressLine2 && `, ${selectedOrder.shippingInfo.addressLine2}`}, 
                              ต.{selectedOrder.shippingInfo.tambonName}, 
                              อ.{selectedOrder.shippingInfo.amphureName}, 
                              จ.{selectedOrder.shippingInfo.provinceName}, 
                              {selectedOrder.shippingInfo.zipCode}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Box>
                
                {/* ข้อมูลการชำระเงิน */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    ข้อมูลการชำระเงิน
                  </Typography>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">วิธีการชำระเงิน</Typography>
                        <Typography variant="body2">{translatePaymentMethod(selectedOrder.paymentMethod)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">สถานะการชำระเงิน</Typography>
                        <Typography variant="body2">{translatePaymentStatus(selectedOrder.paymentStatus)}</Typography>
                      </Box>
                      
                      {/* แสดงรูปหลักฐานการชำระเงิน */}
                      {paymentImage && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">หลักฐานการชำระเงิน</Typography>
                          <Box 
                            component="img" 
                            src={paymentImage}
                            alt="หลักฐานการชำระเงิน"
                            sx={{ 
                              width: '100%', 
                              maxWidth: 200, 
                              mt: 1,
                              height: 'auto', 
                              cursor: 'pointer', 
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1
                            }}
                            onClick={() => setShowImageModal(true)}
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/300x400?text=ไม่พบรูปภาพ';
                            }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Button onClick={() => setShowOrderDetail(false)} color="primary">
                ปิด
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Modal แสดงรูปภาพเต็มจอ */}
      <Dialog 
        open={showImageModal} 
        onClose={() => setShowImageModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          หลักฐานการชำระเงิน
          <IconButton onClick={() => setShowImageModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {paymentImage && (
            <Box 
              component="img" 
              src={paymentImage}
              alt="หลักฐานการชำระเงิน"
              sx={{ 
                width: '100%', 
                height: 'auto',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/800x600?text=ไม่พบรูปภาพ';
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
} 