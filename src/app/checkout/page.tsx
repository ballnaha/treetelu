"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  DialogContent
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
  const [openQRDialog, setOpenQRDialog] = useState(false);
  
  // เพิ่ม state สำหรับส่วนลด
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [hasDiscountError, setHasDiscountError] = useState(false);
  const [discountErrorMsg, setDiscountErrorMsg] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  
  // ใช้ useRef เพื่อป้องกันการเรียก setState ซ้ำซ้อน
  const initialRenderRef = useRef(true);
  
  // เปิด-ปิด Dialog QR Code
  const handleOpenQRDialog = () => {
    setOpenQRDialog(true);
  };
  
  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
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
  const [isProcessing, setIsProcessing] = useState(false);
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

  // จัดการการกรอกเบอร์โทรศัพท์ให้รับเฉพาะตัวเลขเท่านั้น
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
        setHasDiscountError(false);
        setDiscountErrorMsg('');
      } else {
        setHasDiscountError(true);
        setDiscountErrorMsg(data.message || 'รหัสส่วนลดไม่ถูกต้อง');
        setDiscountAmount(0);
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setHasDiscountError(true);
      setDiscountErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด');
      setDiscountAmount(0);
    } finally {
      setIsApplyingDiscount(false);
    }
  }, [discountCode, prices.subtotal, handleClearDiscount]);

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

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setShowAlert(false);
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value);
  };

  const handlePlaceOrder = async () => {
    // Debug log for user object
    //console.log('User object in checkout:', user);
    if (isProcessing) return;
    
    setShowAlert(false);
    setIsProcessing(true);
    
    try {
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
        if (
          !shippingInfo.addressLine || 
          !shippingInfo.zipCode
        ) {
          throw new Error('กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน');
        }
        
        if (
          !shippingInfo.provinceId || 
          !shippingInfo.amphureId || 
          !shippingInfo.tambonId
        ) {
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
          throw new Error('กรุณากรอกข้อมูลผู้รับสินค้าให้ครบถ้วน');
        }
      }
      
      // ตรวจสอบวิธีการชำระเงิน
      if (!paymentMethod) {
        throw new Error('กรุณาเลือกวิธีการชำระเงิน');
      }
      
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const orderData = {
        userId: user?.id,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          note: additionalMessage || undefined
        },
        shippingInfo: shippingTab === 0 
          ? {
              receiverName: customerInfo.firstName,
              receiverLastname: customerInfo.lastName,
              receiverPhone: customerInfo.phone,
              addressLine: shippingInfo.addressLine,
              addressLine2: shippingInfo.addressLine2,
              provinceId: shippingInfo.provinceId,
              provinceName: shippingInfo.provinceName,
              amphureId: shippingInfo.amphureId,
              amphureName: shippingInfo.amphureName,
              tambonId: shippingInfo.tambonId,
              tambonName: shippingInfo.tambonName,
              zipCode: shippingInfo.zipCode
            }
          : {
              receiverName: receiverInfo.firstName,
              receiverLastname: receiverInfo.lastName,
              receiverPhone: receiverInfo.phone,
              addressLine: receiverInfo.address,
              provinceId: 0, // จัดส่งให้ผู้อื่น
              provinceName: "จัดส่งให้ผู้รับโดยตรง",
              amphureId: 0,
              amphureName: "จัดส่งให้ผู้รับโดยตรง",
              tambonId: 0,
              tambonName: "จัดส่งให้ผู้รับโดยตรง",
              zipCode: "10200",
              deliveryDate: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : undefined,
              deliveryTime: deliveryTime ? format(deliveryTime, 'HH:mm') : undefined,
              cardMessage: cardMessage || undefined
            },
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.productName || item.name || `สินค้ารหัส ${item.id || item.sku || ''}`,
          productImg: item.productImg || item.image || undefined,
          quantity: item.quantity,
          unitPrice: parseFloat(String(item.salesPrice || item.price || 0))
        })),
        paymentMethod: paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : 
                      paymentMethod === 'credit_card' ? 'CREDIT_CARD' : 
                      paymentMethod === 'promptpay' ? 'PROMPTPAY' : 'COD',
        discount: prices.discount,
        discountCode: discountAmount > 0 ? discountCode : undefined
      };
      
      // ส่งข้อมูลการสั่งซื้อไปยัง API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // การสั่งซื้อสำเร็จ
        setOrderNumber(result.orderNumber);
        clearCart(); // ล้างตะกร้าสินค้า
        setOrderComplete(true);
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
      setIsProcessing(false);
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
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>สั่งซื้อสำเร็จ!</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            ขอบคุณสำหรับการสั่งซื้อ เราจะดำเนินการจัดส่งสินค้าให้คุณโดยเร็วที่สุด
          </Typography>
          
          <Button
            variant="contained"
            component={Link}
            href="/"
            sx={{ mt: 3 }}
          >
            กลับไปยังหน้าหลัก
          </Button>
        </Box>
      </Container>
    );
  }

  // ถ้าไม่มีสินค้าในตะกร้า
  if (isCartEmpty) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <PageTitle variant="h5">ชำระเงิน</PageTitle>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            ไม่พบสินค้าในตะกร้า
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            กรุณาเลือกสินค้าก่อนดำเนินการชำระเงิน
          </Typography>
          <Button 
            component={Link} 
            href="/products"
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            เลือกสินค้า
          </Button>
        </Paper>
      </Container>
    );
  }

  // แสดงหน้าชำระเงินปกติ
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* QR Code Dialog */}
      <Dialog
        open={openQRDialog}
        onClose={handleCloseQRDialog}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
            backgroundColor: '#fff',
            position: 'relative'
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
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', color: 'primary.main', mr: 0.5 }}>
                        <LocalOfferIcon fontSize="small" />
                      </Box>
                    ),
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
                        <Alert severity="error" sx={{ mb: 2 }}>
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
                          <Typography variant="body2">
                            {paymentMethod === 'bank_transfer' && 'โอนเงินผ่านธนาคาร'}
                          </Typography>
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
                          loading={isProcessing}
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
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', color: 'primary.main', mr: 0.5 }}>
                        <LocalOfferIcon fontSize="small" />
                      </Box>
                    ),
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
    </Container>
  );
}
