'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
  topSellingProducts?: TopProduct[];
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
  monthFull?: string;
  sales: number;
  year?: number;
  numOrders?: number;
}

interface StatusData {
  status: string;
  count: number;
}

// เพิ่มอินเตอร์เฟซสำหรับสินค้าขายดี
interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  totalAmount: number;
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

// ฟังก์ชันเตรียมข้อมูลสำหรับ Chart.js
const prepareSalesChartData = (salesData: MonthSales[]) => {
  return {
    labels: salesData.map(item => item.month),
    datasets: [
      {
        label: 'ยอดขาย (บาท)',
        data: salesData.map(item => item.sales),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        borderRadius: 5,
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)',
      }
    ]
  };
};

// ตัวเลือกสำหรับ Chart.js
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: 'Kanit, sans-serif'
        }
      }
    },
    title: {
      display: false,
      text: 'ยอดขายรายเดือน',
      font: {
        family: 'Kanit, sans-serif',
        size: 16
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('th-TH', {
              style: 'currency',
              currency: 'THB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: 'Kanit, sans-serif'
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false
      },
      ticks: {
        font: {
          family: 'Kanit, sans-serif'
        },
        callback: function(value: any) {
          return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
      }
    }
  }
};

// ฟังก์ชันเตรียมข้อมูลสำหรับ Chart.js สินค้าขายดี
const prepareTopProductsChartData = (products: TopProduct[]) => {
  // คู่สีสวยงามที่ไล่เฉดกัน
  const backgroundColors = [
    'rgba(255, 99, 132, 0.8)',  // สีชมพู
    'rgba(54, 162, 235, 0.8)',  // สีฟ้า
    'rgba(255, 206, 86, 0.8)',  // สีเหลือง
    'rgba(75, 192, 192, 0.8)',  // สีเขียวมิ้นท์
    'rgba(153, 102, 255, 0.8)', // สีม่วง
    'rgba(255, 159, 64, 0.8)',  // สีส้ม
    'rgba(238, 130, 238, 0.8)', // สีม่วงอ่อน
    'rgba(106, 90, 205, 0.8)',  // สีสเลท
    'rgba(60, 179, 113, 0.8)',  // สีเขียวปานกลาง
    'rgba(255, 99, 71, 0.8)',   // สีแดงส้ม (ทอมาโต้)
  ];
  
  const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

  return {
    labels: products.map(product => product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name),
    datasets: [
      {
        label: 'จำนวนที่ขายได้',
        data: products.map(product => product.totalSold),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        hoverOffset: 15
      }
    ]
  };
};

// ตัวเลือกสำหรับ Chart.js สินค้าขายดี
const productChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        font: {
          family: 'Kanit, sans-serif'
        },
        // กำหนดให้แสดงชื่อไม่เกิน 15 ตัวอักษร
        generateLabels: function(chart: any) {
          const original = ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels;
          const labels = original.call(this, chart);
          
          labels.forEach((label: any) => {
            if (label.text && label.text.length > 15) {
              label.text = label.text.substring(0, 15) + '...';
            }
          });
          
          return labels;
        }
      }
    },
    title: {
      display: false,
      text: 'สินค้าขายดี 10 อันดับ',
      font: {
        family: 'Kanit, sans-serif',
        size: 16
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw;
          return `${label}: ${value} ชิ้น`;
        }
      }
    }
  }
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
  
  const chartRef = useRef(null);
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543); // ปี พ.ศ.
  const [showUnit, setShowUnit] = useState<string>('amount'); // 'amount' หรือ 'orders'
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [chartData, setChartData] = useState<any>(null);
  const [productChartData, setProductChartData] = useState<any>(null);
  
  // ตัวเลือกกราฟแบบแท่ง
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            family: 'Kanit, sans-serif',
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'Kanit, sans-serif',
          size: 14
        },
        bodyFont: {
          family: 'Kanit, sans-serif',
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (showUnit === 'amount') {
                label += new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              } else {
                label += `${context.parsed.y} ชิ้น`;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Kanit, sans-serif',
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Kanit, sans-serif',
            size: 12
          },
          callback: function(value: any) {
            if (showUnit === 'amount') {
              return new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
            } else {
              return value + ' ชิ้น';
            }
          }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderWidth: 0
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  // ตัวเลือกกราฟวงกลม
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: 'Kanit, sans-serif',
            size: 12
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: function(chart: any) {
            const original = ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            
            labels.forEach((label: any) => {
              if (label.text && label.text.length > 15) {
                label.text = label.text.substring(0, 15) + '...';
              }
            });
            
            return labels;
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'Kanit, sans-serif',
          size: 14
        },
        bodyFont: {
          family: 'Kanit, sans-serif',
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = ((context.raw / context.chart._metasets[context.datasetIndex].total) * 100).toFixed(1);
            return `${label}: ${value} ชิ้น (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutCirc'
    }
  };
  
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
        
        // อัปเดตปีที่มีข้อมูล
        if (result.data.salesByMonth && result.data.salesByMonth.length > 0) {
          // ดึงปีที่มีข้อมูลและกรองให้เป็นตัวเลขเท่านั้น
          const yearsData = result.data.salesByMonth
            .map((item: any) => item.year)
            .filter((year: any): year is number => typeof year === 'number' && !isNaN(year));
          
          // ใช้ Set เพื่อกำจัดค่าซ้ำและแปลงกลับเป็น array
          const uniqueYears = Array.from(new Set(yearsData)) as number[];
          setAvailableYears(uniqueYears);
          
          // ตั้งค่าปีล่าสุดที่มีข้อมูล ถ้ายังไม่มีปีที่เลือกในข้อมูล
          if (uniqueYears.length > 0 && !uniqueYears.includes(selectedYear)) {
            setSelectedYear(uniqueYears[uniqueYears.length - 1] as number);
          }
        }
        
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
  
  // ฟังก์ชัน filter ข้อมูลตามปีที่เลือก
  const getFilteredSalesData = () => {
    if (!stats?.salesByMonth) return [];
    
    return stats.salesByMonth.filter(item => item.year === selectedYear);
  };
  
  // ฟังก์ชันเตรียมข้อมูลสำหรับกราฟยอดขายที่จะแสดงจำนวนเงินหรือจำนวนคำสั่งซื้อ
  const prepareSalesChartDataByUnit = (salesData: MonthSales[]) => {
    const gradientColors = {
      amount: {
        start: 'rgba(75, 192, 192, 0.8)',
        end: 'rgba(75, 192, 192, 0.1)'
      },
      orders: {
        start: 'rgba(54, 162, 235, 0.8)',
        end: 'rgba(54, 162, 235, 0.1)'
      }
    };

    // สีแท่งกราฟที่สวยงาม
    const barColors = {
      amount: {
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.9)',
      },
      orders: {
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)',
      }
    };

    return {
      labels: salesData.map(item => item.month),
      datasets: [
        {
          label: showUnit === 'amount' ? 'ยอดขาย (บาท)' : 'จำนวนคำสั่งซื้อ (ชิ้น)',
          data: salesData.map(item => showUnit === 'amount' ? item.sales : (item.numOrders || 0)),
          backgroundColor: barColors[showUnit as keyof typeof barColors].backgroundColor,
          borderColor: barColors[showUnit as keyof typeof barColors].borderColor,
          hoverBackgroundColor: barColors[showUnit as keyof typeof barColors].hoverBackgroundColor,
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    };
  };
  
  // ตัวเลือกสำหรับกราฟยอดขายที่แสดงจำนวนเงินหรือจำนวนคำสั่งซื้อ
  const getSalesChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: {
              family: 'Kanit, sans-serif'
            }
          }
        },
        title: {
          display: false,
          text: showUnit === 'amount' ? 'ยอดขายรายเดือน' : 'จำนวนคำสั่งซื้อรายเดือน',
          font: {
            family: 'Kanit, sans-serif',
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (showUnit === 'amount') {
                  label += new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(context.parsed.y);
                } else {
                  label += `${context.parsed.y} ชิ้น`;
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category' as const,
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Kanit, sans-serif'
            }
          }
        },
        y: {
          type: 'linear' as const,
          beginAtZero: true,
          ticks: {
            font: {
              family: 'Kanit, sans-serif'
            },
            callback: function(value: any) {
              if (showUnit === 'amount') {
                return new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
              } else {
                return value + ' ชิ้น';
              }
            }
          }
        }
      }
    };
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* ยอดขายรายเดือน */}
            <Box sx={{ flex: '1 1 60%' }}>
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
                      {showUnit === 'amount' ? 'ยอดขายรายเดือน' : 'จำนวนคำสั่งซื้อรายเดือน'}
                    </Typography>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>หน่วย</InputLabel>
                        <Select
                          value={showUnit}
                          onChange={(e) => setShowUnit(e.target.value as string)}
                          label="หน่วย"
                        >
                          <MenuItem value="amount">ยอดเงิน</MenuItem>
                          <MenuItem value="orders">จำนวนชิ้น</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>ปี</InputLabel>
                        <Select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          label="ปี"
                        >
                          {availableYears.map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <UpdateIcon sx={{ fontSize: '1rem', color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    {stats?.salesByMonth && getFilteredSalesData().length > 0 ? (
                      <Bar 
                        ref={chartRef}
                        data={prepareSalesChartDataByUnit(getFilteredSalesData())} 
                        options={barOptions as any}
                        height={300}
                      />
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%' 
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          ไม่มีข้อมูลยอดขายสำหรับปี {selectedYear}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
            
            {/* สินค้าขายดี 10 อันดับ */}
            <Box sx={{ flex: '1 1 40%' }}>
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
                      สินค้าขายดี 10 อันดับ
                    </Typography>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    {stats?.topSellingProducts && stats.topSellingProducts.length > 0 ? (
                      <Doughnut 
                        data={prepareTopProductsChartData(stats.topSellingProducts)} 
                        options={doughnutOptions as any}
                        height={300}
                      />
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%' 
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          ไม่มีข้อมูลสินค้าขายดี
                        </Typography>
                      </Box>
                    )}
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