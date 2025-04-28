'use client';

import { useState } from 'react';
import { formatThaiDate } from '@/utils/dateUtils';
import { Order } from './OrderDialog';
import OrderDialog from './OrderDialog';

// Enum ที่ตรงกับ model Order ในฐานข้อมูล
enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED'
}

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  TablePagination
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';

interface PaginationProps {
  page: number;
  limit: number | string;
  totalItems: number;
  totalPages: number;
}

interface OrderListProps {
  orders: Order[];
  pagination: PaginationProps;
  onPageChange: (page: number, limit?: number | string) => void;
  onOrderSelect: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string, paymentStatus: string) => void;
  selectedOrderId: string | null;
}

export default function OrderList({ 
  orders, 
  pagination, 
  onPageChange, 
  onOrderSelect,
  onUpdateStatus,
  selectedOrderId 
}: OrderListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // เพิ่ม local state สำหรับจัดการ rowsPerPage ที่เป็น number เท่านั้น
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    typeof pagination.limit === 'number' ? pagination.limit : 10
  );
  
  // Handle view order details
  const handleViewOrder = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrder(order);
    setDialogOpen(true);
  };
  
  // Handle close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Function to get status badge color
  const getStatusColor = (status: string): { color: string; backgroundColor: string } => {
    switch (status) {
      case OrderStatus.PENDING:
        return { 
          color: theme.palette.warning.main, 
          backgroundColor: alpha(theme.palette.warning.main, 0.1)
        };
      case OrderStatus.PROCESSING:
        return { 
          color: theme.palette.info.main, 
          backgroundColor: alpha(theme.palette.info.main, 0.1)
        };
      case OrderStatus.PAID:
        return { 
          color: theme.palette.success.main, 
          backgroundColor: alpha(theme.palette.success.main, 0.1)
        };
      case OrderStatus.SHIPPED:
        return { 
          color: theme.palette.primary.main, 
          backgroundColor: alpha(theme.palette.primary.main, 0.1)
        };
      case OrderStatus.DELIVERED:
        return { 
          color: theme.palette.common.white, 
          backgroundColor: theme.palette.success.main
        };
      case OrderStatus.CANCELLED:
        return { 
          color: theme.palette.error.main, 
          backgroundColor: alpha(theme.palette.error.main, 0.1)
        };
      default:
        return { 
          color: theme.palette.text.secondary, 
          backgroundColor: alpha(theme.palette.text.secondary, 0.1)
        };
    }
  };
  
  // Function to get payment status badge color
  const getPaymentStatusColor = (status: string): { color: string; backgroundColor: string } => {
    switch (status) {
      case PaymentStatus.PENDING:
        return { 
          color: theme.palette.warning.main, 
          backgroundColor: alpha(theme.palette.warning.main, 0.1)
        };
      case PaymentStatus.CONFIRMED:
        return { 
          color: theme.palette.success.main, 
          backgroundColor: alpha(theme.palette.success.main, 0.1)
        };
      case PaymentStatus.REJECTED:
        return { 
          color: theme.palette.error.main, 
          backgroundColor: alpha(theme.palette.error.main, 0.1)
        };
      default:
        return { 
          color: theme.palette.text.secondary, 
          backgroundColor: alpha(theme.palette.text.secondary, 0.1)
        };
    }
  };
  
  // Function to translate status to Thai
  const translateStatus = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'รอดำเนินการ';
      case OrderStatus.PROCESSING:
        return 'กำลังดำเนินการ';
      case OrderStatus.PAID:
        return 'ชำระเงินแล้ว';
      case OrderStatus.SHIPPED:
        return 'จัดส่งแล้ว';
      case OrderStatus.DELIVERED:
        return 'ส่งมอบแล้ว';
      case OrderStatus.CANCELLED:
        return 'ยกเลิก';
      default:
        return status || '-';
    }
  };
  
  // Function to translate payment status to Thai
  const translatePaymentStatus = (status: string) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'รอชำระเงิน';
      case PaymentStatus.CONFIRMED:
        return 'ชำระเงินแล้ว';
      case PaymentStatus.REJECTED:
        return 'ปฏิเสธการชำระเงิน';
      default:
        return status || '-';
    }
  };
  
  // Function ตรวจสอบว่าคำสั่งซื้อนี้มีหลักฐานการชำระเงินแนบมาหรือไม่
  const hasPaymentSlip = (order: Order): boolean => {
    return !!(order.paymentInfo?.slipUrl || 
      (order.paymentConfirmations && order.paymentConfirmations.length > 0));
  };
  
  // Handle pagination change
  const handlePaginationChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };
  
  // Handle table pagination change
  const handleTablePageChange = (_: unknown, newPage: number) => {
    onPageChange(newPage + 1); // API uses 1-based indexing
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newRowsPerPage = parseInt(value, 10);
    setRowsPerPage(newRowsPerPage);
    
    // ถ้าเป็น -1 (All) ให้ส่งค่าเป็น 'all'
    let newLimit: number | string = newRowsPerPage;
    if (newRowsPerPage === -1) {
      newLimit = 'all';
    }
    
    // ส่งค่า newLimit กลับไปยัง parent component
    onPageChange(1, newLimit);
  };
  
  return (
    <>
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        {isMobile ? (
          // Mobile View - Card Layout
          <Box>
            {orders.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  ไม่พบข้อมูลคำสั่งซื้อ
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1} sx={{ p: 2 }}>
                {orders.map((order) => {
                  const statusColor = getStatusColor(order.status);
                  const paymentStatusColor = getPaymentStatusColor(order.paymentStatus);
                  const isSelected = order.id === selectedOrderId;
                  
                  return (
                    <Card 
                      key={order.id} 
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.light',
                          boxShadow: 1
                        }
                      }}
                      onClick={() => onOrderSelect(order)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>#{order.orderNumber}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.createdAt && typeof order.createdAt === 'string' && !isNaN(new Date(order.createdAt).getTime()) 
                                ? formatThaiDate(new Date(order.createdAt)) 
                                : '-'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customerInfo?.email}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            ยอดรวม: ฿{Number(order.finalAmount).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={translateStatus(order.status)}
                            size="small"
                            sx={{ 
                              color: statusColor.color,
                              backgroundColor: statusColor.backgroundColor,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip 
                              label={translatePaymentStatus(order.paymentStatus)}
                              size="small"
                              sx={{ 
                                color: paymentStatusColor.color,
                                backgroundColor: paymentStatusColor.backgroundColor,
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                            {hasPaymentSlip(order) && (
                              <ImageIcon 
                                fontSize="small" 
                                color="primary" 
                                sx={{ opacity: 0.8 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
            
            {/* Mobile Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center', 
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.neutral'
              }}>
                <Pagination 
                  count={pagination.totalPages} 
                  page={pagination.page} 
                  onChange={handlePaginationChange} 
                  color="primary" 
                  size="small"
                />
              </Box>
            )}
          </Box>
        ) : (
          // Desktop View - Table Layout
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                    <TableCell width={80}>รหัสสั่งซื้อ</TableCell>
                    <TableCell>ชื่อลูกค้า</TableCell>
                    <TableCell>วันที่สั่งซื้อ</TableCell>
                    <TableCell>ยอดรวม</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>การชำระเงิน</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          ไม่พบข้อมูลคำสั่งซื้อ
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => {
                      const statusColor = getStatusColor(order.status);
                      const paymentStatusColor = getPaymentStatusColor(order.paymentStatus);
                      const isSelected = order.id === selectedOrderId;
                      
                      return (
                        <TableRow 
                          key={order.id}
                          hover
                          onClick={() => onOrderSelect(order)}
                          sx={{ 
                            cursor: 'pointer',
                            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'inherit',
                            '&:hover': {
                              bgcolor: isSelected 
                                ? alpha(theme.palette.primary.main, 0.1) 
                                : alpha(theme.palette.action.hover, 0.1)
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>#{order.orderNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{order.customerInfo?.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {order.createdAt && typeof order.createdAt === 'string' && !isNaN(new Date(order.createdAt).getTime()) 
                                ? formatThaiDate(new Date(order.createdAt)) 
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>฿{Number(order.finalAmount).toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={translateStatus(order.status)}
                              size="small"
                              sx={{ 
                                color: statusColor.color,
                                backgroundColor: statusColor.backgroundColor,
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={translatePaymentStatus(order.paymentStatus)}
                                size="small"
                                sx={{ 
                                  color: paymentStatusColor.color,
                                  backgroundColor: paymentStatusColor.backgroundColor,
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                              {hasPaymentSlip(order) && (
                                <Tooltip title="มีหลักฐานการชำระเงิน">
                                  <ImageIcon 
                                    fontSize="small" 
                                    color="primary" 
                                    sx={{ opacity: 0.8 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Desktop Pagination */}
            <TablePagination
              component="div"
              count={pagination.totalItems}
              page={pagination.page - 1} // API uses 1-based indexing, MUI uses 0-based
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[
                10, 
                25, 
                50, 
                100,
                { label: 'แสดงทั้งหมด', value: -1 }
              ]}
              onPageChange={handleTablePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => 
                `${from}-${to} จาก ${count}`
              }
              labelRowsPerPage="แสดง:"
              sx={{
                '.MuiTablePagination-selectLabel': {
                  display: { xs: 'none', sm: 'block' }
                },
                '.MuiTablePagination-displayedRows': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                },
                '.MuiTablePagination-select': {
                  paddingLeft: { xs: 0, sm: 1 }
                }
              }}
            />
          </>
        )}
      </Paper>
      
      {/* Order Dialog */}
      <OrderDialog
        open={dialogOpen}
        order={selectedOrder}
        onClose={handleCloseDialog}
        onUpdateStatus={onUpdateStatus}
      />
    </>
  );
}
