/**
 * Metadata for product detail page
 */

import type { Metadata } from 'next/types';

// @ts-ignore - ใช้ any type เพื่อหลีกเลี่ยงปัญหากับ Next.js
export async function generateMetadata(props: any): Promise<Metadata> {
  // รองรับทั้งกรณีที่ params เป็น object ธรรมดาและเป็น Promise
  const params = props.params;
  const slug = params?.slug;
  
  // ดึงข้อมูลสินค้าจาก API
  let product;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/products/${slug}`, {
      next: { revalidate: 60 } // revalidate ทุก 60 วินาที
    });
    product = await res.json();
    
    // พิมพ์ค่าเพื่อดูข้อมูล
    console.log('Product data for SEO:', {
      productName: product?.productName,
      slug: slug,
      status: res.status
    });
  } catch (error) {
    console.error('Error fetching product data for metadata:', error);
  }

  // กำหนด metadata เริ่มต้น (fallback) กรณีไม่มีข้อมูลสินค้า
  let displayName = '';
  
  // ตรวจสอบว่ามีชื่อสินค้าหรือไม่และอยู่ในรูปแบบที่สามารถ decode ได้
  try {
    if (product?.productName) {
      displayName = decodeURIComponent(product.productName);
    } else if (product?.name) {
      displayName = decodeURIComponent(product.name);
    }
  } catch (e) {
    // กรณีเกิด error ในการ decode URI ให้ใช้ค่าเดิม
    displayName = product?.productName || product?.name || '';
    console.error('Error decoding product name:', e);
  }
  
  let displayDesc = '';
  
  // ตรวจสอบคำอธิบายสินค้า
  try {
    if (product?.productDesc) {
      displayDesc = decodeURIComponent(product.productDesc);
    } else if (product?.description) {
      displayDesc = decodeURIComponent(product.description);
    }
  } catch (e) {
    // กรณีเกิด error ในการ decode URI ให้ใช้ค่าเดิม
    displayDesc = product?.productDesc || product?.description || '';
    console.error('Error decoding product description:', e);
  }
  
  const title = displayName 
    ? `${displayName} | Treetelu ต้นไม้ในกระถาง` 
    : 'สินค้า | Treetelu ต้นไม้ในกระถาง';
    
  const description = displayDesc || 'รายละเอียดสินค้าต้นไม้มงคล ไม้อวบน้ำ และของชำร่วยที่มีคุณภาพ';
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products/${slug}`,
      siteName: 'Treetelu ต้นไม้ในกระถาง',
      images: [
        {
          url: product?.productImg 
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/product/${product.productImg}`
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: displayName || 'Treetelu ต้นไม้ในกระถาง - สินค้าต้นไม้มงคล',
        },
      ],
      locale: 'th_TH',
      type: 'website',
    },
  };
} 