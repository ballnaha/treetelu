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
  } catch (error) {
    console.error('Error fetching product data for metadata:', error);
  }

  // กำหนด metadata เริ่มต้น (fallback) กรณีไม่มีข้อมูลสินค้า
  const productName = product?.productName ? decodeURIComponent(product.productName) : '';
  const productDesc = product?.productDesc ? decodeURIComponent(product.productDesc) : '';
  
  const title = productName ? `${productName} | Treetelu ต้นไม้ในกระถาง` : 'สินค้า | Treetelu ต้นไม้ในกระถาง';
  const description = productDesc || 'รายละเอียดสินค้าต้นไม้มงคล ไม้อวบน้ำ และของชำร่วยที่มีคุณภาพ';
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://treetelu.com/products/${slug}`,
      siteName: 'Treetelu ต้นไม้ในกระถาง',
      images: [
        {
          url: product?.productImg 
            ? `https://treetelu.com/images/product/${product.productImg}`
            : 'https://treetelu.com/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: product?.productName || 'Treetelu ต้นไม้ในกระถาง - สินค้าต้นไม้มงคล',
        },
      ],
      locale: 'th_TH',
      type: 'website',
    },
  };
} 