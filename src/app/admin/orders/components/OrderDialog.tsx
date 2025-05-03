'use client';

import { useState, useEffect } from 'react';
import { formatThaiDate } from '@/utils/dateUtils';
// Define Order interface directly in this file
export interface OrderItem {
  id: string;
  productName: string;
  productImg: string;
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

enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  PROMPTPAY = 'PROMPTPAY',
  COD = 'COD'
}
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';

interface OrderDialogProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string, paymentStatus: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export default function OrderDialog({ open, order, onClose, onUpdateStatus, onDeleteOrder }: OrderDialogProps) {
  const [status, setStatus] = useState<string>(order?.status || 'PENDING');
  const [paymentStatus, setPaymentStatus] = useState<string>(order?.paymentStatus || 'PENDING');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentImage, setPaymentImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      
      // หารูปหลักฐานการชำระเงิน
      const slipUrl = order.paymentInfo?.slipUrl || 
                     (order.paymentConfirmations && order.paymentConfirmations.length > 0 ? 
                       order.paymentConfirmations[0].slipUrl : null);
      setPaymentImage(slipUrl || null);
    }
  }, [order]);
  
  // Function to translate payment method to Thai
  const translatePaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      [PaymentMethod.BANK_TRANSFER]: 'โอนเงินผ่านธนาคาร',
      [PaymentMethod.CREDIT_CARD]: 'บัตรเครดิต',
      [PaymentMethod.PROMPTPAY]: 'พร้อมเพย์',
      [PaymentMethod.COD]: 'เก็บเงินปลายทาง'
    };
    
    return methodMap[method] || method;
  };
  
  // Handle status update
  const handleUpdateStatus = () => {
    if (order) {
      onUpdateStatus(order.id, status, paymentStatus);
      onClose();
    }
  };
  
  // Handle delete order
  const handleDeleteOrder = () => {
    if (order && onDeleteOrder) {
      setDeleteConfirmOpen(false);
      onDeleteOrder(order.id);
      onClose();
    }
  };
  
  if (!order) return null;
  
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
          รายละเอียดคำสั่งซื้อ #{order.orderNumber}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="body2" color="text.secondary">
            วันที่สั่งซื้อ: {order.createdAt && typeof order.createdAt === 'string' && !isNaN(new Date(order.createdAt).getTime()) 
              ? formatThaiDate(new Date(order.createdAt)) 
              : '-'}
          </Typography>
        </Box>
        
        {/* Order Status Management */}
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            จัดการสถานะ
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <TextField
                select
                fullWidth
                id="status"
                label="สถานะคำสั่งซื้อ"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                size="small"
              >
                <MenuItem value={OrderStatus.PENDING}>รอดำเนินการ</MenuItem>
                <MenuItem value={OrderStatus.PROCESSING}>กำลังดำเนินการ</MenuItem>
                <MenuItem value={OrderStatus.PAID}>ชำระเงินแล้ว</MenuItem>
                <MenuItem value={OrderStatus.SHIPPED}>จัดส่งแล้ว</MenuItem>
                <MenuItem value={OrderStatus.DELIVERED}>จัดส่งสำเร็จ</MenuItem>
                <MenuItem value={OrderStatus.CANCELLED}>ยกเลิก</MenuItem>
              </TextField>
            </Box>
            <Box>
              <TextField
                select
                fullWidth
                id="paymentStatus"
                label="สถานะการชำระเงิน"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                size="small"
              >
                <MenuItem value={PaymentStatus.PENDING}>รอชำระเงิน</MenuItem>
                <MenuItem value={PaymentStatus.CONFIRMED}>ยืนยันแล้ว</MenuItem>
                <MenuItem value={PaymentStatus.REJECTED}>ปฏิเสธ</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Paper>
        
        {/* Order Items */}
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
              {order.orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {item.productImg && (
                        <Box 
                          component="img" 
                          src={`/images/product/${item.productImg}`} 
                          alt={item.productName}
                          sx={{ width: 40, height: 40, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
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
              {/* ส่วนลด */}
              {order.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="body2">
                      ส่วนลด {order.discountCode && `(${order.discountCode})`}:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main">-฿{order.discount.toLocaleString()}</Typography>
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
        
        {/* Customer Information */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
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
                    {order.shippingInfo.deliveryDate && typeof order.shippingInfo.deliveryDate === 'string' && !isNaN(new Date(order.shippingInfo.deliveryDate).getTime()) && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">วันที่จัดส่ง</Typography>
                        <Typography variant="body2">
                          {formatThaiDate(new Date(order.shippingInfo.deliveryDate))}
                          {order.shippingInfo.deliveryTime && ` ${order.shippingInfo.deliveryTime}`}
                        </Typography>
                      </Box>
                    )}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">วิธีการชำระเงิน</Typography>
                <Typography variant="body2">{order.paymentMethod ? translatePaymentMethod(order.paymentMethod) : ''}</Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">สถานะการชำระเงิน</Typography>
                <Typography variant="body2">
                  {paymentStatus === PaymentStatus.PENDING ? 'รอชำระเงิน' :
                   paymentStatus === PaymentStatus.CONFIRMED ? 'ยืนยันแล้ว' :
                   paymentStatus === PaymentStatus.REJECTED ? 'ปฏิเสธ' : paymentStatus}
                </Typography>
              </Box>
            </Stack>
            
            {/* แสดงรูปหลักฐานการชำระเงิน */}
            {paymentImage && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  หลักฐานการชำระเงิน
                </Typography>
                <Box 
                  component="img" 
                  src={paymentImage}
                  alt="หลักฐานการชำระเงิน"
                  sx={{ 
                    width: '100%', 
                    maxWidth: 300, 
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
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: 'background.neutral', justifyContent: 'space-between' }}>
        <Button 
          onClick={() => setDeleteConfirmOpen(true)} 
          color="error"
          startIcon={<DeleteIcon />}
          variant="outlined"
          sx={{ display: onDeleteOrder ? 'flex' : 'none' }}
        >
          ลบคำสั่งซื้อ
        </Button>
        <Box>
          <Button onClick={onClose} color="inherit" sx={{ mr: 1 }}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained" 
            startIcon={<SaveIcon />}
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </Box>
      </DialogActions>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          ยืนยันการลบคำสั่งซื้อ
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            คุณต้องการลบคำสั่งซื้อ #{order?.orderNumber} ใช่หรือไม่?
          </Typography>
          <Typography variant="body2" color="error.main">
            การดำเนินการนี้ไม่สามารถยกเลิกได้ และข้อมูลทั้งหมดที่เกี่ยวข้องกับคำสั่งซื้อนี้จะถูกลบออกจากระบบ
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button onClick={handleDeleteOrder} color="error" variant="contained">
            ยืนยันการลบ
          </Button>
        </DialogActions>
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
    </Dialog>
  );
}
