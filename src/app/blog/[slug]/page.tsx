'use client';

import { Container, Typography, Box, Link as MuiLink } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';

const blogPosts = [
  {
    id: 1,
    title: 'ต้นไม้มงคลตามทิศเหนือ',
    excerpt: 'เรียนรู้เกี่ยวกับต้นไม้มงคลที่เหมาะสำหรับทิศเหนือ ตามหลักฮวงจุ้ย',
    image: '/images/blog/north.jpg',
    slug: 'ต้นไม้มงคลตามทิศเหนือ',
    date: '20 มีนาคม 2024',
    content: `
      <p>ทิศเหนือเป็นทิศที่เกี่ยวข้องกับความก้าวหน้าในอาชีพการงานและชื่อเสียง ตามหลักฮวงจุ้ย การจัดวางต้นไม้มงคลในทิศนี้จะช่วยเสริมสร้างความก้าวหน้าในอาชีพการงาน</p>
      <p>ต้นไม้ที่เหมาะสำหรับทิศเหนือ ได้แก่:</p>
      <ul>
        <li>ต้นมะยม - เสริมความก้าวหน้าในอาชีพ</li>
        <li>ต้นแก้ว - เสริมความรุ่งเรือง</li>
        <li>ต้นโมก - เสริมความมั่นคง</li>
      </ul>
    `
  },
  {
    id: 2,
    title: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    excerpt: 'แนะนำต้นไม้เสริมดวงที่เหมาะสำหรับทิศตะวันออก',
    image: '/images/blog/east.jpg',
    slug: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    date: '19 มีนาคม 2024',
    content: `
      <p>ทิศตะวันออกเป็นทิศที่เกี่ยวข้องกับสุขภาพและครอบครัว ตามหลักฮวงจุ้ย การจัดวางต้นไม้มงคลในทิศนี้จะช่วยเสริมสร้างสุขภาพที่ดีและความสัมพันธ์ในครอบครัว</p>
      <p>ต้นไม้ที่เหมาะสำหรับทิศตะวันออก ได้แก่:</p>
      <ul>
        <li>ต้นวาสนา - เสริมสุขภาพ</li>
        <li>ต้นเข็ม - เสริมความรักในครอบครัว</li>
        <li>ต้นแก้วกาญจนา - เสริมความสุข</li>
      </ul>
    `
  },
  {
    id: 3,
    title: 'ต้นไม้เสริมโชคลาภทิศใต้',
    excerpt: 'ต้นไม้เสริมโชคลาภที่เหมาะสำหรับทิศใต้',
    image: '/images/blog/south.jpg',
    slug: 'ต้นไม้เสริมโชคลาภทิศใต้',
    date: '18 มีนาคม 2024',
    content: `
      <p>ทิศใต้เป็นทิศที่เกี่ยวข้องกับชื่อเสียงและความสำเร็จ ตามหลักฮวงจุ้ย การจัดวางต้นไม้มงคลในทิศนี้จะช่วยเสริมสร้างชื่อเสียงและความสำเร็จ</p>
      <p>ต้นไม้ที่เหมาะสำหรับทิศใต้ ได้แก่:</p>
      <ul>
        <li>ต้นกวนอิม - เสริมชื่อเสียง</li>
        <li>ต้นเศรษฐี - เสริมโชคลาภ</li>
        <li>ต้นวาสนา - เสริมความสำเร็จ</li>
      </ul>
    `
  },
  {
    id: 4,
    title: 'ต้นไม้เสริมความรักทิศตะวันตก',
    excerpt: 'ต้นไม้เสริมความรักที่เหมาะสำหรับทิศตะวันตก',
    image: '/images/blog/west.jpg',
    slug: 'ต้นไม้เสริมความรักทิศตะวันตก',
    date: '17 มีนาคม 2024',
    content: `
      <p>ทิศตะวันตกเป็นทิศที่เกี่ยวข้องกับความรักและความสัมพันธ์ ตามหลักฮวงจุ้ย การจัดวางต้นไม้มงคลในทิศนี้จะช่วยเสริมสร้างความรักและความสัมพันธ์ที่ดี</p>
      <p>ต้นไม้ที่เหมาะสำหรับทิศตะวันตก ได้แก่:</p>
      <ul>
        <li>ต้นกุหลาบ - เสริมความรัก</li>
        <li>ต้นเข็ม - เสริมความสัมพันธ์</li>
        <li>ต้นแก้วกาญจนา - เสริมความสุขในความรัก</li>
      </ul>
    `
  },
  {
    id: 5,
    title: '5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    excerpt: 'แนะนำต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน ตามความเชื่อโบราณ',
    image: '/images/blog/money.jpg',
    slug: '5-ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    date: '21 มีนาคม 2024',
    content: `
      <p>การปลูกต้นไม้มงคลในบ้านหรือที่ทำงาน นอกจากจะช่วยสร้างบรรยากาศที่ดีแล้ว ยังเชื่อกันว่าสามารถช่วยเสริมโชคลาภการเงินได้อีกด้วย ตามความเชื่อโบราณของไทย</p>
      
      <p>1. ต้นเงินไหลมา</p>
      <p>เป็นต้นไม้มงคลที่นิยมปลูกกันมาก เนื่องจากชื่อที่เป็นมงคล หมายถึงเงินทองไหลมาเทมา ควรปลูกในทิศตะวันออกเฉียงเหนือของบ้านหรือที่ทำงาน</p>
      
      <p>2. ต้นเศรษฐีเรือนใน</p>
      <p>เป็นไม้ประดับที่มีใบสวยงาม ตามความเชื่อจะช่วยเรียกเงินทองเข้าบ้าน ควรปลูกในทิศตะวันออกของบ้าน</p>
      
      <p>3. ต้นวาสนา</p>
      <p>เป็นต้นไม้มงคลที่เชื่อกันว่าจะนำความร่ำรวยมาให้ ควรปลูกในทิศตะวันออกเฉียงใต้ของบ้าน</p>
      
      <p>4. ต้นแก้วกาญจนา</p>
      <p>เป็นต้นไม้ที่เชื่อกันว่าจะนำโชคลาภมาให้ ควรปลูกในทิศตะวันตกเฉียงใต้ของบ้าน</p>
      
      <p>5. ต้นมะยม</p>
      <p>เป็นต้นไม้มงคลที่เชื่อกันว่าจะทำให้มีคนนิยมชมชอบ ควรปลูกในทิศเหนือของบ้าน</p>
      
      <p>การดูแลต้นไม้มงคลให้เจริญเติบโตดี จะช่วยเสริมพลังมงคลให้กับบ้านและผู้อยู่อาศัย ควรหมั่นรดน้ำ พรวนดิน และใส่ปุ๋ยอย่างสม่ำเสมอ</p>
    `
  },
  {
    id: 6,
    title: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    excerpt: 'แนะนำต้นไม้ที่ช่วยดูดซับพลังงานลบและวิธีการดูแลรักษา',
    image: '/images/blog/negative-energy.jpg',
    slug: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    date: '22 มีนาคม 2024',
    content: `
      <p>ต้นไม้บางชนิดมีความสามารถในการดูดซับพลังงานลบและช่วยปรับสมดุลพลังงานในบ้านได้ ตามหลักฮวงจุ้ยและความเชื่อโบราณ</p>
      
      <p>1. ต้นลิ้นมังกร</p>
      <p>เป็นต้นไม้ที่เชื่อกันว่าสามารถดูดซับพลังงานลบได้ดี ควรวางในมุมที่ต้องการปรับสมดุลพลังงาน</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>รดน้ำสัปดาห์ละ 1-2 ครั้ง</li>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>หมั่นเช็ดใบให้สะอาด</li>
      </ul>
      
      <p>2. ต้นกวักมรกต</p>
      <p>เป็นต้นไม้ที่ช่วยดูดซับพลังงานลบและเสริมความมั่งคั่ง ควรวางในทิศตะวันออกเฉียงใต้</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>รดน้ำเมื่อดินแห้ง</li>
        <li>ใส่ปุ๋ยเดือนละครั้ง</li>
        <li>ตัดแต่งใบที่แห้งเป็นประจำ</li>
      </ul>
      
      <p>3. ต้นเศรษฐีเรือนใน</p>
      <p>ช่วยดูดซับพลังงานลบและเสริมความมั่งคั่ง ควรวางในทิศตะวันออก</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>รดน้ำวันเว้นวัน</li>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>หมั่นพ่นละอองน้ำที่ใบ</li>
      </ul>
      
      <p>4. ต้นวาสนา</p>
      <p>ช่วยดูดซับพลังงานลบและเสริมความร่ำรวย ควรวางในทิศตะวันออกเฉียงใต้</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>รดน้ำสัปดาห์ละ 2-3 ครั้ง</li>
        <li>ใส่ปุ๋ยทุก 2 เดือน</li>
        <li>หมั่นตัดแต่งกิ่งที่แห้ง</li>
      </ul>
      
      <p>5. ต้นแก้วกาญจนา</p>
      <p>ช่วยดูดซับพลังงานลบและเสริมความสุข ควรวางในทิศตะวันตกเฉียงใต้</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>รดน้ำเมื่อดินแห้ง</li>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>หมั่นเช็ดใบให้สะอาด</li>
      </ul>
      
      <p>การดูแลต้นไม้ดูดพลังงานลบให้ถูกต้องจะช่วยให้ต้นไม้เจริญเติบโตดีและสามารถดูดซับพลังงานลบได้อย่างมีประสิทธิภาพ ควรหมั่นดูแลรักษาต้นไม้อย่างสม่ำเสมอ</p>
    `
  },
  {
    id: 7,
    title: '5 ต้นไม้เสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    excerpt: 'แนะนำต้นไม้ที่ช่วยเสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    image: '/images/blog/work.jpg',
    slug: '5-ต้นไม้เสริมการทำงาน-เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    date: '23 มีนาคม 2024',
    content: `
      <p>การจัดวางต้นไม้ในที่ทำงานไม่เพียงแต่ช่วยสร้างบรรยากาศที่ดี แต่ยังสามารถช่วยเพิ่มประสิทธิภาพการทำงานและความคิดสร้างสรรค์ได้อีกด้วย</p>
      
      <p>1. ต้นลิ้นมังกร</p>
      <p>เป็นต้นไม้ที่ช่วยฟอกอากาศและดูดซับสารพิษ ช่วยให้อากาศบริสุทธิ์ ส่งผลให้สมองปลอดโปร่งและทำงานได้อย่างมีประสิทธิภาพ</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>รดน้ำสัปดาห์ละ 1-2 ครั้ง</li>
        <li>หมั่นเช็ดใบให้สะอาด</li>
      </ul>
      
      <p>2. ต้นเศรษฐีเรือนใน</p>
      <p>ช่วยสร้างบรรยากาศที่ดีในการทำงาน และเชื่อกันว่าจะช่วยเสริมความมั่งคั่งในอาชีพการงาน</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>รดน้ำเมื่อดินแห้ง</li>
        <li>หมั่นพ่นละอองน้ำที่ใบ</li>
      </ul>
      
      <p>3. ต้นแก้วกาญจนา</p>
      <p>ช่วยสร้างความสดชื่นและผ่อนคลาย ช่วยลดความเครียดจากการทำงาน</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>รดน้ำเมื่อดินแห้ง</li>
        <li>หมั่นตัดแต่งกิ่งที่แห้ง</li>
      </ul>
      
      <p>4. ต้นวาสนา</p>
      <p>ช่วยสร้างความสดชื่นและเสริมความมั่นใจในการทำงาน</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>รดน้ำสัปดาห์ละ 2-3 ครั้ง</li>
        <li>ใส่ปุ๋ยทุก 2 เดือน</li>
      </ul>
      
      <p>5. ต้นกวนอิม</p>
      <p>ช่วยสร้างความสงบและสมาธิในการทำงาน</p>
      <p>วิธีดูแล:</p>
      <ul>
        <li>วางในที่ที่มีแสงแดดรำไร</li>
        <li>รดน้ำเมื่อดินแห้ง</li>
        <li>หมั่นเช็ดใบให้สะอาด</li>
      </ul>
      
      <p>การจัดวางต้นไม้ในที่ทำงานควรคำนึงถึง:</p>
      <ul>
        <li>ขนาดของต้นไม้ที่เหมาะสมกับพื้นที่</li>
        <li>ความต้องการแสงของต้นไม้แต่ละชนิด</li>
        <li>การดูแลรักษาที่สะดวก</li>
        <li>ไม่ควรวางต้นไม้ที่ต้องการการดูแลมากเกินไป</li>
      </ul>
      
      <p>การมีต้นไม้ในที่ทำงานจะช่วยสร้างบรรยากาศที่ดี ส่งผลให้การทำงานมีประสิทธิภาพมากขึ้น และช่วยลดความเครียดจากการทำงานได้อีกด้วย</p>
    `
  }
];

export default function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const resolvedParams = use(params);
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const post = blogPosts.find(p => p.slug === decodedSlug);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          ไม่พบบทความที่คุณกำลังค้นหา
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 6 }}>
        <MuiLink
          component={Link}
          href="/blog"
          sx={{ 
            color: theme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': {
              color: theme.palette.primary.main
            }
          }}
        >
          ← กลับไปยังบทความทั้งหมด
        </MuiLink>
      </Box>

      <Typography 
        variant="h1" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' },
          fontWeight: 500,
          mb: 4,
          color: theme.palette.text.primary
        }}
      >
        {post.title}
      </Typography>

      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ mb: 6 }}
      >
        {post.date}
      </Typography>

      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          height: { xs: 240, md: 400 },
          mb: 6
        }}
      >
        <Image
          src={post.image}
          alt={post.title}
          fill
          style={{ 
            objectFit: 'cover'
          }}
        />
      </Box>

      <Box 
        sx={{ 
          '& p': {
            mb: 4,
            lineHeight: 1.8,
            fontSize: '1.125rem',
            color: theme.palette.text.primary
          },
          '& ul': {
            pl: 3,
            mb: 4
          },
          '& li': {
            mb: 2,
            lineHeight: 1.6,
            fontSize: '1.125rem',
            color: theme.palette.text.primary
          }
        }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </Container>
  );
} 