/**
 * Metadata for blog detail page
 */

import type { Metadata, ResolvingMetadata } from 'next';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { BlogPost } from '@/types/blog';

// @ts-ignore - ใช้ any type เพื่อหลีกเลี่ยงปัญหากับ Next.js
export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  // รองรับทั้งกรณีที่ params เป็น object ธรรมดาและเป็น Promise
  const params = await Promise.resolve(props.params);
  const slug = params?.slug;
  
  // ดึงค่า metadata จาก parent (ถ้ามี)
  const previousMetadata = await parent;
  
  // ถอดรหัส URL encoding และแปลง slug เป็นข้อความที่อ่านได้
  const decodedSlug = decodeURIComponent(slug);
  
  // ฟังก์ชันตรวจสอบว่าเป็นตัวอักษรภาษาไทยหรือไม่
  const isThaiChar = (char: string): boolean => {
    // รหัส Unicode สำหรับตัวอักษรภาษาไทย: \u0E00-\u0E7F
    return /[\u0E00-\u0E7F]/.test(char);
  };
  
  // ตรวจสอบว่า slug ประกอบด้วยภาษาไทยหรือไม่
  const hasThai = decodedSlug.split('').some(isThaiChar);
  
  // แปลง slug เป็นข้อความที่อ่านง่าย แต่ตรวจสอบกรณีภาษาไทย
  const readableSlug = decodedSlug
    .split('-')
    .map(word => {
      // ถ้ามีตัวอักษรภาษาไทย ไม่ต้องเปลี่ยนตัวพิมพ์ใหญ่
      if (hasThai) {
        return word;
      }
      // สำหรับภาษาอังกฤษ เปลี่ยนตัวแรกเป็นตัวพิมพ์ใหญ่
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
  
  // ค่าเริ่มต้นสำหรับ metadata โดยใช้ slug
  const defaultTitle = `${readableSlug} | ทรีเทลู`;
  const defaultDescription = `บทความเกี่ยวกับ${readableSlug} และการจัดสวนจากทรีเทลู`;
  
  // ดึงข้อมูลบทความตาม slug
  let blogPost: BlogPost | null = null;
  
  try {
    // ดึงข้อมูลจาก Prisma
    const blog = await prisma.blog.findUnique({
      where: { slug }
    });
    
    if (blog) {
      blogPost = blog as unknown as BlogPost;
    }
  } catch (error) {
    console.error('Error getting blog from Prisma:', error);
    
    try {
      // ถ้าเกิด error ลองใช้ Raw SQL แทน
      const blogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs WHERE slug = ${slug}`
      ) as any[];
      
      if (blogs && blogs.length > 0) {
        blogPost = blogs[0] as BlogPost;
      }
    } catch (fallbackError) {
      console.error('Error getting blog with raw SQL:', fallbackError);
    }
  }
  
  // ถ้าไม่พบบทความ ให้ใช้ metadata เริ่มต้น
  if (!blogPost) {
    // สร้าง URL สำหรับแชร์
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://treetelu.com';
    const ogImage = `${origin}/images/og-image.jpg`;
    
    return {
      title: defaultTitle,
      description: defaultDescription,
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        type: 'article',
        url: `${origin}/blog/${slug}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: readableSlug,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: [ogImage],
      },
      alternates: {
        canonical: `${origin}/blog/${slug}`,
      },
      keywords: [readableSlug, 'ทรีเทลู', 'ต้นไม้', 'บทความ'],
    };
  }
  
  // สร้างชื่อหัวข้อตามบทความ
  const titleWithSuffix = `${blogPost.title} | ทรีเทลู`;
  
  // สร้าง URL สำหรับแชร์
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://treetelu.com';
  const ogImage = blogPost.image?.startsWith('http') 
    ? blogPost.image 
    : blogPost.image 
      ? `${origin}${blogPost.image}` 
      : `${origin}/images/og-image.jpg`;

  return {
    title: titleWithSuffix,
    description: blogPost.excerpt || `บทความเกี่ยวกับ ${blogPost.title}`,
    openGraph: {
      title: titleWithSuffix,
      description: blogPost.excerpt || `บทความเกี่ยวกับ ${blogPost.title}`,
      type: 'article',
      url: `${origin}/blog/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: blogPost.title,
        }
      ],
      publishedTime: blogPost.createdAt?.toString(),
      modifiedTime: blogPost.updatedAt?.toString(),
      authors: ['ทรีเทลู'],
      section: blogPost.category,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleWithSuffix,
      description: blogPost.excerpt || `บทความเกี่ยวกับ ${blogPost.title}`,
      images: [ogImage],
    },
    alternates: {
      canonical: `${origin}/blog/${slug}`,
    },
    keywords: [blogPost.title, blogPost.category, 'ทรีเทลู', 'ต้นไม้', 'บทความ'],
  };
} 