'use client';

import { Container, Typography, Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Container maxWidth={false} sx={{
        py: 4,
        px: { xs: 2, sm: 3, lg: 4, xl: 5 },
        maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' },
        mx: 'auto',
        minHeight: 'calc(100vh - 64px)', // 64px คือความสูงของ header
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
            เงื่อนไขการให้บริการ
          </Typography>
        </Breadcrumbs>

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
          เงื่อนไขการให้บริการ (Terms of Service)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          อัปเดตล่าสุด: 29/04/2568
        </Typography>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              1. การยอมรับเงื่อนไข
            </Typography>
            <Typography paragraph>
              ยินดีต้อนรับสู่ Treetelu ("เรา", "ร้านค้า") การเข้าใช้งานและใช้บริการสั่งซื้อสินค้า (รวมถึงต้นไม้, ช่อดอกไม้, และของชำร่วยต้นไม้) ผ่านเว็บไซต์ www.treetelu.com ("เว็บไซต์") นี้ ถือว่าท่าน ("ผู้ใช้", "ลูกค้า") ได้อ่าน ทำความเข้าใจ และยอมรับข้อกำหนดและเงื่อนไขการให้บริการฉบับนี้ ("เงื่อนไข") และนโยบายความเป็นส่วนตัวของเราโดยสมบูรณ์ หากท่านไม่ยอมรับเงื่อนไขข้อใดข้อหนึ่ง กรุณาหยุดใช้งานเว็บไซต์นี้ทันที
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              2. ข้อมูลสินค้าและการสั่งซื้อ
            </Typography>
            <Typography paragraph>
              2.1 เราพยายามอย่างเต็มที่ในการนำเสนอข้อมูลสินค้า รวมถึงรูปภาพ ขนาด และคำอธิบาย ให้มีความถูกต้องมากที่สุด อย่างไรก็ตาม เนื่องจากสินค้าของเราเป็นผลิตภัณฑ์จากธรรมชาติ (ต้นไม้, ดอกไม้) ลักษณะทางกายภาพ เช่น สี ขนาด รูปทรง อาจมีความแตกต่างกันเล็กน้อยจากรูปภาพที่แสดงบนเว็บไซต์
            </Typography>
            <Typography paragraph>
              2.2 การสั่งซื้อสินค้าจะเสร็จสมบูรณ์เมื่อท่านได้ดำเนินการตามขั้นตอนที่ระบุบนเว็บไซต์ ชำระเงินเรียบร้อย และได้รับการยืนยันการสั่งซื้อจากเราทางอีเมล
            </Typography>
            <Typography paragraph>
              2.3 เราขอสงวนสิทธิ์ในการยกเลิกคำสั่งซื้อ หากสินค้าหมดสต็อก หรือมีเหตุขัดข้องอื่นใดที่ไม่สามารถจัดส่งสินค้าได้ โดยเราจะแจ้งให้ท่านทราบและดำเนินการคืนเงินให้เต็มจำนวน
            </Typography>
            <Typography paragraph>
              2.4 สำหรับสินค้าประเภทของชำร่วยต้นไม้ อาจมีระยะเวลาในการเตรียมการผลิต โปรดตรวจสอบรายละเอียดในหน้าสินค้าหรือติดต่อเราเพื่อสอบถามข้อมูลเพิ่มเติม
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              3. ราคาและการชำระเงิน
            </Typography>
            <Typography paragraph>
              3.1 ราคาสินค้าที่แสดงบนเว็บไซต์เป็นสกุลเงินบาท (THB) และอาจมีการเปลี่ยนแปลงได้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า ราคาดังกล่าวยังไม่รวมค่าจัดส่ง เว้นแต่จะระบุไว้เป็นอย่างอื่น
            </Typography>
            <Typography paragraph>
              3.2 เรามีช่องทางการชำระเงินตามที่ระบุไว้บนเว็บไซต์ ท่านจะต้องชำระเงินเต็มจำนวนตามยอดสรุปในคำสั่งซื้อก่อนที่เราจะดำเนินการจัดส่งสินค้า
            </Typography>
            
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              4. การจัดส่งสินค้า
            </Typography>
            <Typography paragraph>
              4.1 เราจะดำเนินการจัดส่งสินค้าตามที่อยู่ที่ท่านระบุไว้ในคำสั่งซื้อ โปรดตรวจสอบความถูกต้องของที่อยู่และข้อมูลติดต่อก่อนยืนยันการสั่งซื้อ
            </Typography>
            <Typography paragraph>
              4.2 ระยะเวลาในการจัดส่งอาจแตกต่างกันไปขึ้นอยู่กับประเภทสินค้า (สินค้าพร้อมส่ง, สินค้าสั่งทำ, ต้นไม้/ดอกไม้) และพื้นที่จัดส่ง เราจะแจ้งระยะเวลาจัดส่งโดยประมาณให้ทราบในหน้าสินค้าหรือขั้นตอนการสั่งซื้อ
            </Typography>
            <Typography paragraph>
              4.3 สำหรับการจัดส่งต้นไม้และช่อดอกไม้ เราใช้ความระมัดระวังเป็นพิเศษในการแพ็คสินค้าเพื่อลดความเสียหายระหว่างการขนส่ง อย่างไรก็ตาม ความเสียหายเล็กน้อยที่อาจเกิดขึ้นจากการขนส่งซึ่งอยู่นอกเหนือการควบคุมของเรา เช่น ใบช้ำเล็กน้อย ดินร่วงหล่น อาจเกิดขึ้นได้และไม่ถือเป็นเหตุในการคืนสินค้า
            </Typography>
            <Typography paragraph>
              4.4 หากเกิดความล่าช้าในการจัดส่ง หรือปัญหาอื่นใดเกี่ยวกับการจัดส่ง เราจะพยายามติดต่อท่านเพื่อแจ้งสถานการณ์ให้ทราบโดยเร็วที่สุด
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              5. นโยบายการคืนสินค้าและการคืนเงิน
            </Typography>
            <Typography paragraph>
              5.1 เนื่องจากสินค้าประเภทต้นไม้และช่อดอกไม้เป็นสินค้าที่มีความเปราะบางและมีอายุจำกัด เราขอสงวนสิทธิ์ไม่รับคืนสินค้าหรือเปลี่ยนสินค้าในกรณีที่เกิดจากความไม่พอใจในลักษณะทางกายภาพเล็กน้อย (ตามข้อ 2.1) หรือการดูแลที่ไม่เหมาะสมของลูกค้า
            </Typography>
            <Typography paragraph>
              5.2 หากสินค้า (รวมถึงต้นไม้และช่อดอกไม้) ได้รับความเสียหายอย่างรุนแรงระหว่างการขนส่ง หรือได้รับสินค้าไม่ตรงตามคำสั่งซื้อ โปรดติดต่อเราภายใน 24 ชั่วโมงหลังจากได้รับสินค้า พร้อมแนบรูปถ่ายหลักฐานความเสียหายหรือความผิดพลาด เราจะพิจารณาเป็นกรณีไป และอาจเสนอการเปลี่ยนสินค้าหรือคืนเงินตามความเหมาะสม
            </Typography>
            
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              6. การดูแลรักษาต้นไม้
            </Typography>
            <Typography paragraph>
              เราอาจให้คำแนะนำเบื้องต้นเกี่ยวกับการดูแลต้นไม้ในหน้าสินค้าหรือแนบไปกับสินค้า อย่างไรก็ตาม คำแนะนำดังกล่าวเป็นเพียงแนวทางทั่วไป การดูแลที่เหมาะสมขึ้นอยู่กับสภาพแวดล้อมเฉพาะของลูกค้า เราไม่รับผิดชอบต่อความเสียหายหรือการตายของต้นไม้ที่เกิดจากการดูแลที่ไม่เหมาะสม
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              7. บัญชีผู้ใช้
            </Typography>
            <Typography paragraph>
              ท่านมีหน้าที่รับผิดชอบในการรักษาข้อมูลบัญชีผู้ใช้และรหัสผ่านของท่านให้เป็นความลับ และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน โปรดแจ้งให้เราทราบทันทีหากมีการใช้งานบัญชีของท่านโดยไม่ได้รับอนุญาต
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              8. ทรัพย์สินทางปัญญา
            </Typography>
            <Typography paragraph>
              เนื้อหา ข้อความ รูปภาพ โลโก้ และข้อมูลทั้งหมดบนเว็บไซต์นี้เป็นทรัพย์สินทางปัญญาของ Treetelu หรือผู้ให้อนุญาต ห้ามมิให้ทำซ้ำ คัดลอก ดัดแปลง แจกจ่าย หรือนำไปใช้เพื่อการค้าโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากเรา
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              9. ข้อจำกัดความรับผิด
            </Typography>
            <Typography paragraph>
              เราจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นจากการใช้งานเว็บไซต์ หรือจากการซื้อสินค้าจากเรา ไม่ว่าจะเป็นความเสียหายโดยตรง โดยอ้อม โดยบังเอิญ หรือเป็นผลสืบเนื่อง เว้นแต่จะระบุไว้เป็นอย่างอื่นตามกฎหมาย
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              10. การเปลี่ยนแปลงเงื่อนไข
            </Typography>
            <Typography paragraph>
              เราขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงเงื่อนไขการให้บริการนี้ได้ตลอดเวลาโดยไม่ต้องแจ้งให้ทราบล่วงหน้า การเปลี่ยนแปลงจะมีผลทันทีเมื่อประกาศบนเว็บไซต์ การใช้งานเว็บไซต์ต่อไปของท่านหลังจากการเปลี่ยนแปลงถือว่าท่านยอมรับเงื่อนไขที่แก้ไขใหม่แล้ว
            </Typography>
            <Typography paragraph>
              หากมีข้อสงสัยเกี่ยวกับเงื่อนไขการให้บริการ โปรดติดต่อเราได้ที่ Line : @095xrokt
            </Typography>
          </Box>
        </Paper>
      </Container>
      
    </>
  );
} 