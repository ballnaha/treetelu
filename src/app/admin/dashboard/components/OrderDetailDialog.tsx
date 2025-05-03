'use client';

import { formatThaiDate } from '@/utils/dateUtils';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// นำ interfaces มาจาก OrderDialog
export interface OrderItem {
  id: string;
  productName: string;
  productImg?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note?: string;
}

export interface ShippingInfo {
  receiverName: string;
  receiverLastname: string;
  receiverPhone: string;
  addressLine: string;
  addressLine2?: string;
  provinceName: string;
  amphureName: string;
  tambonName: string;
  zipCode: string;
  deliveryDate?: string;
  deliveryTime?: string;
  cardMessage?: string;
  additionalNote?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  shippingCost: number;
  discount: number;
  discountCode?: string | null;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
  customerInfo: CustomerInfo;
  shippingInfo: ShippingInfo;
  orderItems: OrderItem[];
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  paymentInfo?: {
    slipUrl?: string;
  };
  paymentConfirmations?: {
    slipUrl: string;
    createdAt: string;
  }[];
}

interface OrderDetailDialogProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  loading?: boolean;
}

// Function to translate payment method to Thai
const translatePaymentMethod = (method: string) => {
  const methodMap: Record<string, string> = {
    'BANK_TRANSFER': 'โอนเงินผ่านธนาคาร',
    'CREDIT_CARD': 'บัตรเครดิต',
    'PROMPTPAY': 'พร้อมเพย์',
    'COD': 'เก็บเงินปลายทาง'
  };
  
  return methodMap[method] || method;
};

// Function to translate order status to Thai
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

// Function to get status color
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

export default function OrderDetailDialog({ open, order, onClose, loading = false }: OrderDetailDialogProps) {
  if (!order && !loading) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        bgcolor: 'background.neutral',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6">
          {loading ? 'กำลังโหลดข้อมูล...' : `รายละเอียดคำสั่งซื้อ #${order?.orderNumber}`}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          order && (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={translateOrderStatus(order.status)} 
                  color={getStatusColor(order.status) as any}
                  size="small" 
                />
                <Typography variant="body2" color="text.secondary">
                  วันที่สั่งซื้อ: {order.createdAt && formatThaiDate(new Date(order.createdAt))}
                </Typography>
              </Box>
              
              {/* รายการสินค้า */}
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                รายการสินค้า
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'background.neutral' }}>
                    <TableRow>
                      <TableCell>สินค้า</TableCell>
                      <TableCell align="right">ราคาต่อชิ้น</TableCell>
                      <TableCell align="right">จำนวน</TableCell>
                      <TableCell align="right">ราคารวม</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.orderItems && order.orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.productImg && (
                              <Box 
                                component="img" 
                                src={`/images/product/${item.productImg}`} 
                                alt={item.productName}
                                sx={{ 
                                  width: 50, 
                                  height: 50, 
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  mr: 2 
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
                    
                    {/* Summary */}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="body2">รวมค่าสินค้า:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">฿{(order.totalAmount || 0).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="body2">ค่าจัดส่ง:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">฿{(order.shippingCost || 0).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                    {order.discount > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="body2">ส่วนลด {order.discountCode && `(${order.discountCode})`}:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">-฿{(order.discount || 0).toLocaleString()}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">ยอดรวมทั้งสิ้น:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700}>฿{(order.finalAmount || 0).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Customer Information and Shipping Information */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Customer Information */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    ข้อมูลลูกค้า
                  </Typography>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {order.customerInfo && (
                        <>
                          <Box>
                            <Typography variant="caption" color="text.secondary">ชื่อ-นามสกุล</Typography>
                            <Typography variant="body2">{order.customerInfo.firstName || ''} {order.customerInfo.lastName || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">อีเมล</Typography>
                            <Typography variant="body2">{order.customerInfo.email || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">เบอร์โทรศัพท์</Typography>
                            <Typography variant="body2">{order.customerInfo.phone || ''}</Typography>
                          </Box>
                          {order.customerInfo.note && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">หมายเหตุ</Typography>
                              <Typography variant="body2" sx={{ 
                                p: 1, 
                                bgcolor: 'background.paper', 
                                border: '1px solid', 
                                borderColor: 'divider',
                                borderRadius: 1
                              }}>
                                {order.customerInfo.note}
                              </Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Box>
                
                {/* Shipping Information */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    ข้อมูลการจัดส่ง
                  </Typography>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {order.shippingInfo && (
                        <>
                          <Box>
                            <Typography variant="caption" color="text.secondary">ผู้รับ</Typography>
                            <Typography variant="body2">{order.shippingInfo.receiverName || ''} {order.shippingInfo.receiverLastname || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">เบอร์โทรศัพท์</Typography>
                            <Typography variant="body2">{order.shippingInfo.receiverPhone || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">ที่อยู่</Typography>
                            <Typography variant="body2">
                              {order.shippingInfo.addressLine || ''}
                              {order.shippingInfo.addressLine2 && `, ${order.shippingInfo.addressLine2}`}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">ตำบล/แขวง</Typography>
                            <Typography variant="body2">{order.shippingInfo.tambonName || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">อำเภอ/เขต</Typography>
                            <Typography variant="body2">{order.shippingInfo.amphureName || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">จังหวัด</Typography>
                            <Typography variant="body2">{order.shippingInfo.provinceName || ''}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">รหัสไปรษณีย์</Typography>
                            <Typography variant="body2">{order.shippingInfo.zipCode || ''}</Typography>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Box>
              </Box>
              
              {/* Payment Information */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  ข้อมูลการชำระเงิน
                </Typography>
                
                <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">วิธีการชำระเงิน</Typography>
                      <Typography variant="body2">{translatePaymentMethod(order.paymentMethod)}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary">สถานะการชำระเงิน</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={order.paymentStatus === 'CONFIRMED' ? 'ชำระเงินแล้ว' : 'รอการชำระเงิน'} 
                          color={order.paymentStatus === 'CONFIRMED' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </Box>
                    </Box>
                    
                    {/* ถ้ามีหลักฐานการชำระเงิน */}
                    {(order.paymentInfo?.slipUrl || (order.paymentConfirmations && order.paymentConfirmations.length > 0)) && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">หลักฐานการชำระเงิน</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Box 
                            component="img" 
                            src={order.paymentInfo?.slipUrl || (order.paymentConfirmations && order.paymentConfirmations.length > 0 ? order.paymentConfirmations[0].slipUrl : '')} 
                            alt="หลักฐานการชำระเงิน"
                            sx={{ 
                              maxWidth: '100%',
                              maxHeight: 300,
                              objectFit: 'contain',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1
                            }} 
                          />
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Box>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
} 