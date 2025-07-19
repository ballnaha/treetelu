'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';



// Custom StatusChip component
const StatusChipStyled = styled(Chip)({
  fontWeight: 500,
  borderRadius: '4px',
});

// StatusChip component
function StatusChip({ status, ...props }: { status: string; [x: string]: any }) {
  const theme = useTheme();
  
  let bgColor = theme.palette.warning.light;
  let textColor = theme.palette.warning.dark;
  
  if (status === 'CONFIRMED') {
    bgColor = theme.palette.success.light;
    textColor = theme.palette.success.dark;
  } else if (status === 'REJECTED') {
    bgColor = theme.palette.error.light;
    textColor = theme.palette.error.dark;
  }
  
  // แปลงสถานะให้เป็นภาษาไทย
  let statusLabel = 'รอตรวจสอบ';
  if (status === 'CONFIRMED') {
    statusLabel = 'ยืนยันแล้ว';
  } else if (status === 'REJECTED') {
    statusLabel = 'ปฏิเสธแล้ว';
  }
  
  return (
    <StatusChipStyled
      {...props}
      label={statusLabel}
      sx={{ backgroundColor: bgColor, color: textColor }}
    />
  );
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '4px',
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
  }
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
}));

interface PaymentConfirmation {
  id: string;
  orderNumber: string;
  amount: number;
  slipUrl: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  // ฟิลด์เพิ่มเติมสำหรับการตรวจสอบ order
  orderExists?: boolean;
  statusNote?: string;
}

export default function PaymentConfirmationAdmin() {
  const theme = useTheme();
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<PaymentConfirmation | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
  // Filter states with localStorage persistence
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('paymentConfirmation.statusFilter') || 'ALL';
    }
    return 'ALL';
  });
  const [orderExistsFilter, setOrderExistsFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('paymentConfirmation.orderExistsFilter') || 'ALL';
    }
    return 'ALL';
  });
  const [dateFromFilter, setDateFromFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('paymentConfirmation.dateFromFilter') || '';
    }
    return '';
  });
  const [dateToFilter, setDateToFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('paymentConfirmation.dateToFilter') || '';
    }
    return '';
  });
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('paymentConfirmation.showFilters') === 'true';
    }
    return false;
  });


  // โหลดข้อมูลการชำระเงิน
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment-confirmation');
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลได้');
      }
      const data = await response.json();
      
      // ดึงสถานะของ order แต่ละรายการเพื่อให้ตรงกับ slip
      const paymentsWithOrderStatus = await Promise.all(
        data.payments.map(async (payment: any) => {
          try {
            const orderResponse = await fetch(`/api/admin/orders/${payment.orderNumber}`);
            if (orderResponse.ok) {
              const orderData = await orderResponse.json();
              if (orderData.success && orderData.order) {
                return {
                  ...payment,
                  status: orderData.order.paymentStatus || payment.status,
                  orderExists: true // ระบุว่าพบ order ที่ตรงกัน
                };
              } else {
                console.warn(`Order ${payment.orderNumber} not found in orders table`);
                return {
                  ...payment,
                  orderExists: false, // ระบุว่าไม่พบ order ที่ตรงกัน
                  statusNote: 'ไม่พบคำสั่งซื้อที่ตรงกัน' // เพิ่มหมายเหตุ
                };
              }
            } else if (orderResponse.status === 404) {
              console.warn(`Order ${payment.orderNumber} not found (404)`);
              return {
                ...payment,
                orderExists: false,
                statusNote: 'ไม่พบคำสั่งซื้อที่ตรงกัน'
              };
            }
          } catch (error) {
            console.error(`ไม่สามารถดึงข้อมูล order ${payment.orderNumber}:`, error);
            return {
              ...payment,
              orderExists: false,
              statusNote: 'เกิดข้อผิดพลาดในการตรวจสอบ'
            };
          }
          return payment; // ใช้ข้อมูลเดิมถ้าไม่สามารถดึงข้อมูล order ได้
        })
      );
      
      setPayments(paymentsWithOrderStatus);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // บันทึก filter preferences ลง localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentConfirmation.statusFilter', statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentConfirmation.orderExistsFilter', orderExistsFilter);
    }
  }, [orderExistsFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentConfirmation.dateFromFilter', dateFromFilter);
    }
  }, [dateFromFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentConfirmation.dateToFilter', dateToFilter);
    }
  }, [dateToFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentConfirmation.showFilters', showFilters.toString());
    }
  }, [showFilters]);

  // จัดการการเปลี่ยนหน้า
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // จัดการการเปลี่ยนจำนวนแถวต่อหน้า
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // จัดการการคลิกดูรายละเอียด
  const handleViewDetails = (payment: PaymentConfirmation) => {
    setSelectedPayment(payment);
    setNote(payment.notes || '');
    setOpenDialog(true);
  };

  // จัดการการปิด dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayment(null);
    setNote('');
  };

  // จัดการการดูรูปภาพ
  const handleViewImage = (payment: PaymentConfirmation) => {
    setSelectedPayment(payment);
    setOpenImageDialog(true);
  };

  // จัดการการปิด dialog รูปภาพ
  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedPayment(null);
  };

  // จัดการการอนุมัติการชำระเงิน
  const handleApprove = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`/api/admin/payment-confirmation/${selectedPayment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CONFIRMED',
          notes: note,
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถยืนยันการชำระเงินได้');
      }

      // อัพเดทสถานะในหน้าจอ
      setPayments(payments.map(payment => 
        payment.id === selectedPayment.id 
          ? { ...payment, status: 'CONFIRMED', notes: note, updatedAt: new Date().toISOString() }
          : payment
      ));

      handleCloseDialog();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // จัดการการปฏิเสธการชำระเงิน
  const handleReject = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`/api/admin/payment-confirmation/${selectedPayment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          notes: note,
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถปฏิเสธการชำระเงินได้');
      }

      // อัพเดทสถานะในหน้าจอ
      setPayments(payments.map(payment => 
        payment.id === selectedPayment.id 
          ? { ...payment, status: 'REJECTED', notes: note, updatedAt: new Date().toISOString() }
          : payment
      ));

      handleCloseDialog();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // จัดการการลบการชำระเงิน
  const handleConfirmDelete = () => {
    if (!selectedPayment) return;
    
    console.log('เริ่มกระบวนการ handleConfirmDelete สำหรับข้อมูล ID:', selectedPayment.id);
    setSelectedAction('delete');
    setOpenDeleteDialog(true);
    // เก็บ ID ที่ต้องการลบแยกไว้ต่างหาก
    setPaymentToDelete(selectedPayment.id);
    console.log('เปิด dialog ยืนยันการลบ, openDeleteDialog =', true);
    console.log('เก็บ ID ที่ต้องการลบ:', selectedPayment.id);
    
    // ปิดเมนูโดยไม่รีเซ็ต selectedPayment
    setAnchorEl(null);
  };

  // เพิ่มฟังก์ชันตัวช่วยเพื่อลบข้อมูล โดยไม่ขึ้นกับ state selectedPayment
  const deletePaymentById = async (paymentId: string) => {
    if (!paymentId) {
      console.log('ไม่พบ paymentId ใน deletePaymentById');
      return;
    }

    try {
      console.log('เริ่มกระบวนการลบข้อมูล ID:', paymentId);
      setLoading(true);
      
      const response = await fetch(`/api/payment-confirmation?id=${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      console.log('ผลการเรียก API:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('ข้อผิดพลาดจาก API:', errorData);
        } catch (parseError) {
          console.error('ไม่สามารถแยกวิเคราะห์ข้อผิดพลาดได้:', parseError);
          errorData = { message: `HTTP error: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || 'ไม่สามารถลบการชำระเงินได้');
      }

      console.log('ลบข้อมูลสำเร็จ');
      
      // ลบออกจากหน้าจอ
      setPayments(payments.filter(payment => payment.id !== paymentId));
      handleCloseDeleteDialog();
      
      // แสดงข้อความสำเร็จ
      setError(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'ไม่สามารถลบการชำระเงินได้');
    } finally {
      setLoading(false);
      // รีเซ็ต paymentToDelete
      setPaymentToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedPayment(null);
  };



  // จัดการการค้นหา
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // กรองข้อมูลตามการค้นหา
  // ระบบ filter ที่ครบถ้วน
  const filteredPayments = payments.filter(payment => {
    // Filter ตาม search query
    const matchesSearch = searchQuery === '' || 
      payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.amount.toString().includes(searchQuery) ||
      (payment.notes && payment.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter ตามสถานะ
    const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
    
    // Filter ตามการมีอยู่ของ order
    const matchesOrderExists = orderExistsFilter === 'ALL' || 
      (orderExistsFilter === 'EXISTS' && payment.orderExists !== false) ||
      (orderExistsFilter === 'NOT_EXISTS' && payment.orderExists === false);
    
    // Filter ตามวันที่
    let matchesDateRange = true;
    if (dateFromFilter || dateToFilter) {
      const paymentDate = new Date(payment.createdAt);
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        matchesDateRange = matchesDateRange && paymentDate >= fromDate;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // รวมทั้งวัน
        matchesDateRange = matchesDateRange && paymentDate <= toDate;
      }
    }
    
    return matchesSearch && matchesStatus && matchesOrderExists && matchesDateRange;
  });

  // จัดการการเปิดเมนู
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: PaymentConfirmation) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  // จัดการการปิดเมนู
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPayment(null);
    setSelectedAction(null);
  };



  // จัดการการเลือก action จากเมนู
  const handleMenuAction = (action: string) => {
    setSelectedAction(action);
    handleMenuClose();

    if (!selectedPayment) return;

    switch (action) {
      case 'view':
        handleViewDetails(selectedPayment);
        break;
      case 'image':
        handleViewImage(selectedPayment);
        break;
      case 'delete':
        handleConfirmDelete();
        break;
    }
  };

  // ฟังก์ชันแสดงวันที่ในรูปแบบที่อ่านง่ายสำหรับมนุษย์
  const formatThaiDateTime = (dateString: string) => {
    try {
      // แยกส่วน string วันที่และเวลาออกมา
      // ตัวอย่าง: "2025-05-12T15:28:30.000Z" => { date: "2025-05-12", time: "15:28:30" }
      const parts = dateString.split('T');
      if (parts.length !== 2) return dateString;
      
      const datePart = parts[0]; // "2025-05-12"
      const timePart = parts[1].substr(0, 8); // "15:28:30"
      
      // แยกส่วนวันที่เพื่อแปลงเป็นรูปแบบไทย
      const [year, month, day] = datePart.split('-');
      
      // สร้างวันที่ด้วย date-fns เพื่อใช้ในการแปลงชื่อเดือนเป็นภาษาไทย
      const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const monthName = monthNames[parseInt(month) - 1];
      
      // สร้างรูปแบบวันที่ไทย: "12 พ.ค. 2025 15:28 น."
      return `${parseInt(day)} ${monthName} ${year} ${timePart.substr(0, 5)} น.`;
    } catch (error) {
      return dateString; // ส่งคืนค่าเดิมถ้ามีข้อผิดพลาด
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <PageTitle variant="h4">
            จัดการการยืนยันการชำระเงิน
          </PageTitle>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ตรวจสอบและจัดการการยืนยันการชำระเงินของลูกค้า
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Box>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              รายการยืนยันการชำระเงินทั้งหมด
            </Typography>
            <Typography variant="body2" color="text.secondary">
              พบทั้งหมด {filteredPayments.length} รายการ
            </Typography>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
            
            <StyledButton
              variant={showFilters ? "contained" : "outlined"}
              color="primary"
              startIcon={<FilterListIcon />}
              size="medium"
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                position: 'relative'
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              กรอง
              {(statusFilter !== 'ALL' || orderExistsFilter !== 'ALL' || dateFromFilter || dateToFilter) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'error.main'
                  }}
                />
              )}
            </StyledButton>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filter Controls */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              ตัวกรอง
            </Typography>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Status Filter */}
                <TextField
                  select
                  label="สถานะ"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                  size="small"
                  SelectProps={{
                    MenuProps: {
                      disableScrollLock: true,
                      transitionDuration: 0,
                    }
                  }}
                >
                  <MenuItem value="ALL">ทั้งหมด</MenuItem>
                  <MenuItem value="PENDING">รอตรวจสอบ</MenuItem>
                  <MenuItem value="CONFIRMED">ยืนยันแล้ว</MenuItem>
                  <MenuItem value="REJECTED">ปฏิเสธแล้ว</MenuItem>
                </TextField>

                {/* Order Exists Filter */}
                <TextField
                  select
                  label="สถานะคำสั่งซื้อ"
                  value={orderExistsFilter}
                  onChange={(e) => setOrderExistsFilter(e.target.value)}
                  sx={{ minWidth: 180 }}
                  size="small"
                  SelectProps={{
                    MenuProps: {
                      disableScrollLock: true,
                      transitionDuration: 0,
                    }
                  }}
                >
                  <MenuItem value="ALL">ทั้งหมด</MenuItem>
                  <MenuItem value="EXISTS">พบคำสั่งซื้อ</MenuItem>
                  <MenuItem value="NOT_EXISTS">ไม่พบคำสั่งซื้อ</MenuItem>
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Date From Filter */}
                <TextField
                  type="date"
                  label="จากวันที่"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 150 }}
                />

                {/* Date To Filter */}
                <TextField
                  type="date"
                  label="ถึงวันที่"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 150 }}
                />
              </Stack>

              {/* Filter Actions */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // ล้าง filter states
                    setStatusFilter('ALL');
                    setOrderExistsFilter('ALL');
                    setDateFromFilter('');
                    setDateToFilter('');
                    setSearchQuery('');
                    
                    // ล้าง localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('paymentConfirmation.statusFilter');
                      localStorage.removeItem('paymentConfirmation.orderExistsFilter');
                      localStorage.removeItem('paymentConfirmation.dateFromFilter');
                      localStorage.removeItem('paymentConfirmation.dateToFilter');
                    }
                  }}
                >
                  ล้างตัวกรอง
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  พบ {filteredPayments.length} รายการ จากทั้งหมด {payments.length} รายการ
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Mobile Filter Button */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
          <Button
            fullWidth
            variant={showFilters ? "contained" : "outlined"}
            color={(statusFilter !== 'ALL' || orderExistsFilter !== 'ALL' || dateFromFilter || dateToFilter) ? "primary" : "inherit"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ borderRadius: 2, position: 'relative' }}
          >
            ตัวกรอง ({filteredPayments.length}/{payments.length})
            {(statusFilter !== 'ALL' || orderExistsFilter !== 'ALL' || dateFromFilter || dateToFilter) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'error.main'
                }}
              />
            )}
          </Button>
        </Box>

        {/* Mobile Card Layout */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} color="primary" />
            </Box>
          ) : filteredPayments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                ไม่พบข้อมูลการชำระเงิน
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ลองเปลี่ยนคำค้นหาหรือกลับมาภายหลัง
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredPayments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment) => (
                  <Paper key={payment.id} sx={{ p: 3, borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {payment.orderNumber}
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            ฿{payment.amount.toLocaleString()}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, payment)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <StatusChip status={payment.status} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {formatThaiDateTime(payment.createdAt)}
                        </Typography>
                      </Box>
                      
                      {payment.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {payment.notes}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
            </Stack>
          )}
          
          {/* Mobile Pagination */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPayments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="แสดง:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  flexDirection: 'column',
                  gap: 1
                },
                '& .MuiTablePagination-spacer': {
                  display: 'none'
                }
              }}
            />
          </Box>
        </Box>

        {/* Desktop Table Layout */}
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4, borderRadius: 1, display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell>หมายเลขคำสั่งซื้อ</StyledTableCell>
                  <StyledTableCell align="right">จำนวนเงิน</StyledTableCell>
                  <StyledTableCell>วันที่แจ้ง</StyledTableCell>
                  <StyledTableCell>สถานะ</StyledTableCell>
                  <StyledTableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>หมายเหตุ</StyledTableCell>
                  <StyledTableCell align="center">จัดการ</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={32} color="primary" />
                      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                        กำลังโหลดข้อมูล...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        ไม่พบข้อมูลการชำระเงิน
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ลองเปลี่ยนคำค้นหาหรือกลับมาภายหลัง
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {payment.orderNumber}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            ฿{payment.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatThaiDateTime(payment.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <StatusChip
                              status={payment.status}
                              size="small"
                            />
                            {payment.orderExists === false && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'warning.main', 
                                  fontSize: '0.7rem',
                                  fontWeight: 500
                                }}
                              >
                                ⚠️ ไม่พบ Order
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {payment.statusNote || payment.notes || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="ตัวเลือกเพิ่มเติม">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, payment)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredPayments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="แสดง:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </Paper>

        {/* เมนูตัวเลือกเพิ่มเติม */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          disableScrollLock={true}
          disableRestoreFocus={true}
          transitionDuration={0}
          PaperProps={{
            elevation: 1,
            sx: { minWidth: 180, borderRadius: 1 }
          }}
        >
          <MenuItem onClick={() => handleMenuAction('view')}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>ดูรายละเอียด</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleMenuAction('image')}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>ดูรูปสลิป</ListItemText>
          </MenuItem>
          
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>ลบ</ListItemText>
          </MenuItem>
        </Menu>

        {/* Dialog สำหรับดูรายละเอียดและจัดการ */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={false}
          PaperProps={{
            sx: { 
              borderRadius: { xs: 0, sm: 2 },
              m: { xs: 0, sm: 2 },
              maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' }
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            {selectedAction === 'approve' ? 'ยืนยันการชำระเงิน' :
             selectedAction === 'reject' ? 'ปฏิเสธการชำระเงิน' :
             'รายละเอียดการชำระเงิน'}
          </DialogTitle>
          
          <DialogContent dividers>
            {selectedPayment && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    หมายเลขคำสั่งซื้อ
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedPayment.orderNumber}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    จำนวนเงิน
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedPayment.amount.toLocaleString('th-TH', {
                      style: 'currency',
                      currency: 'THB'
                    })}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    วันที่แจ้ง
                  </Typography>
                  <Typography variant="body1">
                    {formatThaiDateTime(selectedPayment.createdAt)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    สถานะ
                  </Typography>
                  <StatusChip
                    status={selectedPayment.status}
                  />
                </Box>
                
                {(selectedAction === 'approve' || selectedAction === 'reject') && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="หมายเหตุ"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เพิ่มหมายเหตุ (ถ้ามี)"
                    variant="outlined"
                  />
                )}
                
                {selectedAction !== 'approve' && selectedAction !== 'reject' && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      หลักฐานการชำระเงิน
                    </Typography>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 1, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 2 
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 240,
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.9,
                          },
                        }}
                        onClick={() => handleViewImage(selectedPayment)}
                      >
                        <Image
                          src={selectedPayment.slipUrl}
                          alt="หลักฐานการชำระเงิน"
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 1 }}
            >
              ยกเลิก
            </Button>
            
            {selectedAction === 'approve' && (
              <StyledButton
                variant="contained"
                color="success"
                onClick={handleApprove}
                startIcon={<CheckCircleOutlineIcon />}
              >
                อนุมัติ
              </StyledButton>
            )}
            
            {selectedAction === 'reject' && (
              <StyledButton
                variant="contained"
                color="error"
                onClick={handleReject}
                startIcon={<CancelOutlinedIcon />}
              >
                ปฏิเสธ
              </StyledButton>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog สำหรับดูรูปภาพ */}
        <Dialog
          open={openImageDialog}
          onClose={handleCloseImageDialog}
          maxWidth="md"
          fullWidth
          fullScreen={true}
          PaperProps={{
            sx: { 
              borderRadius: { xs: 0, sm: 2 },
              m: { xs: 0, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" component="span">หลักฐานการชำระเงิน</Typography>
            <Button 
              onClick={handleCloseImageDialog}
              size="small"
            >
              ปิด
            </Button>
          </DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
            {selectedPayment && (
              <Box sx={{ 
                position: 'relative', 
                width: '100%', 
                height: { xs: 'calc(100vh - 120px)', sm: '80vh' },
                minHeight: { xs: '400px', sm: '500px' }
              }}>
                <Image
                  src={selectedPayment.slipUrl}
                  alt="หลักฐานการชำระเงิน"
                  fill
                  style={{ objectFit: 'contain' }}
                  quality={100}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog ยืนยันการลบ */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle>ยืนยันการลบ</DialogTitle>
          
          <DialogContent>
            <DialogContentText>
              คุณแน่ใจหรือไม่ว่าต้องการลบการยืนยันการชำระเงินนี้?
              {selectedPayment && (
                <Typography 
                  component="span" 
                  sx={{ 
                    display: 'block', 
                    mt: 2, 
                    fontWeight: 500,
                    color: 'text.primary' 
                  }}
                >
                  หมายเลขคำสั่งซื้อ: {selectedPayment.orderNumber}<br />
                  จำนวนเงิน: {selectedPayment.amount?.toLocaleString('th-TH', {
                    style: 'currency',
                    currency: 'THB'
                  })}
                </Typography>
              )}
            </DialogContentText>
            <Typography 
              variant="body2" 
              component="div"
              color="error" 
              sx={{ mt: 1 }}
            >
              คำเตือน: การดำเนินการนี้ไม่สามารถเรียกคืนได้
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button 
              onClick={handleCloseDeleteDialog}
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 1 }}
            >
              ยกเลิก
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                console.log('กดปุ่มลบ, จะเรียกฟังก์ชันลบข้อมูล');
                console.log('paymentToDelete:', paymentToDelete);
                if (paymentToDelete) {
                  deletePaymentById(paymentToDelete);
                } else {
                  console.error('ไม่พบ ID ที่ต้องการลบ');
                }
              }}
              startIcon={<DeleteOutlineIcon />}
              sx={{ borderRadius: 1 }}
            >
              ลบ
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
} 