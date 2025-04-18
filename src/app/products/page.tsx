import { Suspense } from 'react';
import type { Metadata } from 'next/types';
import ProductsClient from './client';

export const metadata: Metadata = {
  title: 'สินค้าทั้งหมด | Treetelu ต้นไม้ในกระถาง',
  description: 'เลือกซื้อสินค้าต้นไม้มงคล ไม้อวบน้ำ และของชำร่วยที่มีคุณภาพ',
  openGraph: {
    title: 'สินค้าทั้งหมด | Treetelu ต้นไม้ในกระถาง',
    description: 'เลือกซื้อสินค้าต้นไม้มงคล ไม้อวบน้ำ และของชำร่วยที่มีคุณภาพ',
    url: 'https://treetelu.com/products',
    siteName: 'Treetelu ต้นไม้ในกระถาง',
    images: [
      {
        url: 'https://treetelu.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Treetelu ต้นไม้ในกระถาง - สินค้าต้นไม้มงคลและของชำร่วย',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
} 