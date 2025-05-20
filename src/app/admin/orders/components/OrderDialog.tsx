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
  adminComment?: string | null;
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
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';

interface OrderDialogProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string, paymentStatus: string, adminComment?: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export default function OrderDialog({ open, order, onClose, onUpdateStatus, onDeleteOrder }: OrderDialogProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [adminComment, setAdminComment] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentImage, setPaymentImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      
      // Debug: แสดงค่า order.adminComment ก่อนกำหนดค่า
      //console.log('Order in OrderDialog:', order);
      //console.log('adminComment before setting:', order.adminComment, typeof order.adminComment);
      
      // กำหนดค่า adminComment ตรวจสอบทั้ง null และ undefined
      const commentValue = order.adminComment !== undefined && order.adminComment !== null 
                        ? order.adminComment 
                        : '';
      setAdminComment(commentValue);
      
      // Debug: แสดงค่าหลังกำหนด
      //console.log('adminComment after setting:', commentValue);
      
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
      // แสดงค่า adminComment ก่อนส่งไปอัพเดต
      //console.log('Sending adminComment to update:', adminComment);
      
      // ส่ง adminComment ให้ API โดยใช้ค่าจาก state โดยตรง
      // แม้เป็นค่าว่างก็จะส่งไป เพื่อให้ API รู้ว่าต้องการอัพเดตค่านี้
      onUpdateStatus(order.id, status, paymentStatus, adminComment);
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
      fullScreen={isMobile}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: isMobile ? 2 : 2,
        bgcolor: 'background.neutral',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: isMobile ? 'sticky' : 'static',
        top: 0,
        zIndex: 10
      }}>
        <Typography variant="h6">
          รายละเอียดคำสั่งซื้อ #{order.orderNumber}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <DialogContent 
        dividers 
        sx={{ 
          p: { xs: 2, sm: 3 },
          pb: isMobile ? 24 : 6, // เพิ่ม padding ด้านล่างให้มากกว่าเดิม
          overflowY: 'auto'
        }}
      >
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
          
          {/* เพิ่มช่องสำหรับข้อความถึงลูกค้า */}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              id="adminComment"
              label="ข้อความถึงลูกค้า"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              multiline
              rows={3}
              placeholder="ใส่ข้อความที่ต้องการสื่อสารกับลูกค้า เช่น ข้อมูลการจัดส่ง วิธีการติดต่อกลับ หรือหมายเหตุต่างๆ"
              size="small"
              helperText="ข้อความนี้จะแสดงให้ลูกค้าเห็นในหน้าสถานะคำสั่งซื้อ"
            />
          </Box>
        </Paper>
        
        {/* Order Items */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          รายการสินค้า
        </Typography>
        
        {/* แสดงข้อความถึงลูกค้าจากแอดมิน (ถ้ามี) */}
        {order.adminComment !== undefined && order.adminComment !== null && order.adminComment !== '' && (
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
              {order.adminComment}
            </Typography>
          </Paper>
        )}
        
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
                          src={`${item.productImg}`} 
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
                    
                    {/* แสดงวันที่และเวลาจัดส่ง แยกแสดงชัดเจน */}
                    <Box>
                      <Typography variant="caption" color="text.secondary">วันที่จัดส่ง</Typography>
                      <Typography variant="body2">
                        {order.shippingInfo.deliveryDate && 
                          (typeof order.shippingInfo.deliveryDate === 'object') ? 
                            formatThaiDate(new Date(order.shippingInfo.deliveryDate as any)) : 
                            (typeof order.shippingInfo.deliveryDate === 'string' && 
                             order.shippingInfo.deliveryDate.trim() !== '' &&
                             JSON.stringify(order.shippingInfo.deliveryDate) !== '{}' &&
                             !isNaN(new Date(order.shippingInfo.deliveryDate).getTime()) ? 
                              formatThaiDate(new Date(order.shippingInfo.deliveryDate)) : 
                              'ไม่ระบุ')
                        }
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary">ช่วงเวลาจัดส่ง</Typography>
                      <Typography variant="body2">
                        {order.shippingInfo.deliveryTime || 'ไม่ระบุ'}
                      </Typography>
                    </Box>
                    
                    {/* แสดงข้อความในบัตรอวยพร (ถ้ามี) */}
                    {order.shippingInfo.cardMessage && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">ข้อความในบัตรอวยพร</Typography>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 1.5, 
                            mt: 0.5,
                            bgcolor: 'primary.lighter',
                            border: '1px dashed',
                            borderColor: 'primary.main',
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {order.shippingInfo.cardMessage}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                    
                  </>
                )}
              </Stack>
            </Paper>
          </Box>
        </Box>
        
        {/* Payment Information */}
        <Box sx={{ mt: 3, mb: isMobile ? 10 : 4 }}> {/* เพิ่ม bottom margin ให้มากขึ้น */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            ข้อมูลการชำระเงิน
          </Typography>
          
          <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: isMobile ? 4 : 2 }}> {/* เพิ่ม margin ให้กับ Paper */}
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
              <Box sx={{ mt: 2, mb: isMobile ? 4 : 2 }}> {/* เพิ่มระยะห่างด้านล่างเมื่อดูบนมือถือ */}
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
          
          {/* เพิ่ม Box ว่างด้านล่างเพื่อให้มีระยะห่างด้านล่างมากขึ้น */}
          {isMobile && (
            <Box sx={{ height: 20 }} />
          )}
        </Box>
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          p: 0,
          m: 0, 
          bgcolor: '#f8f9fa',
          justifyContent: 'space-between',
          position: isMobile ? 'fixed' : 'static',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '2px solid',
          borderColor: '#ebedf0',
          zIndex: 100, // เพิ่ม z-index ให้สูงขึ้น
          boxShadow: isMobile ? '0px -4px 12px rgba(0,0,0,0.05)' : 'none',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          width: '100%', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 2 }
        }}>
          {onDeleteOrder && (
            <Button
              onClick={() => setDeleteConfirmOpen(true)}
              color="error"
              startIcon={<DeleteIcon />}
              variant="outlined"
              size="medium"
              sx={{ 
                order: { xs: 2, sm: 1 },
                width: { xs: '100%', sm: 'auto' },
                borderRadius: '4px',
                fontWeight: 500,
                boxShadow: 'none',
                borderColor: 'rgba(211, 47, 47, 0.5)',
                px: { xs: 2, sm: 2 },
                py: 1
              }}
            >
              ลบคำสั่งซื้อ
            </Button>
          )}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1.5,
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 },
              ml: { xs: 0, sm: 'auto' }
            }}
          >
            <Button 
              onClick={onClose} 
              color="inherit" 
              size="medium"
              variant="outlined"
              sx={{ 
                fontWeight: 500,
                flex: { xs: 1, sm: 'none' },
                borderRadius: '4px',
                px: { xs: 2, sm: 3 },
                py: 1,
                borderColor: '#dee2e6'
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleUpdateStatus}
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              size="medium"
              sx={{ 
                fontWeight: 500,
                flex: { xs: 2, sm: 'none' },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '4px',
                px: { xs: 2, sm: 3 },
                py: 1,
                minWidth: '120px'
              }}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </Box>
        </Box>
      </DialogActions>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          p: { xs: 2, sm: 2.5 },
          borderBottom: '2px solid',
          borderColor: '#ebedf0',
          bgcolor: '#f8f9fa'
        }}>
          <WarningIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>ยืนยันการลบคำสั่งซื้อ</Typography>
          {isMobile && (
            <IconButton 
              onClick={() => setDeleteConfirmOpen(false)} 
              size="small" 
              sx={{ 
                ml: 'auto',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
          <Typography variant="body1" gutterBottom fontWeight={500}>
            คุณต้องการลบคำสั่งซื้อ #{order?.orderNumber} ใช่หรือไม่?
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(211, 47, 47, 0.05)', borderRadius: 1 }}>
            การดำเนินการนี้ไม่สามารถยกเลิกได้ และข้อมูลทั้งหมดที่เกี่ยวข้องกับคำสั่งซื้อนี้จะถูกลบออกจากระบบ
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2.5,
          pt: 2,
          pb: 2.5,
          borderTop: '2px solid',
          borderColor: '#ebedf0',
          flexWrap: 'wrap',
          gap: 1.5,
          bgcolor: '#f8f9fa',
          justifyContent: 'flex-end'
        }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            color="inherit"
            variant="outlined"
            size="medium"
            sx={{ 
              minWidth: { xs: '100%', sm: '120px' },
              borderRadius: '4px',
              fontWeight: 500,
              borderColor: '#dee2e6',
              py: 1
            }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleDeleteOrder} 
            color="error" 
            variant="contained"
            size="medium"
            sx={{ 
              minWidth: { xs: '100%', sm: '120px' },
              boxShadow: '0 2px 4px rgba(211, 47, 47, 0.2)',
              borderRadius: '4px',
              fontWeight: 500,
              py: 1
            }}
          >
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
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: { xs: 1.5, sm: 2 },
          bgcolor: '#f9f9f9'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>หลักฐานการชำระเงิน</Typography>
          <IconButton 
            onClick={() => setShowImageModal(false)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 'calc(100% - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
          {paymentImage && (
            <Box 
              component="img" 
              src={paymentImage}
              alt="หลักฐานการชำระเงิน"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
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
