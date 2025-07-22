'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Stack,
  useTheme,
  Collapse,
  IconButton,
  Breadcrumbs
} from '@mui/material';
import Link from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

const faqData: FAQItem[] = [
  // สินค้าและบริการ
  {
    id: '1',
    category: 'สินค้าและบริการ',
    question: 'ทรีเตลูขายอะไรบ้าง?',
    answer: 'ทรีเตลูขายต้นไม้ในกระถาง ไม้อวบน้ำ ไม้ฟอกอากาศ ช่อดอกไม้ ของชำร่วย ต้นไม้ของขวัญ และตะกร้าผลไม้ของขวัญ เหมาะสำหรับทุกโอกาส ไม่ว่าจะเป็นงานแต่งงาน วันเกิด วันครบรอบ หรือเป็นของขวัญให้คนพิเศษ',
    icon: <LocalFloristIcon />
  },
  {
    id: '2',
    category: 'สินค้าและบริการ',
    question: 'ต้นไม้เหมาะสำหรับมือใหม่หรือไม่?',
    answer: 'เหมาะมากครับ เรามีไม้อวบน้ำและไม้ฟอกอากาศที่ดูแลง่าย เหมาะสำหรับผู้เริ่มต้นปลูกต้นไม้ พร้อมคำแนะนำการดูแลที่ละเอียด รวมถึงการรดน้ำ การให้แสง และการใส่ปุ๋ย',
    icon: <LocalFloristIcon />
  },
  {
    id: '3',
    category: 'สินค้าและบริการ',
    question: 'สามารถสั่งทำของชำร่วยได้หรือไม่?',
    answer: 'ได้ครับ เรารับสั่งทำของชำร่วยต้นไม้สำหรับงานแต่งงาน งานบุญ และงานต่างๆ สามารถปรับแต่งตามความต้องการได้ ทั้งการเลือกต้นไม้ กระถาง และการตกแต่ง โดยมีราคาเริ่มต้นที่ 35 บาทต่อชิ้น',
    icon: <LocalFloristIcon />
  },
  {
    id: '4',
    category: 'สินค้าและบริการ',
    question: 'ตะกร้าผลไม้มีแบบไหนบ้าง?',
    answer: 'เรามีตะกร้าผลไม้หลากหลายแบบ ตั้งแต่ตะกร้าผลไม้พรีเมียม ตะกร้าผลไม้เยี่ยมไข้ ตะกร้าผลไม้ของขวัญ ราคาตั้งแต่ 500-5,000 บาท สามารถเลือกผลไม้ตามความต้องการได้ และมีบริการจัดส่งถึงที่',
    icon: <ShoppingBasketIcon />
  },

  // การจัดส่งและการชำระเงิน
  {
    id: '5',
    category: 'การจัดส่งและการชำระเงิน',
    question: 'มีบริการจัดส่งหรือไม่?',
    answer: 'มีครับ เรามีบริการจัดส่งทั่วกรุงเทพและปริมณฑล สามารถสั่งซื้อผ่านเว็บไซต์หรือติดต่อทีมงานได้โดยตรง ค่าจัดส่งขึ้นอยู่กับระยะทางและขนาดของสินค้า',
    icon: <LocalShippingIcon />
  },
  {
    id: '6',
    category: 'การจัดส่งและการชำระเงิน',
    question: 'ใช้เวลาจัดส่งนานแค่ไหน?',
    answer: 'โดยปกติใช้เวลาจัดส่ง 1-3 วันทำการ สำหรับพื้นที่กรุงเทพและปริมณฑล และ 3-5 วันทำการสำหรับต่างจังหวัด ทั้งนี้ขึ้นอยู่กับความพร้อมของสินค้าและสภาพอากาศ',
    icon: <LocalShippingIcon />
  },
  {
    id: '7',
    category: 'การจัดส่งและการชำระเงิน',
    question: 'มีวิธีการชำระเงินอะไรบ้าง?',
    answer: 'เรารับชำระเงินหลายช่องทาง ได้แก่ โอนเงินผ่านธนาคาร บัตรเครดิต พร้อมเพย์ และเก็บเงินปลายทาง (COD) สำหรับพื้นที่ที่มีบริการ',
    icon: <PaymentIcon />
  },
  {
    id: '8',
    category: 'การจัดส่งและการชำระเงิน',
    question: 'สามารถเปลี่ยนที่อยู่จัดส่งได้หรือไม่?',
    answer: 'สามารถเปลี่ยนได้ครับ หากยังไม่ได้จัดส่งสินค้า กรุณาติดต่อทีมงานโดยเร็วที่สุด เพื่อให้เราสามารถปรับเปลี่ยนข้อมูลการจัดส่งให้ทันเวลา',
    icon: <LocalShippingIcon />
  },

  // การดูแลและบำรุงรักษา
  {
    id: '9',
    category: 'การดูแลและบำรุงรักษา',
    question: 'ต้นไม้ที่ซื้อมาต้องดูแลอย่างไร?',
    answer: 'แต่ละชนิดต้นไม้จะมีวิธีการดูแลที่แตกต่างกัน เราจะแนบคำแนะนำการดูแลมาให้ทุกครั้ง โดยทั่วไปควรวางในที่ที่มีแสงเหมาะสม รดน้ำตามความจำเป็น และใส่ปุ๋ยเป็นระยะ',
    icon: <LocalFloristIcon />
  },
  {
    id: '10',
    category: 'การดูแลและบำรุงรักษา',
    question: 'ถ้าต้นไม้เสียหายระหว่างการจัดส่งจะทำอย่างไร?',
    answer: 'หากต้นไม้เสียหายระหว่างการจัดส่ง กรุณาถ่ายรูปและแจ้งให้เราทราบภายใน 24 ชั่วโมง เราจะดำเนินการเปลี่ยนสินค้าใหม่ให้ หรือคืนเงินตามความเหมาะสม',
    icon: <SupportAgentIcon />
  },
  {
    id: '11',
    category: 'การดูแลและบำรุงรักษา',
    question: 'มีบริการดูแลต้นไม้หลังการขายหรือไม่?',
    answer: 'เรามีบริการให้คำปรึกษาการดูแลต้นไม้หลังการขาย สามารถติดต่อสอบถามได้ตลอดเวลา และหากมีปัญหาเกี่ยวกับการดูแล เราพร้อมให้คำแนะนำเพิ่มเติม',
    icon: <SupportAgentIcon />
  },

  // การติดต่อและบริการลูกค้า
  {
    id: '12',
    category: 'การติดต่อและบริการลูกค้า',
    question: 'ติดต่อทีมงานได้อย่างไร?',
    answer: 'สามารถติดต่อเราได้หลายช่องทาง ผ่าน Facebook: Treetelu, Instagram: @treetelu, Line: @treetelu หรือโทรศัพท์ในเวลาทำการ 09:00-18:00 น. ทุกวัน',
    icon: <SupportAgentIcon />
  },
  {
    id: '13',
    category: 'การติดต่อและบริการลูกค้า',
    question: 'เวลาทำการของทรีเตลูคือเมื่อไหร่?',
    answer: 'เราให้บริการทุกวัน เวลา 09:00-18:00 น. สำหรับการติดต่อสอบถามและการสั่งซื้อ การจัดส่งจะดำเนินการในวันทำการ',
    icon: <SupportAgentIcon />
  },
  {
    id: '14',
    category: 'การติดต่อและบริการลูกค้า',
    question: 'สามารถยกเลิกคำสั่งซื้อได้หรือไม่?',
    answer: 'สามารถยกเลิกได้ครับ หากยังไม่ได้เริ่มจัดเตรียมสินค้า กรุณาติดต่อทีมงานโดยเร็วที่สุด เราจะดำเนินการยกเลิกและคืนเงินให้ตามเงื่อนไข',
    icon: <SupportAgentIcon />
  }
];

const categories = [
  { name: 'ทั้งหมด', icon: <HelpOutlineIcon />, color: 'primary' },
  { name: 'สินค้าและบริการ', icon: <LocalFloristIcon />, color: 'success' },
  { name: 'การจัดส่งและการชำระเงิน', icon: <LocalShippingIcon />, color: 'info' },
  { name: 'การดูแลและบำรุงรักษา', icon: <LocalFloristIcon />, color: 'warning' },
  { name: 'การติดต่อและบริการลูกค้า', icon: <SupportAgentIcon />, color: 'secondary' }
];

// Custom FAQ Item Component
const FAQItem = ({ faq, isExpanded, onToggle }: { 
  faq: FAQItem; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: 1
        },
        ...(isExpanded && {
          borderColor: 'primary.main',
          boxShadow: 2
        })
      }}
    >
      {/* Question Header */}
      <Box
        onClick={onToggle}
        sx={{
          p: 3,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <Box sx={{ color: theme.palette.primary.main }}>
          {faq.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: '1.1rem',
              color: 'text.primary',
              mb: 0.5
            }}
          >
            {faq.question}
          </Typography>
          <Chip 
            label={faq.category}
            size="small"
            variant="outlined"
            sx={{ 
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 500
            }}
          />
        </Box>
        <IconButton
          sx={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
            color: 'text.secondary'
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Answer Section */}
      <Collapse in={isExpanded} timeout={300}>
        <Box sx={{ px: 3, pb: 3, pt: 0 }}>
          <Box
            sx={{
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.7,
                color: 'text.secondary'
              }}
            >
              {faq.answer}
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default function FAQClient() {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();

  // Fix hydration issues by ensuring client-side rendering is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the full content after client-side hydration is complete
  if (!mounted) {
    return (
      <Container maxWidth={false} sx={{
        py: 4,
        px: { xs: 2, sm: 3, lg: 4, xl: 5 },
        maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' },
        mx: 'auto',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ color: 'primary.main' }}>
          กำลังโหลด...
        </Typography>
      </Container>
    );
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setExpandedPanel(false);
  };

  const handleToggle = (faqId: string) => {
    setExpandedPanel(expandedPanel === faqId ? false : faqId);
  };

  const filteredFAQs = selectedCategory === 'ทั้งหมด' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  return (
    <Container maxWidth={false} sx={{
      py: 0,
      px: { xs: 2, sm: 3, lg: 4, xl: 5 },
      maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' },
      mx: 'auto',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Box
          component={Link}
          href="/"
          sx={{
            textDecoration: 'none',
            color: theme.palette.primary.main,
            fontFamily: theme.typography.fontFamily,
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          หน้าหลัก
        </Box>
        <Typography sx={{
          color: theme.palette.text.secondary,
          fontFamily: theme.typography.fontFamily
        }}>
          คำถามที่พบบ่อย
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: 'text.primary',
          position: 'relative',
          display: 'inline-block',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -10,
            left: 0,
            width: 60,
            height: 3,
            bgcolor: 'primary.main',
          }
        }}
      >
        คำถามที่พบบ่อย (FAQ)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        รวบรวมคำถามและคำตอบที่ลูกค้าสอบถามบ่อยๆ เกี่ยวกับสินค้าและบริการของเรา
      </Typography>

      {/* Category Filter */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 500,
            color: 'text.primary',
            fontSize: '1.125rem',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 2,
              bgcolor: 'primary.main'
            }
          }}
        >
          หมวดหมู่
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1} 
          flexWrap="wrap"
          useFlexGap
        >
          {categories.map((category) => (
            <Chip
              key={category.name}
              icon={category.icon}
              label={category.name}
              onClick={() => handleCategoryChange(category.name)}
              color={selectedCategory === category.name ? category.color as any : 'default'}
              variant={selectedCategory === category.name ? 'filled' : 'outlined'}
              sx={{
                px: 1,
                py: 0.5,
                fontSize: '0.875rem',
                fontWeight: selectedCategory === category.name ? 600 : 400,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 1
                }
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* FAQ Content */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          {selectedCategory === 'ทั้งหมด' ? 'คำถามทั้งหมด' : selectedCategory}
          <Chip 
            label={`${filteredFAQs.length} คำถาม`} 
            size="small" 
            sx={{ ml: 2 }}
            color="primary"
            variant="outlined"
          />
        </Typography>
        
        <Box>
          {filteredFAQs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedPanel === faq.id}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </Box>

        {filteredFAQs.length === 0 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'background.paper',
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              ไม่พบคำถามในหมวดหมู่นี้
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Contact Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          ยังมีคำถามอื่นๆ อีกหรือไม่?
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 3 }}
        >
          หากไม่พบคำตอบที่ต้องการ สามารถติดต่อทีมงานของเราได้ตลอดเวลา
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
        >
          <Chip
            label="Facebook: Treetelu"
            color="primary"
            variant="outlined"
            sx={{ px: 2, py: 1, fontSize: '0.9rem' }}
          />
          <Chip
            label="Instagram: @treetelu"
            color="secondary"
            variant="outlined"
            sx={{ px: 2, py: 1, fontSize: '0.9rem' }}
          />
          <Chip
            label="Line: @treetelu"
            color="success"
            variant="outlined"
            sx={{ px: 2, py: 1, fontSize: '0.9rem' }}
          />
        </Stack>
      </Paper>
    </Container>
  );
}