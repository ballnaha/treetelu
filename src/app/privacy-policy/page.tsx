'use client';

import { Container, Typography, Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
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
            นโยบายความเป็นส่วนตัว
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
          นโยบายความเป็นส่วนตัว (Privacy Policy)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          อัปเดตล่าสุด: 29/04/2568
        </Typography>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Typography paragraph>
            Treetelu ("เรา", "ร้านค้า") ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของลูกค้า ("ท่าน", "ผู้ใช้") นโยบายความเป็นส่วนตัวฉบับนี้ ("นโยบาย") อธิบายถึงวิธีการที่เรารวบรวม ใช้ เปิดเผย และจัดการข้อมูลส่วนบุคคลของท่านที่ได้รับผ่านการใช้งานเว็บไซต์ www.treetelu.com ("เว็บไซต์") และบริการที่เกี่ยวข้อง
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              1. ข้อมูลส่วนบุคคลที่เรารวบรวม
            </Typography>
            <Typography paragraph>
              เราอาจรวบรวมข้อมูลส่วนบุคคลประเภทต่างๆ จากท่าน ซึ่งรวมถึงแต่ไม่จำกัดเพียง:
            </Typography>
            <ul>
              <li><b>ข้อมูลระบุตัวตน:</b> เช่น ชื่อ นามสกุล</li>
              <li><b>ข้อมูลติดต่อ:</b> เช่น ที่อยู่ในการจัดส่ง ที่อยู่สำหรับออกใบกำกับภาษี (ถ้ามี) อีเมล หมายเลขโทรศัพท์</li>
              <li><b>ข้อมูลบัญชีผู้ใช้:</b> เช่น ชื่อผู้ใช้ (อีเมล) รหัสผ่าน (ที่เข้ารหัสแล้ว) ประวัติการสั่งซื้อ</li>
              <li><b>ข้อมูลการทำธุรกรรม:</b> เช่น รายละเอียดคำสั่งซื้อ (สินค้า ราคา จำนวน) ข้อมูลการชำระเงิน (เราอาจใช้บริการจากผู้ให้บริการชำระเงินภายนอก ซึ่งจะมีนโยบายความเป็นส่วนตัวของตนเอง) ข้อมูลการจัดส่ง</li>
              <li><b>ข้อมูลทางเทคนิค:</b> เช่น ที่อยู่ IP (Internet Protocol) ประเภทของเบราว์เซอร์ ข้อมูลการเข้าใช้งานเว็บไซต์ (log data) คุกกี้ และเทคโนโลยีการติดตามอื่นๆ</li>
              <li><b>ข้อมูลการสื่อสาร:</b> เช่น บันทึกการติดต่อสอบถาม การให้ความคิดเห็น หรือการสื่อสารอื่นๆ ระหว่างท่านกับเรา</li>
            </ul>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              2. วัตถุประสงค์ในการรวบรวมและใช้ข้อมูลส่วนบุคคล
            </Typography>
            <Typography paragraph>
              เราใช้ข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:
            </Typography>
            <ul>
              <li>เพื่อดำเนินการตามคำสั่งซื้อของท่าน รวมถึงการยืนยันคำสั่งซื้อ การชำระเงิน การแพ็คสินค้า และการจัดส่งสินค้า (ต้นไม้, ช่อดอกไม้, ของชำร่วย และสินค้าอื่นๆ)</li>
              <li>เพื่อให้บริการลูกค้า ตอบข้อซักถาม แก้ไขปัญหา และให้ความช่วยเหลือต่างๆ</li>
              <li>เพื่อสร้างและจัดการบัญชีผู้ใช้ของท่าน</li>
              <li>เพื่อสื่อสารกับท่านเกี่ยวกับคำสั่งซื้อ สถานะการจัดส่ง ข้อมูลสำคัญ หรือการเปลี่ยนแปลงบริการ</li>
              <li>เพื่อปรับปรุงและพัฒนาคุณภาพของสินค้า บริการ และประสบการณ์การใช้งานเว็บไซต์</li>
              <li>เพื่อวิเคราะห์ข้อมูลและแนวโน้มการใช้งานเว็บไซต์ (โดยไม่ระบุตัวตน)</li>
              <li>เพื่อป้องกันการฉ้อโกงและรักษาความปลอดภัยของระบบ</li>
              <li>เพื่อส่งข้อมูลข่าวสาร โปรโมชั่น หรือข้อเสนอพิเศษเกี่ยวกับสินค้าและบริการของเรา (เฉพาะกรณีที่ท่านให้ความยินยอม) ท่านสามารถยกเลิกการรับข้อมูลดังกล่าวได้ตลอดเวลา</li>
              <li>เพื่อปฏิบัติตามภาระผูกพันทางกฎหมาย</li>
            </ul>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              3. การเปิดเผยข้อมูลส่วนบุคคล
            </Typography>
            <Typography paragraph>
              เราอาจเปิดเผยข้อมูลส่วนบุคคลของท่านให้กับบุคคลภายนอกในกรณีต่อไปนี้:
            </Typography>
            <ul>
              <li><b>ผู้ให้บริการขนส่ง:</b> เพื่อดำเนินการจัดส่งสินค้าตามที่อยู่ของท่าน</li>
              <li><b>ผู้ให้บริการชำระเงิน:</b> เพื่อประมวลผลการชำระเงินสำหรับคำสั่งซื้อของท่าน</li>
              <li><b>ผู้ให้บริการด้านเทคโนโลยีสารสนเทศ:</b> เช่น ผู้ให้บริการโฮสติ้ง ผู้พัฒนาระบบ เพื่อสนับสนุนการทำงานของเว็บไซต์และบริการของเรา</li>
              <li><b>หน่วยงานราชการหรือผู้มีอำนาจตามกฎหมาย:</b> ในกรณีที่มีคำสั่งตามกฎหมาย หรือเพื่อปกป้องสิทธิและทรัพย์สินของเรา</li>
              <li><b>บุคคลภายนอกอื่นๆ:</b> เฉพาะในกรณีที่ได้รับความยินยอมจากท่าน</li>
            </ul>
            <Typography paragraph>
              เราจะดำเนินการให้แน่ใจว่าบุคคลภายนอกที่เราเปิดเผยข้อมูลให้ มีมาตรการคุ้มครองข้อมูลส่วนบุคคลที่เหมาะสมและใช้ข้อมูลของท่านตามวัตถุประสงค์ที่กำหนดเท่านั้น
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              4. คุกกี้และเทคโนโลยีการติดตาม
            </Typography>
            <Typography paragraph>
              เราใช้คุกกี้และเทคโนโลยีที่คล้ายคลึงกันเพื่อจดจำข้อมูลการใช้งานของท่าน ปรับปรุงประสบการณ์การใช้งานเว็บไซต์ และวิเคราะห์ประสิทธิภาพการทำงาน ท่านสามารถตั้งค่าเบราว์เซอร์ของท่านเพื่อปฏิเสธคุกกี้ทั้งหมดหรือบางประเภทได้ แต่การทำเช่นนั้นอาจส่งผลกระทบต่อการใช้งานฟังก์ชันบางอย่างบนเว็บไซต์
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              5. การรักษาความปลอดภัยของข้อมูล
            </Typography>
            <Typography paragraph>
              เราใช้มาตรการรักษาความปลอดภัยทางเทคนิคและทางองค์กรที่เหมาะสม เพื่อปกป้องข้อมูลส่วนบุคคลของท่านจากการสูญหาย การเข้าถึง การใช้ การเปลี่ยนแปลง หรือการเปิดเผยโดยไม่ได้รับอนุญาต อย่างไรก็ตาม การส่งข้อมูลผ่านอินเทอร์เน็ตไม่มีความปลอดภัยอย่างสมบูรณ์ เราจึงไม่สามารถรับประกันความปลอดภัยของข้อมูลที่ท่านส่งมายังเว็บไซต์ได้
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              6. ระยะเวลาในการจัดเก็บข้อมูล
            </Typography>
            <Typography paragraph>
              เราจะจัดเก็บข้อมูลส่วนบุคคลของท่านไว้ตราบเท่าที่จำเป็นเพื่อบรรลุวัตถุประสงค์ที่ระบุไว้ในนโยบายนี้ หรือตามที่กฎหมายกำหนด
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              7. สิทธิ์ของเจ้าของข้อมูล
            </Typography>
            <Typography paragraph>
              ท่านมีสิทธิ์ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล ดังนี้:
            </Typography>
            <ul>
              <li>สิทธิ์ในการเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคลของท่าน</li>
              <li>สิทธิ์ในการแก้ไขข้อมูลส่วนบุคคลของท่านให้ถูกต้อง</li>
              <li>สิทธิ์ในการคัดค้านการเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล</li>
              <li>สิทธิ์ในการลบหรือทำลายข้อมูลส่วนบุคคล</li>
              <li>สิทธิ์ในการจำกัดการใช้ข้อมูลส่วนบุคคล</li>
              <li>สิทธิ์ในการเพิกถอนความยินยอม (ในกรณีที่เราใช้ความยินยอมเป็นฐานในการประมวลผล)</li>
              <li>สิทธิ์ในการยื่นเรื่องร้องเรียนต่อหน่วยงานกำกับดูแล</li>
            </ul>
            <Typography paragraph>
              หากท่านต้องการใช้สิทธิ์ดังกล่าว โปรดติดต่อเราตามช่องทางที่ระบุไว้ด้านล่าง
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              8. การเชื่อมโยงไปยังเว็บไซต์ภายนอก
            </Typography>
            <Typography paragraph>
              เว็บไซต์ของเราอาจมีการเชื่อมโยงไปยังเว็บไซต์ของบุคคลภายนอก นโยบายความเป็นส่วนตัวนี้ไม่มีผลบังคับใช้กับเว็บไซต์เหล่านั้น เราขอแนะนำให้ท่านศึกษานโยบายความเป็นส่วนตัวของเว็บไซต์ภายนอกก่อนการใช้งาน
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              9. การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว
            </Typography>
            <Typography paragraph>
              เราอาจมีการทบทวนและแก้ไขนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราวเพื่อให้สอดคล้องกับการเปลี่ยนแปลงของกฎหมาย แนวปฏิบัติ หรือบริการของเรา การเปลี่ยนแปลงใดๆ จะมีผลบังคับใช้เมื่อเราเผยแพร่นโยบายฉบับปรับปรุงบนเว็บไซต์ เราขอแนะนำให้ท่านตรวจสอบนโยบายนี้อย่างสม่ำเสมอ
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              10. ติดต่อเรา
            </Typography>
            <Typography paragraph>
              หากท่านมีคำถาม ข้อเสนอแนะ หรือต้องการใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคลของท่าน โปรดติดต่อเราได้ที่:
            </Typography>
            <Typography>
              Treetelu - ต้นไม้ในกระถาง<br />
              Line: @095xrokt
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
} 