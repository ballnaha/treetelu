'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Chip, 
  CircularProgress, 
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// กำหนดรูปแบบข้อมูลที่ได้จาก API
interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingInfo {
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

interface PaymentInfo {
  method: string;
  status: string;
}

interface PaymentConfirmation {
  id: number;
  orderNumber: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  transferDate: string;
  transferTime: string;
  slipImage?: string;
  createdAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  createdAt: string;
  customerInfo: CustomerInfo;
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  orderItems: OrderItem[];
  paymentConfirmations?: PaymentConfirmation[];
}

// คอมโพเน้นต์สำหรับหน้าใบเสร็จ
export default function ReceiptClient({ orderNumber }: { orderNumber: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const router = useRouter();

  // ฟังก์ชันสำหรับฟอร์แมตราคา
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(price);
  };

  // ฟังก์ชันสำหรับฟอร์แมตวันที่
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  // ฟังก์ชันสำหรับดาวน์โหลดใบเสร็จเป็น PDF
  const downloadReceipt = async () => {
    if (!order) return;
    
    const receiptElement = document.getElementById('receipt');
    if (!receiptElement) return;
    
    try {
      // แสดงข้อความกำลังสร้าง PDF
      setLoading(true);
      
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ใบเสร็จ-${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('ไม่สามารถสร้างไฟล์ PDF ได้ โปรดลองอีกครั้งในภายหลัง');
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลออเดอร์จาก API
  useEffect(() => {
    async function fetchOrderData() {
      setLoading(true);
      setError(null);
      
      try {
        // เรียกใช้ API เพื่อดึงข้อมูลออเดอร์
        const response = await fetch(`/api/admin/orders?orderId=${orderNumber}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.order) {
          throw new Error(data.message || 'ไม่พบข้อมูลคำสั่งซื้อ');
        }
        
        setOrder(data.order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    }
    
    if (orderNumber) {
      fetchOrderData();
    }
  }, [orderNumber]);

  // ฟังก์ชันสำหรับกลับไปหน้าประวัติการสั่งซื้อ
  const goToOrderHistory = () => {
    router.push('/order-history');
  };

  // แสดงข้อความกำลังโหลด
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>กำลังโหลดข้อมูลใบเสร็จ...</Typography>
      </Container>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={goToOrderHistory}
        >
          กลับไปหน้าประวัติการสั่งซื้อ
        </Button>
      </Container>
    );
  }

  // แสดงข้อความเมื่อไม่พบข้อมูลออเดอร์
  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          ไม่พบข้อมูลคำสั่งซื้อ
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={goToOrderHistory}
        >
          กลับไปหน้าประวัติการสั่งซื้อ
        </Button>
      </Container>
    );
  }

  // สร้าง element ใบเสร็จ
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={goToOrderHistory}
        sx={{ mb: 3 }}
      >
        กลับไปหน้าประวัติการสั่งซื้อ
      </Button>
      
      <Paper 
        elevation={2} 
        sx={{ p: { xs: 2, sm: 4 }, mb: 4 }}
        id="receipt"
      >
        {/* ส่วนหัว */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            ใบเสร็จรับเงิน
          </Typography>
          <Typography variant="body1" gutterBottom>
            Tree Telu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            เลขที่ออเดอร์: {order.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            วันที่: {formatDate(order.createdAt)}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* ข้อมูลลูกค้า */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
            ข้อมูลลูกค้า
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <Typography variant="body2" color="text.secondary">
                ชื่อ-นามสกุล
              </Typography>
              <Typography variant="body1">
                {order.customerInfo.firstName} {order.customerInfo.lastName}
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <Typography variant="body2" color="text.secondary">
                อีเมล
              </Typography>
              <Typography variant="body1">
                {order.customerInfo.email}
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <Typography variant="body2" color="text.secondary">
                เบอร์โทรศัพท์
              </Typography>
              <Typography variant="body1">
                {order.customerInfo.phone}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* ที่อยู่จัดส่ง */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
            ที่อยู่จัดส่ง
          </Typography>
          <Typography variant="body1">
            {order.shippingInfo.address}
          </Typography>
          <Typography variant="body1">
            {order.shippingInfo.subdistrict} {order.shippingInfo.district}
          </Typography>
          <Typography variant="body1">
            {order.shippingInfo.province} {order.shippingInfo.postalCode}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* รายการสินค้า */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            รายการสินค้า
          </Typography>
          
          {order.orderItems.map((item) => (
            <Box 
              key={item.id} 
              sx={{ 
                display: 'flex', 
                py: 1.5, 
                borderBottom: '1px solid', 
                borderColor: 'divider' 
              }}
            >
              <Box 
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mr: 2, 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.default',
                  flexShrink: 0
                }}
              >
                {item.image ? (
                  <Box 
                    component="img" 
                    src={`/images/product/${item.image}`}
                    alt={item.name}
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/no-image.png';
                    }}
                  />
                ) : (
                  <Box 
                    component="img" 
                    src="/images/no-image.png"
                    alt={item.name}
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">
                  {item.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatPrice(item.price)} x {item.quantity}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatPrice(item.price * item.quantity)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
        
        {/* สรุปยอดเงิน */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">ยอดรวมสินค้า</Typography>
            <Typography variant="body1">
              {formatPrice(order.totalAmount - order.shippingFee)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">ค่าจัดส่ง</Typography>
            <Typography variant="body1">
              {formatPrice(order.shippingFee)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>ยอดรวมทั้งสิ้น</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formatPrice(order.totalAmount)}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* ข้อมูลการชำระเงิน */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
            ข้อมูลการชำระเงิน
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <Typography variant="body2" color="text.secondary">
                วิธีการชำระเงิน
              </Typography>
              <Typography variant="body1">
                {order.paymentInfo.method === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : order.paymentInfo.method}
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <Typography variant="body2" color="text.secondary">
                สถานะการชำระเงิน
              </Typography>
              <Chip 
                label={
                  order.paymentInfo.status === 'CONFIRMED' ? 'ชำระเงินแล้ว' : 
                  order.paymentInfo.status === 'PENDING' ? 'รอตรวจสอบ' : 
                  order.paymentInfo.status === 'REJECTED' ? 'การชำระเงินถูกปฏิเสธ' : 
                  order.paymentInfo.status
                }
                color={
                  order.paymentInfo.status === 'CONFIRMED' ? 'success' : 
                  order.paymentInfo.status === 'PENDING' ? 'warning' : 
                  order.paymentInfo.status === 'REJECTED' ? 'error' : 
                  'default'
                }
                size="small"
              />
            </Box>
          </Box>
          
          {/* ข้อมูลการแจ้งชำระเงิน (ถ้ามี) */}
          {order.paymentConfirmations && order.paymentConfirmations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                รายละเอียดการโอนเงิน
              </Typography>
              {order.paymentConfirmations.map((confirmation, index) => (
                <Box key={confirmation.id} sx={{ mb: index < order.paymentConfirmations!.length - 1 ? 2 : 0 }}>
                  <Typography variant="body2">
                    ธนาคาร: {confirmation.bankName}
                  </Typography>
                  <Typography variant="body2">
                    จำนวนเงิน: {formatPrice(confirmation.amount)}
                  </Typography>
                  <Typography variant="body2">
                    วันที่โอน: {new Date(confirmation.transferDate).toLocaleDateString('th-TH')} {confirmation.transferTime}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        
        {/* ข้อความลงท้าย */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            ขอบคุณที่ใช้บริการ Tree Telu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            หากมีข้อสงสัยกรุณาติดต่อ shop@treetelu.com
          </Typography>
        </Box>
      </Paper>
      
      {/* ปุ่มดาวน์โหลด PDF */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadReceipt}
          disabled={loading}
        >
          ดาวน์โหลดใบเสร็จ (PDF)
        </Button>
      </Box>
    </Container>
  );
} 