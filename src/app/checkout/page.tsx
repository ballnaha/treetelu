// เพิ่ม type definition สำหรับ Stripe
declare global {
  interface Window {
    // ไม่จำเป็นต้องมี OmiseCard ต่อไป
  }
}

"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  FormControl, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Stepper, 
  Step, 
  StepLabel,
  StepContent,
  Alert, 
  Collapse,
  CircularProgress,
  IconButton,
  TextField,
  Tab,
  Tabs,
  Stack,
  Dialog,
  DialogContent,
  Zoom,
  Fade,
  Backdrop
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AddressForm from '@/components/AddressForm';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import thLocale from 'date-fns/locale/th';
import { format } from 'date-fns';
import { validateEmail, validateThaiPhone, validateZipCode } from '@/utils/validationUtils';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InfoIcon from '@mui/icons-material/Info';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { loadStripe } from '@stripe/stripe-js';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';



// สร้าง styled components
const ProductImageWrapper = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  flexShrink: 0,
  border: `1px solid ${theme.palette.divider}`,
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  position: 'relative',
  paddingBottom: theme.spacing(2),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  }
}));

const OrderSummaryContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
}));

const steps = [
  {
    label: 'ข้อมูลการจัดส่ง',
    icon: <LocalShippingIcon />,
  },
  {
    label: 'วิธีการชำระเงิน',
    icon: <PaymentIcon />,
  },
  {
    label: 'ยืนยันคำสั่งซื้อ',
    icon: <VerifiedOutlinedIcon />,
  },
];

const TabPanel = (props: { children: React.ReactNode; value: number; index: number }) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shipping-tabpanel-${index}`}
      aria-labelledby={`shipping-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default function Checkout() {
  const { cartItems, removeItem, clearCart, getTotalPrice, getTotalItems, updateQuantity } = useCart();
  const { user } = useAuth(); // ดึงข้อมูลผู้ใช้จาก AuthContext
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  
  // เพิ่ม state สำหรับการแสดง Stripe redirect dialog
  const [showStripeRedirectDialog, setShowStripeRedirectDialog] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const redirectCountdownRef = useRef<any>(null);
  
  // เพิ่ม state สำหรับ Stripe session
  const [currentCheckoutSession, setCurrentCheckoutSession] = useState<any>(null);
  
  // รีเฟอเรนซ์สำหรับการโพลลิ่ง
  const paymentPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // เพิ่ม state สำหรับส่วนลด
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [hasDiscountError, setHasDiscountError] = useState(false);
  const [discountErrorMsg, setDiscountErrorMsg] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountDetails, setDiscountDetails] = useState<any>(null);
  
  // เพิ่ม state สำหรับ PromptPay QR code
  const [promptpayQrCode, setPromptpayQrCode] = useState<string | null>(null);
  
  // เพิ่ม state สำหรับ dialog ของ PromptPay
  const [openPromptPayDialog, setOpenPromptPayDialog] = useState(false);
  
  // เพิ่ม state สำหรับแสดง overlay รอการตอบกลับจาก webhook Omise
  const [showPromptPayWaitingOverlay, setShowPromptPayWaitingOverlay] = useState(false);
  
  // เพิ่ม state สำหรับแสดง overlay ระหว่างรอ QR code
  const [showPromptPayLoadingOverlay, setShowPromptPayLoadingOverlay] = useState(false);
  
  // เพิ่ม state สำหรับแสดง overlay ระหว่างรอผลการชำระเงินด้วยบัตรเครดิต/เดบิต
  const [showCreditCardWaitingOverlay, setShowCreditCardWaitingOverlay] = useState(false);
  
  // ใช้ useRef เพื่อป้องกันการเรียก setState ซ้ำซ้อน
  const initialRenderRef = useRef(true);
  
  // เพิ่มตัวแปรสำหรับการโพลลิ่งตรวจสอบสถานะการชำระเงิน
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const MAX_POLLING_COUNT = 10; // ตรวจสอบสูงสุด 10 ครั้ง
  
  // ใช้ useRef เพื่อจัดการกับการแปลงราคา
  const formattedPriceRef = useRef<string | null>(null);
  
  // เตรียม Stripe instance
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');
  
  // เปิด-ปิด Dialog QR Code
  const handleOpenQRDialog = () => {
    setOpenQRDialog(true);
  };
  
  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
  };
  
  // เพิ่มฟังก์ชันสำหรับเปิด/ปิด dialog ของ PromptPay
  const handleOpenPromptPayDialog = () => {
    setOpenPromptPayDialog(true);
  };
  
  const handleClosePromptPayDialog = () => {
    setOpenPromptPayDialog(false);
  };
  
  // ข้อมูลผู้สั่ง
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // ตัวเลือกจัดส่ง
  const [shippingTab, setShippingTab] = useState(0);
  const [shippingOption, setShippingOption] = useState('self');
  
  // ข้อมูลผู้รับ (กรณีจัดส่งให้ผู้อื่น)
  const [receiverInfo, setReceiverInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });
  
  // ข้อความเพิ่มเติม
  const [additionalMessage, setAdditionalMessage] = useState('');
  
  // เพิ่ม state สำหรับวันและเวลาที่จัดส่ง และข้อความในการ์ด
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<Date | null>(null);
  const [cardMessage, setCardMessage] = useState('');
  
  const [shippingInfo, setShippingInfo] = useState<{
    receiverName?: string;
    receiverLastname?: string;
    provinceId?: number;
    provinceName?: string;
    amphureId?: number;
    amphureName?: string;
    tambonId?: number;
    tambonName?: string;
    zipCode?: string;
    addressLine?: string;
    addressLine2?: string;
  }>({});
  const [orderNumber, setOrderNumber] = useState<string>('');

  // จำนวนสินค้า (ใช้ useMemo เพื่อป้องกันการคำนวณซ้ำ)
  const totalItems = useMemo(() => {
    return getTotalItems();
  }, [getTotalItems]);

  // คำนวณราคารวมโดยใช้ useMemo เพื่อป้องกันการคำนวณซ้ำโดยไม่จำเป็น
  const prices = useMemo(() => {
    if (!isMounted) return { subtotal: 0, shippingCost: 0, discount: 0, totalPrice: 0 };
    
    const subtotal = getTotalPrice();
    // ฟรีค่าจัดส่งเมื่อซื้อสินค้ามากกว่าหรือเท่ากับ 1,500 บาท
    const shippingCost = subtotal >= 1500 ? 0 : 100;
    const totalBeforeDiscount = subtotal + shippingCost;
    const totalPrice = totalBeforeDiscount - discountAmount;
    
    return { subtotal, shippingCost, discount: discountAmount, totalPrice };
  }, [getTotalPrice, isMounted, discountAmount]);

  // เพิ่มฟังก์ชันล้างโค้ดส่วนลด
  const handleClearDiscount = useCallback(() => {
    setDiscountCode('');
    setDiscountAmount(0);
    setHasDiscountError(false);
    setDiscountErrorMsg('');
    setDiscountDetails(null);
  }, []);

  // เพิ่ม useEffect เพื่อตรวจสอบส่วนลดซ้ำเมื่อมีการเปลี่ยนแปลงในตะกร้าสินค้า
  useEffect(() => {
    // ถ้ามีรหัสส่วนลดและมีการเปลี่ยนแปลงในตะกร้าสินค้า ให้ตรวจสอบส่วนลดใหม่
    if (discountAmount > 0 && discountCode) {
      (async () => {
        try {
          // เรียกใช้ API เพื่อตรวจสอบและคำนวณส่วนลดใหม่
          const response = await fetch('/api/discount/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code: discountCode,
              cartTotal: prices.subtotal
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            // อัพเดตส่วนลด ถ้ามีการเปลี่ยนแปลง
            if (data.discountAmount !== discountAmount) {
              setDiscountAmount(data.discountAmount);
              setDiscountDetails(data.discount);
            }
          } else {
            // ถ้าส่วนลดไม่ถูกต้องอีกต่อไป (เช่น ยอดต่ำกว่ายอดขั้นต่ำในการใช้โค้ด)
            handleClearDiscount();
            setHasDiscountError(true);
            setDiscountErrorMsg(data.message || 'รหัสส่วนลดไม่สามารถใช้ได้กับยอดสั่งซื้อปัจจุบัน');
          }
        } catch (error) {
          console.error('Error revalidating discount code:', error);
        }
      })();
    }
  }, [prices.subtotal, discountCode, discountAmount, handleClearDiscount, cartItems]);

  // ตรวจสอบว่าตะกร้าว่างเปล่าหรือไม่
  const isCartEmpty = useMemo(() => {
    return !cartItems || cartItems.length === 0;
  }, [cartItems]);

    // เลื่อนหน้าไปด้านบนสุดเมื่อคอมโพเนนต์โหลด
    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

  // ใช้ useEffect เพื่อตรวจสอบตะกร้าสินค้าเมื่อ component mount เท่านั้น
  useEffect(() => {
    if (initialRenderRef.current) {
      setIsMounted(true);
      setIsClient(true);
      initialRenderRef.current = false;
    }
  }, []);

  // ฟังก์ชัน handleAddressChange สำหรับ AddressForm
  const handleAddressChange = (address: {
    receiverName?: string;
    receiverLastname?: string;
    provinceId?: number;
    provinceName?: string;
    amphureId?: number;
    amphureName?: string;
    tambonId?: number;
    tambonName?: string;
    zipCode?: string;
    addressLine?: string;
    addressLine2?: string;
  }) => {
    // ถ้าเป็นการจัดส่งให้ตัวเอง ให้ใช้ชื่อจากข้อมูลผู้สั่ง
    if (shippingTab === 0) {
      // เก็บค่า zipCode ไว้ใน state ด้วย
      setShippingInfo({
        ...address,
        receiverName: customerInfo.firstName,
        receiverLastname: customerInfo.lastName,
        provinceId: address.provinceId,
        provinceName: address.provinceName,
        amphureId: address.amphureId,
        amphureName: address.amphureName,
        tambonId: address.tambonId,
        tambonName: address.tambonName,
        zipCode: address.zipCode
      });
    } else {
      setShippingInfo(address);
    }
  };
  
  // จัดการการเปลี่ยนแปลงข้อมูลผู้สั่ง
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // จัดการการเปลี่ยนแปลงตัวเลือกจัดส่ง (Tabs)
  const handleShippingTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (shippingTab !== newValue) {
      setShippingTab(newValue);
      setShippingOption(newValue === 0 ? 'self' : 'other');
    }
  };
  
  // จัดการการเปลี่ยนแปลงข้อมูลผู้รับ
  const handleReceiverInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReceiverInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // จัดการการเปลี่ยนแปลงข้อความเพิ่มเติม
  const handleAdditionalMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalMessage(e.target.value);
  };

  // จัดการการเปลี่ยนแปลงวันที่จัดส่ง
  const handleDeliveryDateChange = (newValue: Date | null) => {
    setDeliveryDate(newValue);
  };

  // จัดการการเปลี่ยนแปลงเวลาที่จัดส่ง
  const handleDeliveryTimeChange = (newValue: Date | null) => {
    setDeliveryTime(newValue);
  };

  // จัดการการเปลี่ยนแปลงข้อความในการ์ด
  const handleCardMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardMessage(e.target.value);
  };

  // ลบฟังก์ชัน handleOmisePayment

  // เพิ่มฟังก์ชัน handleStripePayment
  const handleStripePayment = async () => {
    try {
      //console.log('เริ่มกระบวนการชำระเงินด้วย Stripe');
      setIsSubmitting(true);
      setShowStripeRedirectDialog(true);
      
      //console.log('แสดง Dialog นับถอยหลัง', showStripeRedirectDialog);
      
      // แสดงข้อความกำลังดำเนินการ
      setAlertMessage('กำลังเชื่อมต่อไปยัง Stripe เพื่อทำการชำระเงิน...');
      // เปลี่ยนเป็นการใช้ Info Alert แทน Error Alert
      setShowAlert(true);
      
      // กำหนดประเภทการชำระเงิน
      const isPromptPay = paymentMethod === 'stripe_promptpay';
      const paymentTypeText = isPromptPay ? 'PromptPay' : 'บัตรเครดิต/เดบิต';
      
      // ปรับข้อความตามวิธีการชำระเงิน
      setAlertMessage(`กำลังเชื่อมต่อไปยัง Stripe เพื่อชำระเงินด้วย${paymentTypeText}...`);
      
      // ตรวจสอบข้อมูลลูกค้า
      if (
        !customerInfo.firstName || 
        !customerInfo.lastName || 
        !customerInfo.email || 
        !customerInfo.phone
      ) {
        setShowStripeRedirectDialog(false); // ปิด Dialog หากข้อมูลไม่ครบ
        throw new Error('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน');
      }
      
      // ตรวจสอบข้อมูลการจัดส่ง
      if (shippingTab === 0) {
        // จัดส่งให้ตัวเอง
        if (
          !shippingInfo.addressLine || 
          !shippingInfo.zipCode
        ) {
          setShowStripeRedirectDialog(false); // ปิด Dialog หากข้อมูลไม่ครบ
          throw new Error('กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน');
        }
        
        if (
          !shippingInfo.provinceId || 
          !shippingInfo.amphureId || 
          !shippingInfo.tambonId
        ) {
          setShowStripeRedirectDialog(false); // ปิด Dialog หากข้อมูลไม่ครบ
          throw new Error('กรุณาเลือกจังหวัด อำเภอ และตำบลให้ครบถ้วน');
        }
      } else {
        // จัดส่งให้ผู้อื่น
        if (
          !receiverInfo.firstName || 
          !receiverInfo.lastName || 
          !receiverInfo.phone || 
          !receiverInfo.address
        ) {
          setShowStripeRedirectDialog(false); // ปิด Dialog หากข้อมูลไม่ครบ
          throw new Error('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
        }
      }
      
      // เรียกใช้ API เพื่อสร้าง Stripe Checkout Session
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
      const cancelUrl = `${baseUrl}/checkout/cancel`;
      
      const response = await fetch('/api/stripe/checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customerInfo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone,
                  note: additionalMessage || ""
                },
                shippingInfo: shippingTab === 0 
                  ? {
                      receiverName: customerInfo.firstName || "",
                      receiverLastname: customerInfo.lastName || "",
                      receiverPhone: customerInfo.phone || "",
                      addressLine: shippingInfo.addressLine || "",
                      addressLine2: shippingInfo.addressLine2 || "",
                      provinceId: shippingInfo.provinceId || 0,
                      provinceName: shippingInfo.provinceName || "",
                      amphureId: shippingInfo.amphureId || 0,
                      amphureName: shippingInfo.amphureName || "",
                      tambonId: shippingInfo.tambonId || 0,
                      tambonName: shippingInfo.tambonName || "",
                      zipCode: shippingInfo.zipCode || "",
                      deliveryDate: deliveryDate && isClient ? format(new Date(deliveryDate), 'yyyy-MM-dd') : "",
                      deliveryTime: deliveryTime && isClient ? format(deliveryTime, 'HH:mm') : "",
                      cardMessage: cardMessage || "",
                      additionalNote: additionalMessage || ""
                    }
                  : {
                      receiverName: receiverInfo.firstName || "",
                      receiverLastname: receiverInfo.lastName || "",
                      receiverPhone: receiverInfo.phone || "",
                      addressLine: receiverInfo.address || "",
                      addressLine2: "",
                      // สำหรับจัดส่งให้ผู้อื่น ใช้ค่า ID ที่มีอยู่จริงใน database (กรุงเทพฯ)
                      provinceId: 1, // ใช้ ID จังหวัดกรุงเทพมหานครที่มีอยู่จริง
                      provinceName: "จัดส่งให้ผู้รับโดยตรง",
                      amphureId: 1001, // ใช้ ID อำเภอที่มีอยู่จริง
                      amphureName: "จัดส่งให้ผู้รับโดยตรง",
                      tambonId: 100101, // ใช้ ID ตำบลที่มีอยู่จริง
                      tambonName: "จัดส่งให้ผู้รับโดยตรง",
                      zipCode: "10200",
                      deliveryDate: deliveryDate && isClient ? format(new Date(deliveryDate), 'yyyy-MM-dd') : "",
                      deliveryTime: deliveryTime && isClient ? format(deliveryTime, 'HH:mm') : "",
                      cardMessage: cardMessage || "",
                      additionalNote: additionalMessage || ""
                    },
                items: cartItems.map(item => ({
                  productId: parseInt(String(item.id)),
                  productName: item.productName || item.name || 'สินค้า',
                  productImg: item.image || "",
                  quantity: Math.max(1, Math.round(item.quantity || 1)), // ตรวจสอบให้เป็นจำนวนเต็มบวกเสมอ
                  unitPrice: Math.max(0.01, parseFloat(String(item.salesPrice || item.price || 0)))
                })),
                paymentMethod: 'CREDIT_CARD',
          paymentMethodType: paymentMethod === 'stripe_promptpay' ? 'promptpay' : 'card', // เพิ่มข้อมูลประเภทการชำระเงิน
          userId: user?.id || null,
                discount: prices.discount || 0,
                discountCode: discountCode || "",
                paymentStatus: 'PENDING',
          // เพิ่ม URL สำหรับกรณียกเลิกหรือกลับจาก Stripe
          cancelUrl: cancelUrl
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
        setShowStripeRedirectDialog(false); // ปิด Dialog เมื่อเกิดข้อผิดพลาด
        throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้าง Stripe session ได้');
            }

            const result = await response.json();
            
      // เก็บข้อมูล orderNumber และ orderId จากการตอบกลับ
            if (result.orderNumber) {
              setOrderNumber(result.orderNumber);
      }
      
      if (result.orderId) {
        // บันทึก orderId ถ้าจำเป็น
        console.log('Order ID:', result.orderId);
      }
      
      // ถ้ามีการใช้รหัสส่วนลด ให้เรียกใช้ API สำหรับเพิ่มจำนวนการใช้งาน
      if (discountAmount > 0 && discountCode && result.orderId) {
        try {
          await fetch('/api/discount/use', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              code: discountCode,
              orderId: result.orderId
          }),
        });
        } catch (error) {
          console.error('Error updating discount usage count:', error);
        }
      }

      // ล้างตะกร้าสินค้าหลังจากสร้าง order สำเร็จ
      clearCart();
      
      // ถ้ามี URL สำหรับการชำระเงิน ให้เปลี่ยนไปที่หน้า Stripe Checkout
      if (result.url) {
        // เก็บ URL ไว้เพื่อการ redirect
        setRedirectUrl(result.url);
      
        // redirect ไปยัง Stripe โดยตรง โดยไม่นับถอยหลัง
        //console.log('กำลังเปลี่ยนเส้นทางไปยัง Stripe URL:', result.url);
        // ไม่ต้องปิด Dialog - ให้ Dialog แสดงต่อเนื่องจนกว่าจะเปลี่ยนหน้า
        window.location.href = result.url;
        
        // เพิ่ม timeout เพื่อให้ overlay ยังคงแสดงระหว่างที่ browser เปลี่ยนหน้า
        setTimeout(() => {
          //console.log('หากยังไม่เปลี่ยนหน้า นี่คือ timeout หลังจากสั่ง redirect');
        }, 3000);
      } else {
        setShowStripeRedirectDialog(false); // ปิด Dialog เมื่อไม่พบ URL
        throw new Error('ไม่พบ URL สำหรับการชำระเงิน');
      }
      } catch (error) {
      console.error('Stripe payment error:', error);
      setIsSubmitting(false);
        setShowAlert(true);
      setShowStripeRedirectDialog(false); // ปิด Dialog เมื่อเกิดข้อผิดพลาด
      setAlertMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Stripe');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ลบฟังก์ชันโหลด Omise script
  useEffect(() => {
    // เซ็ต isClient เป็น true เพื่อแก้ปัญหา hydration error
    setIsClient(true);
    setIsMounted(true);
    
    // ล้าง interval เมื่อ component unmounts
    return () => {
      if (redirectCountdownRef.current) {
        clearInterval(redirectCountdownRef.current);
      }
    };
  }, []);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isReceiverPhone = false) => {
    const { value } = e.target;
    
    // ตรวจสอบว่าเป็นตัวเลขเท่านั้น
    if (value === '' || /^[0-9]*$/.test(value)) {
      if (isReceiverPhone) {
        // กรณีเป็นเบอร์โทรศัพท์ผู้รับ
        setReceiverInfo(prev => ({
          ...prev,
          phone: value
        }));
      } else {
        // กรณีเป็นเบอร์โทรศัพท์ผู้สั่ง
        setCustomerInfo(prev => ({
          ...prev,
          phone: value
        }));
      }
    }
  };

  // ฟังก์ชันสำหรับตรวจสอบและใช้โค้ดส่วนลด
  const handleApplyDiscount = useCallback(async () => {
    if (!discountCode.trim()) {
      setHasDiscountError(true);
      setDiscountErrorMsg('กรุณากรอกรหัสส่วนลด');
      return;
    }
    
    setIsApplyingDiscount(true);
    setHasDiscountError(false);
    
    try {
      // เรียกใช้ API เพื่อตรวจสอบและคำนวณส่วนลด
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: discountCode,
          cartTotal: prices.subtotal
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDiscountAmount(data.discountAmount);
        setDiscountDetails(data.discount);
        setHasDiscountError(false);
        setDiscountErrorMsg('');
      } else {
        setHasDiscountError(true);
        setDiscountErrorMsg(data.message || 'รหัสส่วนลดไม่ถูกต้อง');
        setDiscountAmount(0);
        setDiscountDetails(null);
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setHasDiscountError(true);
      setDiscountErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด');
      setDiscountAmount(0);
      setDiscountDetails(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  }, [discountCode, prices.subtotal]);

  const handleNext = () => {
    if (activeStep === 0) {
      const emailValidation = validateEmail(customerInfo.email);
      const phoneValidation = validateThaiPhone(customerInfo.phone);
      
      // ตรวจสอบข้อมูลผู้สั่งซื้อ
      if (!customerInfo.firstName || !customerInfo.lastName) {
        setShowAlert(true);
        setAlertMessage('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
        return;
      }
      
      if (!emailValidation.isValid) {
        setShowAlert(true);
        setAlertMessage(emailValidation.error || 'อีเมลไม่ถูกต้อง');
        return;
      }
      
      if (!phoneValidation.isValid) {
        setShowAlert(true);
        setAlertMessage(phoneValidation.error || 'เบอร์โทรศัพท์ไม่ถูกต้อง');
        return;
      }
      
      // ตรวจสอบข้อมูลที่อยู่จัดส่ง
      if (shippingTab === 0) {
        // กรณีจัดส่งให้ตัวเอง
        if (!shippingInfo.addressLine || !shippingInfo.provinceId || !shippingInfo.amphureId || !shippingInfo.tambonId) {
          setShowAlert(true);
          setAlertMessage('กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบถ้วน');
          return;
        }
        
        // ตรวจสอบรหัสไปรษณีย์
        if (shippingInfo.zipCode) {
          const zipValidation = validateZipCode(shippingInfo.zipCode);
          if (!zipValidation.isValid) {
            setShowAlert(true);
            setAlertMessage(zipValidation.error || 'รหัสไปรษณีย์ไม่ถูกต้อง');
            return;
          }
        } else {
          setShowAlert(true);
          setAlertMessage('กรุณาเลือกตำบลเพื่อระบุรหัสไปรษณีย์');
          return;
        }
      } else {
        // กรณีจัดส่งให้ผู้อื่น
        if (!receiverInfo.firstName || !receiverInfo.lastName || !receiverInfo.phone || !receiverInfo.address) {
          setShowAlert(true);
          setAlertMessage('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
          return;
        }
        
        // ตรวจสอบรูปแบบเบอร์โทรศัพท์ผู้รับ
        const receiverPhoneValidation = validateThaiPhone(receiverInfo.phone);
        if (!receiverPhoneValidation.isValid) {
          setShowAlert(true);
          setAlertMessage(receiverPhoneValidation.error || 'เบอร์โทรศัพท์ผู้รับไม่ถูกต้อง');
          return;
        }
        
        // ตรวจสอบวันที่จัดส่ง
        if (!deliveryDate) {
          setShowAlert(true);
          setAlertMessage('กรุณาเลือกวันที่ต้องการจัดส่ง');
          return;
        }
        
        // ตรวจสอบเวลาที่จัดส่ง
        if (!deliveryTime) {
          setShowAlert(true);
          setAlertMessage('กรุณาเลือกเวลาที่ต้องการจัดส่ง');
          return;
        }
        
        // ตรวจสอบว่าวันที่เลือกเป็นวันในอนาคต
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // เซ็ตเวลาเป็น 00:00:00 เพื่อเปรียบเทียบเฉพาะวันที่
        const selectedDate = new Date(deliveryDate);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < currentDate) {
          setShowAlert(true);
          setAlertMessage('วันที่จัดส่งต้องเป็นวันที่ในอนาคต');
          return;
        }
        
        // ตรวจสอบว่าวันที่เลือกไม่เกิน 30 วันนับจากวันนี้
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        maxDate.setHours(0, 0, 0, 0);
        
        if (selectedDate > maxDate) {
          setShowAlert(true);
          setAlertMessage('วันที่จัดส่งต้องไม่เกิน 30 วันนับจากวันนี้');
          return;
        }
      }
    } else if (activeStep === 1) {
      if (!paymentMethod) {
        setShowAlert(true);
        setAlertMessage('กรุณาเลือกวิธีการชำระเงิน');
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setShowAlert(false);
  };

  // ฟังก์ชันจัดการการคลิก Back
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setShowAlert(false);
  };

  // จัดการการเปลี่ยนแปลงวิธีการชำระเงิน
  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPaymentMethod(value);
    
    // ล้างข้อมูล Checkout Session และผลลัพธ์ QR code
    setCurrentCheckoutSession(null);
    setPromptpayQrCode(null);
    setRedirectUrl(null);
    
    // เมื่อเปลี่ยนวิธีการชำระเงิน
    setShowAlert(false);
    
    // รีเซ็ตการแสดง overlay
    setShowPromptPayWaitingOverlay(false);
    setShowPromptPayLoadingOverlay(false);
    setShowCreditCardWaitingOverlay(false);
    
    // หยุดการโพลลิ่ง
    if (paymentPollingRef.current) {
      clearInterval(paymentPollingRef.current);
      paymentPollingRef.current = null;
    }
    
    //console.log(`เปลี่ยนวิธีการชำระเงินเป็น: ${value}`);
  };

  // เพิ่มฟังก์ชันตรวจสอบสถานะการชำระเงิน PromptPay
  const checkPaymentStatus = useCallback(async (chargeId: string) => {
    try {
      if (!chargeId || !chargeId.startsWith('chrg_')) {
        return;
      }
      
      // เพิ่มพารามิเตอร์เพื่อป้องกัน caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/payment/verify?charge_id=${chargeId}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate'
        }
      });
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // ถ้าสถานะการชำระเงินเป็น successful หรือ CONFIRMED
        if (data.status === 'successful' || 
            (data.pendingPayment && data.pendingPayment.status === 'CONFIRMED') || 
            (data.order && data.order.paymentStatus === 'CONFIRMED')) {
          
          setPaymentStatus('CONFIRMED');
          
          // หยุดการโพลลิ่ง
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setPaymentPolling(false);
        }
      }
      
      // เพิ่มจำนวนครั้งที่ตรวจสอบ
      setPollingCount(prev => prev + 1);
      
      // ถ้าตรวจสอบครบ MAX_POLLING_COUNT ครั้งแล้ว ให้หยุดการโพลลิ่ง
      if (pollingCount >= MAX_POLLING_COUNT) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setPaymentPolling(false);
      }
    } catch (error) {
    }
  }, [pollingCount]);

  // เริ่มการโพลลิ่งสำหรับ PromptPay เมื่อแสดงหน้ารอการตรวจสอบการชำระเงิน
  useEffect(() => {
    // ตรวจสอบเมื่อขั้นตอนการชำระเงินเสร็จสิ้น และเป็นการชำระเงินด้วย PromptPay และไม่ได้กำลังโพลลิ่ง
    if (orderComplete && paymentMethod === 'promptpay' && !paymentPolling) {
      setPaymentPolling(true);
      setPollingCount(0);
      
      // ตรวจสอบสถานะการชำระเงินทันที
      checkPaymentStatus("");
      
      // กำหนดการตรวจสอบทุก 10 วินาที
      pollingIntervalRef.current = setInterval(() => {
        checkPaymentStatus("");
      }, 10000); // 10 วินาที
      
      // หยุดการโพลลิ่งเมื่อคอมโพเนนต์ถูกทำลาย
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [orderComplete, paymentMethod, paymentPolling, checkPaymentStatus]);

  // จัดการการสั่งซื้อ
  const handlePlaceOrder = async () => {
    try {
      if (isSubmitting) return;
    
      setIsSubmitting(true);
    setShowAlert(false);
      
      // ตรวจสอบว่าต้องดำเนินการผ่าน Stripe หรือไม่
      if (paymentMethod === 'stripe' || paymentMethod === 'stripe_promptpay') {
        await handleStripePayment();
        return;
      }

      // ตรวจสอบข้อมูลลูกค้า
      if (
        !customerInfo.firstName || 
        !customerInfo.lastName || 
        !customerInfo.email || 
        !customerInfo.phone
      ) {
        throw new Error('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน');
      }
      
      // ตรวจสอบข้อมูลการจัดส่ง
      if (shippingTab === 0) {
        // จัดส่งให้ตัวเอง
        if (!shippingInfo.addressLine || !shippingInfo.zipCode) {
          throw new Error('กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน');
        }
        
        if (!shippingInfo.provinceId || !shippingInfo.amphureId || !shippingInfo.tambonId) {
          throw new Error('กรุณาเลือกจังหวัด อำเภอ และตำบลให้ครบถ้วน');
        }
      } else {
        // จัดส่งให้ผู้อื่น
        if (
          !receiverInfo.firstName || 
          !receiverInfo.lastName || 
          !receiverInfo.phone || 
          !receiverInfo.address
        ) {
          throw new Error('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
        }
      }
      
      // ตรวจสอบวิธีการชำระเงิน
      if (!paymentMethod) {
        throw new Error('กรุณาเลือกวิธีการชำระเงิน');
      }
      
      // เรียกใช้ฟังก์ชันตามวิธีการชำระเงิน
      if (paymentMethod === 'credit_card' || paymentMethod === 'promptpay') {
        // ลบการเรียกใช้ handleOmisePayment
        // ในกรณีปุ่มถูกคลิก แสดงข้อความแจ้งเตือนให้ทราบว่าวิธีการชำระเงินนี้ถูกยกเลิกแล้ว
        setShowAlert(true);
        setAlertMessage('วิธีการชำระเงินนี้ไม่รองรับแล้ว กรุณาเลือกวิธีการชำระเงินอื่น');
        setIsSubmitting(false);
        return;
      } else if (paymentMethod === 'stripe' || paymentMethod === 'stripe_promptpay') {
        // เรียกใช้งานฟังก์ชัน handleStripePayment โดยตรง โดยไม่ต้องรอ async function
        //console.log('เรียกใช้งานฟังก์ชัน handleStripePayment');
        handleStripePayment();
        return;
      }
      
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const orderData = {
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          note: additionalMessage || ""
        },
        shippingInfo: shippingTab === 0 
          ? {
              receiverName: customerInfo.firstName || "",
              receiverLastname: customerInfo.lastName || "",
              receiverPhone: customerInfo.phone || "",
              addressLine: shippingInfo.addressLine || "",
              addressLine2: shippingInfo.addressLine2 || "",
              provinceId: shippingInfo.provinceId || 0,
              provinceName: shippingInfo.provinceName || "",
              amphureId: shippingInfo.amphureId || 0,
              amphureName: shippingInfo.amphureName || "",
              tambonId: shippingInfo.tambonId || 0,
              tambonName: shippingInfo.tambonName || "",
              zipCode: shippingInfo.zipCode || "",
              deliveryDate: deliveryDate && isClient ? format(new Date(deliveryDate), 'yyyy-MM-dd') : "",
              deliveryTime: deliveryTime && isClient ? format(deliveryTime, 'HH:mm') : "",
              cardMessage: cardMessage || "",
              additionalNote: additionalMessage || ""
            }
          : {
              receiverName: receiverInfo.firstName || "",
              receiverLastname: receiverInfo.lastName || "",
              receiverPhone: receiverInfo.phone || "",
              addressLine: receiverInfo.address || "",
              addressLine2: "",
              // สำหรับจัดส่งให้ผู้อื่น ใช้ค่า ID ที่มีอยู่จริงใน database (กรุงเทพฯ)
              provinceId: 1, // ใช้ ID จังหวัดกรุงเทพมหานครที่มีอยู่จริง
              provinceName: "จัดส่งให้ผู้รับโดยตรง",
              amphureId: 1, // ใช้ ID อำเภอที่มีอยู่จริง
              amphureName: "จัดส่งให้ผู้รับโดยตรง",
              tambonId: 1, // ใช้ ID ตำบลที่มีอยู่จริง
              tambonName: "จัดส่งให้ผู้รับโดยตรง",
              zipCode: "10200",
              deliveryDate: deliveryDate && isClient ? format(new Date(deliveryDate), 'yyyy-MM-dd') : "",
              deliveryTime: deliveryTime && isClient ? format(deliveryTime, 'HH:mm') : "",
              cardMessage: cardMessage || "",
              additionalNote: additionalMessage || ""
            },
        items: cartItems.map(item => ({
          productId: parseInt(String(item.id)),
          productName: item.productName || item.name || 'สินค้า',
          productImg: item.image || "",
          quantity: Math.max(1, Math.round(item.quantity || 1)), // ตรวจสอบให้เป็นจำนวนเต็มบวกเสมอ
          unitPrice: Math.max(0.01, parseFloat(String(item.salesPrice || item.price || 0)))
        })),
        paymentMethod: 'BANK_TRANSFER', // เปลี่ยนเป็น BANK_TRANSFER ตาม enum ของ API
        userId: user?.id || null, // เพิ่ม userId จาก AuthContext
        discount: prices.discount || 0,
        discountCode: discountCode || "",
        paymentStatus: 'PENDING'
      };
      
      // ถ้ามีการใช้รหัสส่วนลด ให้เรียกใช้ API สำหรับเพิ่มจำนวนการใช้งาน
      if (discountAmount > 0 && discountCode) {
        try {
          await fetch('/api/discount/use', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code: discountCode 
            }),
          });
        } catch (error) {
          console.error('Error updating discount usage count:', error);
        }
      }
      
      // ส่งข้อมูลการสั่งซื้อไปยัง API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`เกิดข้อผิดพลาดในการสั่งซื้อ: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('การตอบกลับจากเซิร์ฟเวอร์ไม่ใช่รูปแบบ JSON');
      }
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('ไม่สามารถแปลงข้อมูลการตอบกลับเป็น JSON ได้');
      }
      
      if (result.success) {
        // ถ้ามี returnUri (3DS redirect) ให้เปลี่ยนไปที่หน้ายืนยันตัวตน
        if (result.returnUri) {
          window.location.href = result.returnUri;
          return;
        }

        // การสั่งซื้อสำเร็จ
        setOrderNumber(result.orderNumber);
        clearCart(); // ล้างตะกร้าสินค้า
        setOrderComplete(true);
        
        // อัปเดตการใช้งานรหัสส่วนลด (เชื่อมโยงกับ order)
        if (discountAmount > 0 && discountCode && result.orderId) {
          try {
            await fetch('/api/discount/use', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                code: discountCode,
                orderId: result.orderId
              }),
            });
          } catch (error) {
            console.error('Error linking discount code to order:', error);
          }
        }
      } else {
        // มีข้อผิดพลาดเกิดขึ้น
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      }
    } catch (error) {
      console.error('Order error:', error);
      setShowAlert(true);
      setAlertMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดำเนินการ');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ใช้ useCallback สำหรับฟังก์ชันที่ส่งไปยังคอมโพเนนต์ลูก
  const handleRemoveItem = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  }, [updateQuantity]);

  // ถ้ายังไม่ได้ mount หรือ hydration ยังไม่เสร็จสมบูรณ์ ให้แสดงหน้าเปล่า
  if (!isMounted) {
    return null;
  }

  // ถ้าสั่งซื้อสำเร็จแล้ว แสดงหน้ายืนยัน
  if (orderComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              maxWidth: 560,
              width: '100%',
              mx: 'auto',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
            }}
          >
            {/* พื้นหลังประดับตกแต่ง */}
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)',
                zIndex: 0,
              }}
            />
            
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, rgba(46, 125, 50, 0.05) 0%, rgba(46, 125, 50, 0.12) 100%)',
                zIndex: 0,
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'rgba(46, 125, 50, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px dashed rgba(46, 125, 50, 0.4)',
                    animation: 'spin 10s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <CheckCircleOutlineIcon 
                  sx={{ 
                    fontSize: 54, 
                    color: 'success.main',
                    animation: 'pulse 3s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.8, transform: 'scale(0.95)' },
                      '50%': { opacity: 1, transform: 'scale(1.05)' },
                      '100%': { opacity: 0.8, transform: 'scale(0.95)' },
                    },
                  }} 
                />
              </Box>
              
              <Typography 
                variant="h5" 
                align="center" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  background: 'linear-gradient(45deg, #2E7D32 30%, #43A047 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                สั่งซื้อสำเร็จ
              </Typography>
              
              <Box
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.03)',
                }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                  ขอบคุณสำหรับการสั่งซื้อ
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    เลขที่คำสั่งซื้อ:
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      px: 2,
                      py: 0.5,
                      borderRadius: 1.5,
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      color: 'primary.main',
                      letterSpacing: 0.5,
                      fontSize: '1.1rem',
                    }}
                  >
                    {orderNumber}
                  </Typography>
                </Box>
                
                {paymentMethod === 'bank_transfer' ? (
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    sx={{ 
                      mb: 2, 
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      borderRadius: 2,
                      backgroundColor: 'rgba(3, 169, 244, 0.08)',
                      '& .MuiAlert-icon': { mt: 0.5 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1, color: 'info.dark' }}>
                      กรุณาชำระเงินภายใน 24 ชั่วโมง
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'info.dark', opacity: 0.9 }}>
                      หากท่านชำระเงินแล้ว กรุณาส่งหลักฐานการโอนเงินผ่านทางไลน์ @treetelu หรืออีเมล info@treetelu.com
                    </Typography>
                  </Alert>
                ) : paymentMethod === 'promptpay' && paymentStatus !== 'CONFIRMED' ? (
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    sx={{ 
                      mb: 2, 
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      borderRadius: 2,
                      backgroundColor: 'rgba(3, 169, 244, 0.08)',
                      '& .MuiAlert-icon': { mt: 0.5 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1, color: 'info.dark' }}>
                      รอการตรวจสอบการชำระเงิน
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'info.dark', opacity: 0.9 }}>
                      หากท่านชำระเงินผ่าน PromptPay แล้ว ระบบจะทำการตรวจสอบและอัพเดทสถานะการชำระเงินโดยอัตโนมัติ
                      {paymentPolling && (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
                          <Box component="span" sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            backgroundColor: 'info.main',
                            display: 'inline-block',
                            mx: 0.5,
                            animation: 'pulse 1.5s infinite ease-in-out',
                          }}/>
                          กำลังตรวจสอบ...
                        </Box>
                      )}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    sx={{ 
                      mb: 2, 
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      borderRadius: 2, 
                      backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      '& .MuiAlert-icon': { mt: 0.5 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1, color: 'success.dark' }}>
                      การชำระเงินสำเร็จแล้ว
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.dark', opacity: 0.9 }}>
                      เราได้ส่งอีเมลยืนยันการสั่งซื้อไปที่อีเมลของท่าน กรุณาตรวจสอบอีเมลเพื่อดูรายละเอียดการสั่งซื้อ
                    </Typography>
                  </Alert>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                  เราจะดำเนินการจัดส่งสินค้าให้คุณโดยเร็วที่สุด <br/>หากมีข้อสงสัย สามารถติดต่อเราได้ที่ Line: <Box component="span" sx={{ fontWeight: 500, color: 'primary.main' }}>@treetelu</Box>
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                component={Link}
                href="/"
                sx={{ 
                  mt: 1,
                  py: 1.2,
                  px: 4,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                  },
                  width: { xs: '100%', sm: 'auto' },
                  display: 'flex',
                  mx: 'auto'
                }}
                startIcon={<ShoppingCartIcon />}
              >
                กลับไปยังหน้าหลัก
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  // ถ้าไม่มีสินค้าในตะกร้า
  if (isCartEmpty && !showPromptPayWaitingOverlay && !showPromptPayLoadingOverlay && !paymentPolling && !showCreditCardWaitingOverlay) {
    return null; // ไม่แสดงข้อความใดๆ เมื่อตะกร้าว่างเปล่าและไม่ได้กำลังรอการชำระเงิน
  }

  // ฟังก์ชันสำหรับสร้าง PromptPay QR code ใหม่
  const handleRegeneratePromptpayQRCode = async () => {
    setIsSubmitting(true);
    setPromptpayQrCode(null);
    
    try {
      const response = await fetch('/api/payment/create-promptpay-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: prices.totalPrice,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          phone: customerInfo.phone,
        }),
      });
      
      if (!response.ok) {
        throw new Error('ไม่สามารถสร้าง PromptPay QR code ได้');
      }
      
      const result = await response.json();
      
      // ตรวจสอบว่ามีข้อมูล QR code หรือไม่
      if (!result.success || !result.source || !result.source.qrCode) {
        throw new Error('ไม่พบข้อมูล QR code ที่ถูกต้อง');
      }
      
      // เก็บ QR code URL
      setPromptpayQrCode(result.source.qrCode);
      
    } catch (error) {
      // แสดงข้อความผิดพลาดใน dialog แทนที่จะแสดงเป็น alert
      setAlertMessage('ไม่สามารถสร้าง PromptPay QR code ได้ กรุณาลองใหม่อีกครั้ง');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // แสดงหน้าชำระเงินปกติ
  return (
    <Container maxWidth="lg" sx={{ py: 0 }}>
      {/* Dialog สำหรับแสดง animation ระหว่างเปลี่ยนเส้นทางไป Stripe */}
      <Dialog
        open={showStripeRedirectDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        onClose={(event, reason) => {
          // ป้องกันการปิด dialog โดยการคลิกนอกพื้นที่
          if (reason && reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            // ไม่ทำการปิด Dialog จนกว่าจะ redirect
          }
        }}
        disablePortal
        aria-labelledby="stripe-redirect-dialog-title"
        TransitionComponent={Fade}
        transitionDuration={300}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              background: 'rgba(0, 0, 0, 0.3)'
            }
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            background: '#ffffff',
          }
        }}
      >
        <DialogContent sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
          <Box 
            sx={{
              position: 'relative',
              zIndex: 10, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px'
            }}
          >
            {/* โลโก้และการ์ดตรงกลาง */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                p: 2,
                bgcolor: 'rgba(103, 114, 229, 0.1)',
                borderRadius: '50%',
                width: 80,
                height: 80
              }}
            >
              <CircularProgress 
                size={40} 
                sx={{ 
                  color: '#6772e5',
                }}
              />
            </Box>
            
            <Fade in={true} timeout={300}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#6772e5'
                }}
              >
                กำลังเชื่อมต่อไปยัง Stripe
                {paymentMethod === 'stripe_promptpay' ? ' (PromptPay)' : ' (บัตรเครดิต)'}
              </Typography>
            </Fade>
            
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                textAlign: 'center',
                maxWidth: '90%',
                color: 'text.secondary'
              }}
            >
              กรุณารอสักครู่...
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(56, 142, 60, 0.08)',
                border: '1px solid rgba(56, 142, 60, 0.2)',
                maxWidth: '90%'
              }}
            >
              <LockIcon fontSize="small" sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                การเชื่อมต่อปลอดภัยผ่าน SSL/TLS
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Overlay สำหรับรอการโหลด QR Code PromptPay */}
      {showPromptPayLoadingOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
          }}
        >
          <Box sx={{ position: 'relative', width: 120, height: 120, mb: 3 }}>
            {/* พื้นหลังเบลอแบบพัลส์ */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '140%',
                height: '140%',
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                filter: 'blur(15px)',
                animation: 'pulse 2s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.7 },
                  '50%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                  '100%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.7 },
                },
              }}
            />
            
            {/* วงกลมแอนิเมชันรอบนอก (เส้นทึบ) */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.light',
                opacity: 0.6,
                animation: 'spin 4s infinite linear',
                '@keyframes spin': {
                  '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                  '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                },
              }}
            />
            
            {/* วงกลมแอนิเมชันเส้นประ */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '2px dashed',
                borderColor: 'primary.main',
                opacity: 0.8,
                animation: 'spin 8s infinite linear reverse',
              }}
            />
            
            {/* ไอคอน PromptPay */}
            <Box sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              animation: 'bounce 1.2s infinite ease-in-out',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
                '50%': { transform: 'translate(-50%, -50%) scale(1.1)' },
              },
            }}>
              <CreditCardIcon sx={{ fontSize: 32 }} />
            </Box>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1, 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            กำลังสร้าง QR Code พร้อมเพย์
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              maxWidth: '80%',
              textAlign: 'center',
              fontWeight: 500,
              animation: 'fadeInOut 2s infinite',
              '@keyframes fadeInOut': {
                '0%': { opacity: 0.7 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.7 },
              },
            }}
          >
            กรุณารอสักครู่ ระบบกำลังเตรียม QR Code สำหรับการชำระเงิน...
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            border: '1px solid rgba(25, 118, 210, 0.1)',
          }}>
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'blink 1.4s infinite ease-in-out',
                animationDelay: '0s',
                '@keyframes blink': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(0.6)', opacity: 0.5 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            />
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'blink 1.4s infinite ease-in-out',
                animationDelay: '0.2s',
              }}
            />
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'blink 1.4s infinite ease-in-out',
                animationDelay: '0.4s',
              }}
            />
            <Typography variant="caption" sx={{ ml: 1, fontWeight: 500, color: 'primary.main' }}>
              โปรดอย่าปิดหน้านี้
            </Typography>
          </Box>
        </Box>
      )}

      {/* Overlay สำหรับรอผลการชำระเงินด้วยบัตรเครดิต/เดบิต */}
      {showCreditCardWaitingOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
          }}
        >
          <Box sx={{ position: 'relative', width: 120, height: 120, mb: 3 }}>
            {/* พื้นหลังเบลอแบบพัลส์ */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '140%',
                height: '140%',
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                filter: 'blur(15px)',
                animation: 'pulse 2s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.7 },
                  '50%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                  '100%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.7 },
                },
              }}
            />
            
            {/* วงกลมแอนิเมชันรอบนอก (เส้นทึบ) */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.light',
                opacity: 0.6,
                animation: 'spin 4s infinite linear',
                '@keyframes spin': {
                  '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                  '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                },
              }}
            />
            
            {/* วงกลมแอนิเมชันเส้นประ */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '2px dashed',
                borderColor: 'primary.main',
                opacity: 0.8,
                animation: 'spin 8s infinite linear reverse',
              }}
            />
            
            {/* ไอคอนบัตรเครดิต */}
            <Box sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              animation: 'bounce 1.2s infinite ease-in-out',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
                '50%': { transform: 'translate(-50%, -50%) scale(1.1)' },
              },
            }}>
              <CreditCardIcon sx={{ fontSize: 32 }} />
            </Box>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1, 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            กำลังดำเนินการชำระเงิน
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              maxWidth: '80%',
              textAlign: 'center',
              fontWeight: 500,
              animation: 'fadeInOut 2s infinite',
              '@keyframes fadeInOut': {
                '0%': { opacity: 0.7 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.7 },
              },
            }}
          >
            กรุณารอสักครู่ ระบบกำลังประมวลผลการชำระเงินของคุณ...
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            border: '1px solid rgba(25, 118, 210, 0.1)',
          }}>
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'blink 1.4s infinite ease-in-out',
                animationDelay: '0s',
                '@keyframes blink': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(0.6)', opacity: 0.5 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            />
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'blink 1.4s infinite ease-in-out',
                animationDelay: '0.2s',
              }}
            />
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'blink 1.4s infinite ease-in-out',
                animationDelay: '0.4s',
              }}
            />
            <Typography variant="caption" sx={{ ml: 1, fontWeight: 500, color: 'primary.main' }}>
              โปรดอย่าปิดหน้านี้
            </Typography>
          </Box>
        </Box>
      )}

      {/* QR Code Dialog สำหรับการโอนเงินธนาคาร */}
      <Dialog
        open={openQRDialog}
        onClose={handleCloseQRDialog}
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1,
              backgroundColor: '#fff',
              position: 'relative'
            }
          }
        }}
      >
        <IconButton
          onClick={handleCloseQRDialog}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'grey.700',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 0 8px rgba(0,0,0,0.1)'
            },
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ position: 'relative', width: { xs: 300, sm: 400, md: 600 }, height: { xs: 300, sm: 400, md: 600 }, mx: 'auto' }}>
            <Image
              src="/images/qr_scb.jpg"
              alt="QR Code สำหรับชำระเงิน"
              fill
              style={{ objectFit: 'contain' }}
              quality={90}
            />
          </Box>
          <Typography variant="body2" color="primary.main" align="center" sx={{ mt: 2, fontWeight: 500 }}>
            สแกน QR Code นี้เพื่อชำระเงิน
          </Typography>
        </DialogContent>
      </Dialog>
      
      {/* PromptPay QR Code Dialog */}
      <Dialog
        open={openPromptPayDialog}
        onClose={handleClosePromptPayDialog}
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1,
              backgroundColor: '#fff',
              position: 'relative'
            }
          }
        }}
      >
        <IconButton
          onClick={handleClosePromptPayDialog}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'grey.700',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 0 8px rgba(0,0,0,0.1)'
            },
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="h6" align="center" gutterBottom>
            ชำระเงินด้วย PromptPay
          </Typography>
          
          {promptpayQrCode ? (
            <Box sx={{ 
              position: 'relative', 
              width: { xs: 250, sm: 300, md: 350 }, 
              height: { xs: 250, sm: 300, md: 350 }, 
              mx: 'auto',
              border: '1px solid #eee',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <Image
                src={promptpayQrCode}
                alt="PromptPay QR Code"
                fill
                style={{ objectFit: 'contain' }}
                priority={true}
              />
            </Box>
          ) : (
            <Box sx={{ 
              width: { xs: 250, sm: 300, md: 350 }, 
              height: { xs: 250, sm: 300, md: 350 }, 
              mx: 'auto',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid #eee', 
              borderRadius: 2 
            }}>
              <CircularProgress size={50} />
              <Typography variant="body2" sx={{ mt: 2 }}>
                กำลังโหลด QR code...
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="primary.main" gutterBottom>
              ยอดเงิน: ฿{prices.totalPrice.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              กรุณาเปิดแอปธนาคารของท่านและสแกน QR code นี้เพื่อชำระเงิน
            </Typography>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleRegeneratePromptpayQRCode}
                startIcon={<CreditCardIcon />}
              >
                สร้าง QR code ใหม่
              </Button>
              
              <Button
                variant="contained"
                onClick={async () => {
                  await handlePlaceOrder();
                }}
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ต่อไป'}
              </Button>
            </Box>
          </Box>
          
          {/* Overlay สำหรับรอการตอบกลับจาก webhook */}
          {showPromptPayWaitingOverlay && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99,
                borderRadius: 2,
                backdropFilter: 'blur(8px)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              <Box sx={{ position: 'relative', width: 120, height: 120, mb: 3 }}>
                {/* พื้นหลังเบลอสำหรับเอฟเฟกต์การส่องสว่าง */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '150%',
                    height: '150%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    filter: 'blur(15px)',
                    animation: 'pulse 3s infinite ease-in-out',
                    '@keyframes pulse': {
                      '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.6 },
                      '50%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                      '100%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0.6 },
                    },
                  }}
                />
                
                {/* วงกลมแอนิเมชันรอบนอก */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: 'primary.light',
                    opacity: 0.6,
                    animation: 'spin 4s infinite linear',
                    '@keyframes spin': {
                      '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                      '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                    },
                  }}
                />
                
                {/* วงกลมแอนิเมชันเส้นประ */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    opacity: 0.8,
                    animation: 'spin 8s infinite linear reverse',
                  }}
                />
                
                {/* ไอคอนพร้อมเพย์ตรงกลาง */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 55,
                    height: 55,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    zIndex: 2,
                    animation: 'floatIcon 2s infinite ease-in-out',
                    '@keyframes floatIcon': {
                      '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
                      '50%': { transform: 'translate(-50%, -50%) scale(1.1)' },
                    },
                  }}
                >
                  <CreditCardIcon sx={{ color: 'white', fontSize: 30 }} />
                </Box>
              </Box>
              
              <Box sx={{ maxWidth: '80%', textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    mb: 2,
                    backgroundImage: 'linear-gradient(45deg, #007FFF, #0059B2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  กำลังตรวจสอบการชำระเงิน
                </Typography>
                
                <Typography variant="body1" paragraph>
                  กรุณารอสักครู่ ระบบกำลังรอการตอบกลับจาก PromptPay
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mt: 1, 
                  animation: 'fadeInOut 2s infinite ease-in-out',
                  '@keyframes fadeInOut': {
                    '0%': { opacity: 0.6 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.6 },
                  },
                }}>
                  โปรดอย่าปิดหน้านี้จนกว่าการชำระเงินจะเสร็จสมบูรณ์
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0s',
                      '@keyframes bounce': {
                        '0%, 100%': {
                          transform: 'scale(0)',
                        },
                        '50%': {
                          transform: 'scale(1)',
                        },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.2s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.4s',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      <PageTitle variant="h5">ชำระเงิน</PageTitle>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mt: 4, gap: 4 }}>
        {/* สรุปคำสั่งซื้อ (แสดงก่อนบนมือถือ) */}
        <Box sx={{ width: { xs: '100%', md: '40%' }, order: { xs: 1, md: 2 }, mb: { xs: 4, md: 0 }, display: { xs: 'block', md: 'none' } }}>
          <OrderSummaryContainer>
            <Typography variant="h6" gutterBottom>
              สรุปคำสั่งซื้อ
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              จำนวนสินค้าทั้งหมด {getTotalItems()} ชิ้น
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {cartItems.map((item) => (
                <Paper 
                  key={item.id} 
                  variant="outlined"
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1,
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <ProductImageWrapper sx={{ width: 90, height: 90 }}>
                      <Link 
                        href={`/products/${item.slug || item.id}`}
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          height: '100%', 
                          position: 'relative' 
                        }}
                      >
                        <Image
                          src={item.image || '/images/product-placeholder.png'}
                          alt={item.name || 'สินค้า'}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </Link>
                    </ProductImageWrapper>
                    
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" fontWeight={500} gutterBottom>
                        {item.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        ฿{parseFloat(String(item.salesPrice || '0')).toLocaleString()} × {item.quantity}
                      </Typography>

                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ฿{(parseFloat(String(item.salesPrice || '0')) * item.quantity).toLocaleString()}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            sx={{ 
                              p: 0.5, 
                              width: 32, 
                              height: 32,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: '50%'
                            }}
                          >
                            <RemoveIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                          
                          <Box 
                            sx={{ 
                              width: '48px', 
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: '4px',
                              mx: 1
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.quantity}
                            </Typography>
                          </Box>
                          
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            sx={{ 
                              p: 0.5, 
                              width: 32, 
                              height: 32,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: '50%'
                            }}
                          >
                            <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveItem(item.id)}
                          sx={{ 
                            color: 'error.main', 
                            p: 0.5,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'rgba(211, 47, 47, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(211, 47, 47, 0.15)'
                            },
                            ml: 'auto'
                          }}
                          aria-label="ลบสินค้า"
                        >
                          <DeleteOutlineIcon fontSize="small" sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    
                  </Box>
                </Paper>
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* เพิ่มส่วนกรอกรหัสส่วนลด */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                รหัสส่วนลด
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField 
                  fullWidth
                  size="small"
                  placeholder="กรอกรหัสส่วนลด"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  error={hasDiscountError}
                  helperText={hasDiscountError ? discountErrorMsg : ''}
                  disabled={isApplyingDiscount || discountAmount > 0}
                  autoComplete='off'
                  slotProps={{
                    input: {
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', color: 'primary.main', mr: 0.5 }}>
                        <LocalOfferIcon fontSize="small" />
                      </Box>
                    ),
                    }
                  }}
                />
                {discountAmount > 0 ? (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleClearDiscount}
                    sx={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                  >
                    ยกเลิก
                  </Button>
                ) : (
                  <LoadingButton
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleApplyDiscount}
                    loading={isApplyingDiscount}
                    sx={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                  >
                    ใช้งาน
                  </LoadingButton>
                )}
              </Box>
              
              {discountAmount > 0 && (
                <Alert severity="success" sx={{ mt: 1 }} icon={false}>
                  <Typography variant="body2" fontWeight={500}>
                    ✓ ใช้รหัสส่วนลด {discountCode} สำเร็จ!
                  </Typography>
                  {discountDetails && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {discountDetails.description}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">ยอดรวม</Typography>
                <Typography variant="body1">฿{prices.subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">ค่าจัดส่ง</Typography>
                <Typography variant="body1">
                  {prices.shippingCost < 1 ? 'ฟรี' : `฿${prices.shippingCost.toLocaleString()}`}
                </Typography>
              </Box>
              
              {/* แสดงส่วนลดเมื่อมีการใช้โค้ด */}
              {prices.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalOfferIcon fontSize="small" sx={{ mr: 0.5 }} />
                    ส่วนลด {discountCode && `(${discountCode})`}
                  </Typography>
                  <Typography variant="body1" color="error.main">-฿{prices.discount.toLocaleString()}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  รวมทั้งสิ้น
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  ฿{prices.totalPrice.toLocaleString()}
                </Typography>
              </Box>
              
              {prices.shippingCost < 1 ? (
                <Alert severity="success" sx={{ mt: 2 }} icon={false}>
                  <Typography variant="body2" fontWeight={500}>
                    ✓ คุณได้รับสิทธิ์จัดส่งฟรี!
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                  <Typography variant="body2">
                    สั่งซื้อเพิ่มอีก ฿{(1500 - prices.subtotal).toLocaleString()} เพื่อรับสิทธิ์จัดส่งฟรี
                  </Typography>
                  <Typography variant="caption" display="block" mt={0.5}>
                    (ซื้อครบ 1,500 บาท รับสิทธิ์จัดส่งฟรี)
                  </Typography>
                </Alert>
              )}
            </Box>
          </OrderSummaryContainer>
        </Box>

        {/* ขั้นตอนการชำระเงิน */}
        <Box sx={{ width: { xs: '100%', md: '60%' }, order: { xs: 2, md: 1 } }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: activeStep >= index ? 'primary.main' : 'grey.300',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {step.icon}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Box sx={{ py: 3 }}>
                    {showAlert && index === activeStep && (
                      <Collapse in={showAlert}>
                        <Alert 
                          severity={alertMessage.includes('กำลังเชื่อมต่อไปยัง Stripe') ? 'info' : 'error'} 
                          sx={{ 
                            mb: 2,
                            '&.MuiAlert-standardInfo': {
                              backgroundColor: 'rgba(3, 169, 244, 0.1)',
                              color: 'info.dark'
                            }
                          }}
                        >
                          {alertMessage}
                        </Alert>
                      </Collapse>
                    )}
                    
                    {index === 0 && (
                      <Box>
                        {/* ส่วนที่ 1: ข้อมูลผู้สั่ง */}
                        <Typography variant="h6" gutterBottom>
                          ข้อมูลผู้สั่งซื้อ
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                            <TextField
                              fullWidth
                              label="ชื่อ"
                              name="firstName"
                              value={customerInfo.firstName}
                              onChange={handleCustomerInfoChange}
                              required
                            />
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                            <TextField
                              fullWidth
                              label="นามสกุล"
                              name="lastName"
                              value={customerInfo.lastName}
                              onChange={handleCustomerInfoChange}
                              required
                            />
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                            <TextField
                              fullWidth
                              label="อีเมล"
                              name="email"
                              type="email"
                              value={customerInfo.email}
                              onChange={handleCustomerInfoChange}
                              required
                            />
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                            <TextField
                              fullWidth
                              label="เบอร์โทรศัพท์"
                              name="phone"
                              value={customerInfo.phone}
                              onChange={(e) => handlePhoneNumberChange(e, false)}
                              inputProps={{ 
                                maxLength: 10,
                                inputMode: "numeric"
                              }}
                              helperText="เบอร์โทรศัพท์มือถือ 10 หลัก"
                              error={customerInfo.phone.length > 0 && !validateThaiPhone(customerInfo.phone).isValid}
                              required
                            />
                          </Box>
                        </Box>
                        
                        {/* ส่วนที่ 2: ตัวเลือกการจัดส่ง */}
                        <Typography variant="h6" gutterBottom>
                          ข้อมูลการจัดส่ง
                        </Typography>
                        
                        <Paper sx={{ borderRadius: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', mb: 3 }}>
                          <Tabs 
                            value={shippingTab} 
                            onChange={handleShippingTabChange}
                            variant="fullWidth"
                            sx={{ 
                              borderBottom: 1, 
                              borderColor: 'divider',
                              '& .MuiTab-root': {
                                py: 2,
                              }
                            }}
                          >
                            <Tab 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                                  <Typography variant="subtitle2">จัดส่งให้ตัวเอง</Typography>
                                  <Typography variant="caption" color="text.secondary">ส่งถึงที่อยู่ของคุณ</Typography>
                                </Box>
                              } 
                              icon={<LocalShippingIcon sx={{ fontSize: 20, mb: 0.5 }} />}
                              iconPosition="top"
                            />
                            <Tab 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                                  <Typography variant="subtitle2">จัดส่งให้ผู้อื่น</Typography>
                                  <Typography variant="caption" color="text.secondary">ส่งเป็นของขวัญ</Typography>
                                </Box>
                              } 
                              icon={<VerifiedOutlinedIcon sx={{ fontSize: 20, mb: 0.5 }} />}
                              iconPosition="top"
                            />
                          </Tabs>
                        
                          {/* ส่วนที่ 3: ที่อยู่จัดส่ง */}
                          <Box sx={{ px: 3 }}>
                            <TabPanel value={shippingTab} index={0}>
                              <AddressForm 
                                onAddressChange={handleAddressChange}
                                defaultValues={{
                                  ...shippingInfo,
                                  receiverName: shippingInfo.receiverName || customerInfo.firstName,
                                  receiverLastname: shippingInfo.receiverLastname || customerInfo.lastName,
                                  zipCode: shippingInfo.zipCode // ส่งค่า zipCode ไปด้วย
                                }}
                                hideReceiverNameFields={true}
                              />
                            </TabPanel>
                            
                            <TabPanel value={shippingTab} index={1}>
                              <Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                                    <TextField
                                      fullWidth
                                      label="ชื่อผู้รับ"
                                      name="firstName"
                                      value={receiverInfo.firstName}
                                      onChange={handleReceiverInfoChange}
                                      required
                                    />
                                  </Box>
                                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                                    <TextField
                                      fullWidth
                                      label="นามสกุลผู้รับ"
                                      name="lastName"
                                      value={receiverInfo.lastName}
                                      onChange={handleReceiverInfoChange}
                                      required
                                    />
                                  </Box>
                                  <Box sx={{ width: '100%' }}>
                                    <TextField
                                      fullWidth
                                      label="เบอร์โทรศัพท์ผู้รับ"
                                      name="phone"
                                      value={receiverInfo.phone}
                                      onChange={(e) => handlePhoneNumberChange(e, true)}
                                      inputProps={{ 
                                        maxLength: 10,
                                        inputMode: "numeric"
                                      }}
                                      helperText="เบอร์โทรศัพท์มือถือ 10 หลัก"
                                      error={receiverInfo.phone.length > 0 && !validateThaiPhone(receiverInfo.phone).isValid}
                                      required
                                    />
                                  </Box>
                                  <Box sx={{ width: '100%' }}>
                                    <TextField
                                      fullWidth
                                      label="ที่อยู่ผู้รับ"
                                      name="address"
                                      value={receiverInfo.address}
                                      onChange={handleReceiverInfoChange}
                                      multiline
                                      rows={3}
                                      required
                                    />
                                  </Box>
                                  
                                  {/* เพิ่มฟิลด์วันและเวลาที่จัดส่ง */}
                                  <Typography variant="subtitle2" sx={{ width: '100%', mt: 2, mb: 1 }}>
                                    วันและเวลาที่ต้องการจัดส่ง
                                  </Typography>
                                  
                                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={thLocale}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: '100%' }}>
                                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                                        {/* ใช้ MobileDatePicker สำหรับมือถือ */}
                                        <MobileDatePicker
                                          label="วันที่จัดส่ง"
                                          value={deliveryDate}
                                          onChange={handleDeliveryDateChange}
                                          slotProps={{ 
                                            textField: { 
                                              fullWidth: true,
                                              required: true,
                                              size: "medium", // ปรับขนาดเป็น medium เพื่อให้กดง่ายบนมือถือ
                                              sx: { 
                                                '& .MuiInputBase-root': { 
                                                  fontSize: { xs: '16px', sm: 'inherit' } // ป้องกัน zoom บนมือถือ iOS
                                                } 
                                              }
                                            },
                                            mobilePaper: {
                                              sx: { width: { xs: '100%', sm: 'auto' } } // ปรับขนาดกระดาษปฏิทินบนมือถือ
                                            }
                                          }}
                                          disablePast // ไม่ให้เลือกวันที่ผ่านไปแล้ว
                                          format="dd MMM yyyy"
                                          views={['year', 'month', 'day']} // แสดงเฉพาะมุมมองที่จำเป็น
                                          closeOnSelect={true} // ปิดอัตโนมัติหลังเลือก
                                        />
                                      </Box>
                                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                                        {/* ใช้ MobileTimePicker สำหรับมือถือ */}
                                        <MobileTimePicker
                                          label="เวลาที่จัดส่ง"
                                          value={deliveryTime}
                                          onChange={handleDeliveryTimeChange}
                                          slotProps={{ 
                                            textField: { 
                                              fullWidth: true,
                                              required: true,
                                              size: "medium", // ปรับขนาดเป็น medium เพื่อให้กดง่ายบนมือถือ
                                              sx: { 
                                                '& .MuiInputBase-root': { 
                                                  fontSize: { xs: '16px', sm: 'inherit' } // ป้องกัน zoom บนมือถือ iOS
                                                } 
                                              }
                                            },
                                            mobilePaper: {
                                              sx: { width: { xs: '100%', sm: 'auto' } } // ปรับขนาดกระดาษเลือกเวลาบนมือถือ
                                            }
                                          }}
                                          ampm={false} // เลือกเวลาแบบ 24 ชั่วโมง
                                          closeOnSelect={true} // ปิดอัตโนมัติหลังเลือก
                                          minutesStep={10} // กำหนดขั้นของนาที ช่วยเลือกได้ง่ายขึ้นบนมือถือ
                                        />
                                      </Box>
                                    </Box>
                                  </LocalizationProvider>
                                  
                                  {/* เพิ่มฟิลด์ข้อความในการ์ด */}
                                  <Box sx={{ width: '100%', mt: 2 }}>
                                    <TextField
                                      fullWidth
                                      label="ข้อความในการ์ด"
                                      value={cardMessage}
                                      onChange={handleCardMessageChange}
                                      multiline
                                      rows={3}
                                      placeholder="สุขสันต์วันเกิด, ขอให้มีความสุข, ฉันรักคุณ เป็นต้น..."
                                      helperText="ข้อความพิเศษที่จะแนบไปกับการ์ดและของขวัญ (ไม่เกิน 150 ตัวอักษร)"
                                      inputProps={{ maxLength: 150 }}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            </TabPanel>
                          </Box>
                        </Paper>
                        
                        {/* ส่วนที่ 4: ข้อความเพิ่มเติม */}
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
                          ข้อความเพิ่มเติม (ถ้ามี)
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="ข้อความถึงผู้ขาย หรือคำแนะนำในการจัดส่ง..."
                          value={additionalMessage}
                          onChange={handleAdditionalMessageChange}
                          multiline
                          rows={3}
                          sx={{ mb: 3 }}
                        />
                        
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            ค่าจัดส่ง
                          </Typography>
                          <Typography variant="body2">
                            • ค่าจัดส่ง 100 บาท สำหรับการสั่งซื้อต่ำกว่า 1,500 บาท
                          </Typography>
                          <Typography variant="body2">
                            • <strong>ฟรีค่าจัดส่ง</strong> เมื่อสั่งซื้อตั้งแต่ 1,500 บาทขึ้นไป
                          </Typography>
                          
                          <Box mt={1.5} p={1} bgcolor={prices.subtotal >= 1500 ? 'success.light' : 'grey.100'} borderRadius={1}>
                            <Typography variant="body2" fontWeight={500}>
                              {prices.subtotal >= 1500 
                                ? '✓ คุณได้รับสิทธิ์จัดส่งฟรี!' 
                                : `สั่งซื้อเพิ่มอีก ฿${(1500 - prices.subtotal).toLocaleString()} เพื่อรับสิทธิ์จัดส่งฟรี`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {index === 1 && (
                      <Box>
                        <FormControl component="fieldset" sx={{ width: '100%' }}>
                          <RadioGroup
                            name="payment-method"
                            value={paymentMethod}
                            onChange={handlePaymentMethodChange}
                          >
                            <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 1 }}>
                              <FormControlLabel
                                value="bank_transfer"
                                control={<Radio color="primary" />}
                                label={
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight={500}>
                                      โอนเงินผ่านธนาคาร
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      โอนเงินไปยังบัญชีธนาคารของเรา
                                    </Typography>
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                      <Typography variant="subtitle2" color="primary.main" gutterBottom>
                                        ธนาคารไทยพาณิชย์ (SCB)
                                      </Typography>
                                      <Stack spacing={1}>
                                        <Stack direction="row" justifyContent="space-between">
                                          <Typography variant="body2" color="text.secondary">ชื่อบัญชี: </Typography>
                                          <Typography variant="body2">นาย ธัญญา รัตนาวงศ์ไชยา</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                          <Typography variant="body2" color="text.secondary">เลขที่บัญชี:</Typography>
                                          <Typography variant="body2">264-221037-2</Typography>
                                        </Stack>
                                        
                                        {/* QR Code สำหรับสแกนชำระเงิน */}
                                        <Box sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'center', 
                                          alignItems: 'center', 
                                          mt: 2, 
                                          flexDirection: 'column'
                                        }}>
                                          <Typography variant="caption" color="primary.main" sx={{ mb: 1, fontWeight: 600 }}>
                                            สแกนเพื่อชำระเงิน
                                          </Typography>
                                          <Box 
                                            sx={{ 
                                              position: 'relative', 
                                              width: 140, 
                                              height: 140, 
                                              border: '1px solid #eee',
                                              borderRadius: 1,
                                              overflow: 'hidden',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                transform: 'scale(1.02)'
                                              }
                                            }}
                                            onClick={handleOpenQRDialog}
                                          >
                                            <Image
                                              src="/images/qr_scb.jpg"
                                              alt="QR Code สำหรับชำระเงิน (คลิกเพื่อขยาย)"
                                              fill
                                              style={{ objectFit: 'contain' }}
                                            />
                                            <Box sx={{ 
                                              position: 'absolute', 
                                              bottom: 0, 
                                              left: 0, 
                                              right: 0, 
                                              bgcolor: 'rgba(255,255,255,0.8)', 
                                              py: 0.5,
                                              textAlign: 'center'
                                            }}>
                                              <Typography variant="caption">
                                                คลิกเพื่อขยาย
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Box>
                                        
                                      </Stack>
                                    </Box>
                                  </Box>
                                }
                                sx={{ width: '100%' }}
                              />
                            </Paper>
                            
                            <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 1 }}>
                              <FormControlLabel
                                value="stripe"
                                control={<Radio color="primary" />}
                                label={
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight={500}>
                                      บัตรเครดิต / เดบิต (Stripe)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      ชำระเงินออนไลน์ผ่านบัตรเครดิตหรือเดบิตอย่างปลอดภัย
                                    </Typography>
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                      <Box component="img" src="/visa.svg" alt="VISA" sx={{ height: 24 }} />
                                      <Box component="img" src="/mastercard.svg" alt="MasterCard" sx={{ height: 24 }} />
                                      <Box component="img" src="/promptpay-logo.png" alt="American Express" sx={{ height: 24 }} />
                                    </Box>
                                  </Box>
                                }
                                sx={{ width: '100%' }}
                              />
                            </Paper>
                            
                            <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 1 }}>
                              <FormControlLabel
                                value="stripe_promptpay"
                                control={<Radio color="primary" />}
                                label={
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight={500}>
                                      PromptPay (ชำระผ่าน Stripe)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      สแกน QR Code เพื่อชำระเงินด้วย Mobile Banking แบบทันที
                                    </Typography>
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                      <Box component="img" src="/promptpay-logo.png" alt="PromptPay" sx={{ height: 24 }} />
                                    </Box>
                                  </Box>
                                }
                                sx={{ width: '100%' }}
                              />
                            </Paper>
                          </RadioGroup>
                        </FormControl>
                      </Box>
                    )}

                    {index === 2 && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                          ตรวจสอบข้อมูลการสั่งซื้อ
                        </Typography>
                        
                        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            ข้อมูลผู้สั่งซื้อ
                          </Typography>
                          <Typography variant="body2">
                            ชื่อ-นามสกุล: {customerInfo.firstName} {customerInfo.lastName}<br />
                            อีเมล: {customerInfo.email}<br />
                            เบอร์โทรศัพท์: {customerInfo.phone}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            ข้อมูลการจัดส่ง
                          </Typography>
                          <Typography variant="body2">
                            {shippingTab === 0 ? (
                              <>
                                จัดส่งถึงคุณ: {shippingInfo.receiverName} {shippingInfo.receiverLastname}<br />
                                ที่อยู่: {shippingInfo.addressLine}<br />
                                ตำบล: {shippingInfo.tambonName} <br />
                                อำเภอ: {shippingInfo.amphureName}<br />
                                จังหวัด: {shippingInfo.provinceName}<br />
                                รหัสไปรษณีย์: {shippingInfo.zipCode || '-'}<br />
                              </>
                            ) : (
                              <>
                                จัดส่งถึงคุณ: {receiverInfo.firstName} {receiverInfo.lastName}<br />
                                เบอร์โทรศัพท์: {receiverInfo.phone}<br />
                                ที่อยู่: {receiverInfo.address}<br />
                                {deliveryDate && deliveryTime && (
                                  <>
                                    วันที่จัดส่ง: {format(deliveryDate, 'dd MMMM yyyy', { locale: thLocale })}<br />
                                    เวลาที่จัดส่ง: {format(deliveryTime, 'HH:mm น.', { locale: thLocale })}<br />
                                  </>
                                )}
                                {cardMessage && (
                                  <>
                                    ข้อความในการ์ด: "{cardMessage}"<br />
                                  </>
                                )}
                              </>
                            )}
                            ค่าจัดส่ง: {prices.shippingCost < 1 ? 'ฟรี' : `฿${prices.shippingCost}`}
                          </Typography>
                        </Box>
                        
                        {additionalMessage && (
                          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              ข้อความเพิ่มเติม
                            </Typography>
                            <Typography variant="body2">
                              {additionalMessage}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            วิธีการชำระเงิน
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {paymentMethod === 'bank_transfer' && 'โอนเงินผ่านธนาคาร'}
                              {paymentMethod === 'credit_card' && 'บัตรเครดิต / เดบิต (Omise)'}
                              {paymentMethod === 'promptpay' && 'พร้อมเพย์ (PromptPay)'}
                              {paymentMethod === 'stripe' && 'บัตรเครดิต / เดบิต (Stripe)'}
                              {paymentMethod === 'stripe_promptpay' && 'พร้อมเพย์ (Stripe)'}
                            </Typography>
                            
                            {paymentMethod === 'bank_transfer' && (
                              <Button 
                                variant="outlined" 
                                size="small"
                                onClick={handleOpenQRDialog}
                                startIcon={<CreditCardIcon />}
                              >
                                แสดง QR code
                              </Button>
                            )}
                            {paymentMethod === 'stripe' && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Box component="img" src="/visa.svg" alt="VISA" sx={{ height: 24 }} />
                                <Box component="img" src="/mastercard.svg" alt="MasterCard" sx={{ height: 24 }} />
                                <Box component="img" src="/promptpay-logo.png" alt="American Express" sx={{ height: 24 }} />
                              </Box>
                            )}
                            {paymentMethod === 'stripe_promptpay' && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Box component="img" src="/promptpay-logo.png" alt="PromptPay" sx={{ height: 24 }} />
                              </Box>
                            )}
                          </Box>
                        </Box>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            เมื่อคลิก "ยืนยันคำสั่งซื้อ" คุณจะได้รับอีเมลยืนยันคำสั่งซื้อพร้อมรายละเอียดการชำระเงิน
                          </Typography>
                        </Alert>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', mt: 2 }}>
                      {index === 0 ? (
                        <Button
                          component={Link}
                          href="/products"
                          startIcon={<ArrowBackIcon />}
                          sx={{ mr: 1 }}
                        >
                          ย้อนกลับ
                        </Button>
                      ) : (
                        <Button
                          onClick={handleBack}
                          startIcon={<ArrowBackIcon />}
                          sx={{ mr: 1 }}
                        >
                          ย้อนกลับ
                        </Button>
                      )}
                      <Box sx={{ flex: '1 1 auto' }} />
                      {index === steps.length - 1 ? (
                        <LoadingButton
                          variant="contained"
                          onClick={handlePlaceOrder}
                          loading={isSubmitting}
                          loadingPosition="start"
                          startIcon={<VerifiedOutlinedIcon />}
                        >
                          ยืนยันคำสั่งซื้อ
                        </LoadingButton>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                        >
                          ถัดไป
                        </Button>
                      )}
                    </Box>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        {/* สรุปคำสั่งซื้อ (แสดงบนจอใหญ่) */}
        <Box sx={{ width: { xs: '100%', md: '40%' }, order: { xs: 1, md: 2 }, display: { xs: 'none', md: 'block' } }}>
          <OrderSummaryContainer>
            <Typography variant="h6" gutterBottom>
              สรุปคำสั่งซื้อ
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              จำนวนสินค้าทั้งหมด {getTotalItems()} ชิ้น
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {cartItems.map((item) => (
                <Paper 
                  key={item.id} 
                  variant="outlined"
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1,
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <ProductImageWrapper sx={{ width: 90, height: 90 }}>
                      <Link 
                        href={`/products/${item.slug || item.id}`}
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          height: '100%', 
                          position: 'relative' 
                        }}
                      >
                        <Image
                          src={
                            // ถ้าเป็น URL จากภายนอก ให้ใช้โดยตรง
                            (item.productImg && typeof item.productImg === 'string' && item.productImg.startsWith('http'))
                              ? item.productImg
                              // ถ้าเป็น URL จากภายนอก (จาก field image) ให้ใช้โดยตรง
                              : (item.image && typeof item.image === 'string' && item.image.startsWith('http'))
                                ? item.image
                                // ถ้าเป็นชื่อไฟล์ภายใน ให้อ้างอิงจาก path
                                : (item.productImg && typeof item.productImg === 'string')
                                  ? `/images/product/${item.productImg}`
                                  // ถ้าเป็นชื่อไฟล์ภายใน (จาก field image) ให้อ้างอิงจาก path
                                  : (item.image && typeof item.image === 'string')
                                    ? `/images/product/${item.image}`
                                    // ใช้รูปภาพ placeholder เมื่อไม่มีรูปภาพที่ระบุ
                                    : '/images/product/placeholder.jpg'
                          }
                          alt={item.productName || item.name || 'สินค้า'}
                          fill
                          sizes="90px"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            // เมื่อโหลดภาพล้มเหลว ให้ใช้รูปภาพ placeholder แทน
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // ป้องกันการเกิด loop
                            target.src = '/images/product/placeholder.jpg';
                          }}
                        />
                      </Link>
                    </ProductImageWrapper>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component={Link}
                        href={`/products/${item.slug || item.id}`}
                        variant="subtitle2"
                        fontWeight={500}
                        sx={{
                          mb: 0.5,
                          color: 'text.primary',
                          textDecoration: 'none',
                          '&:hover': {
                            color: 'primary.main',
                            textDecoration: 'underline'
                          },
                          display: 'block'
                        }}
                      >
                        {item.productName}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          ราคา: <Typography component="span" fontWeight={500}>฿{parseFloat(String(item.salesPrice || '0')).toLocaleString()}</Typography> / ชิ้น
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          รหัสสินค้า: {item.sku || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mt: 2, 
                    pt: 2, 
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)', 
                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    p: 1,
                    borderRadius: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        bgcolor: 'background.paper'
                      }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                          disabled={item.quantity <= 1}
                          sx={{ p: 0.5, width: 32, height: 32 }}
                        >
                          <RemoveIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                        
                        <Typography variant="body2" sx={{ px: 1.5, minWidth: '30px', textAlign: 'center', fontWeight: 500 }}>
                          {item.quantity}
                        </Typography>
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          sx={{ p: 0.5, width: 32, height: 32 }}
                        >
                          <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                      
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveItem(item.id)}
                        sx={{ 
                          ml: 1, 
                          color: 'error.main', 
                          p: 0.5,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'rgba(211, 47, 47, 0.08)',
                          '&:hover': {
                            bgcolor: 'rgba(211, 47, 47, 0.15)'
                          }
                        }}
                        aria-label="ลบสินค้า"
                      >
                        <DeleteOutlineIcon fontSize="small" sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      ฿{(parseFloat(String(item.salesPrice || '0')) * item.quantity).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* เพิ่มส่วนกรอกรหัสส่วนลด */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                รหัสส่วนลด
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField 
                  fullWidth
                  size="small"
                  placeholder="กรอกรหัสส่วนลด"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  error={hasDiscountError}
                  helperText={hasDiscountError ? discountErrorMsg : ''}
                  disabled={isApplyingDiscount || discountAmount > 0}
                  slotProps={{
                    input: {
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', color: 'primary.main', mr: 0.5 }}>
                        <LocalOfferIcon fontSize="small" />
                      </Box>
                    ),
                    }
                  }}
                />
                {discountAmount > 0 ? (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleClearDiscount}
                    sx={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                  >
                    ยกเลิก
                  </Button>
                ) : (
                  <LoadingButton
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleApplyDiscount}
                    loading={isApplyingDiscount}
                    sx={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                  >
                    ใช้งาน
                  </LoadingButton>
                )}
              </Box>
              
              {discountAmount > 0 && (
                <Alert severity="success" sx={{ mt: 1 }} icon={false}>
                  <Typography variant="body2" fontWeight={500}>
                    ✓ ใช้รหัสส่วนลด {discountCode} สำเร็จ!
                  </Typography>
                  {discountDetails && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {discountDetails.description}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">ยอดรวม</Typography>
                <Typography variant="body1">฿{prices.subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">ค่าจัดส่ง</Typography>
                <Typography variant="body1">
                  {prices.shippingCost < 1 ? 'ฟรี' : `฿${prices.shippingCost.toLocaleString()}`}
                </Typography>
              </Box>
              
              {/* แสดงส่วนลดเมื่อมีการใช้โค้ด */}
              {prices.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalOfferIcon fontSize="small" sx={{ mr: 0.5 }} />
                    ส่วนลด {discountCode && `(${discountCode})`}
                  </Typography>
                  <Typography variant="body1" color="error.main">-฿{prices.discount.toLocaleString()}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  รวมทั้งสิ้น
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  ฿{prices.totalPrice.toLocaleString()}
                </Typography>
              </Box>
              
              {prices.shippingCost < 1 ? (
                <Alert severity="success" sx={{ mt: 2 }} icon={false}>
                  <Typography variant="body2" fontWeight={500}>
                    ✓ คุณได้รับสิทธิ์จัดส่งฟรี!
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                  <Typography variant="body2">
                    สั่งซื้อเพิ่มอีก ฿{(1500 - prices.subtotal).toLocaleString()} เพื่อรับสิทธิ์จัดส่งฟรี
                  </Typography>
                  <Typography variant="caption" display="block" mt={0.5}>
                    (ซื้อครบ 1,500 บาท รับสิทธิ์จัดส่งฟรี)
                  </Typography>
                </Alert>
              )}
            </Box>
          </OrderSummaryContainer>
          
        </Box>
      </Box>
      
      {/* เพิ่ม div ที่ซ่อนอยู่สำหรับ Omise */}
      <div id="creditCardButton" style={{ display: 'none' }}></div>
    </Container>
  );
}
