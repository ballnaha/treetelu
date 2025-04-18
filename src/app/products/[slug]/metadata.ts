import type { Metadata } from 'next/types';

interface PageParams {
  slug: string;
}

interface Props {
  params: PageParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  
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
  const title = product?.productName + ` | Treetelu ต้นไม้ในกระถาง` || 'สินค้า | Treetelu ต้นไม้ในกระถาง';
  const description = product?.productDesc || 'รายละเอียดสินค้าต้นไม้มงคล ไม้อวบน้ำ และของชำร่วยที่มีคุณภาพ';
  
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