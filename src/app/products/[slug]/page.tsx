/**
 * Represents a product detail page
 */

import ProductDetailClient from './client';
import { Suspense } from 'react';

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

// TypeScript กำหนด any ชั่วคราวเพื่อหลีกเลี่ยงข้อขัดแย้งกับ Next.js
// @ts-ignore
export default async function Page(props: any) {
  const params = await Promise.resolve(props.params);
  const slug = params?.slug;

  return (
    
    <ProductDetailClient slug={slug} />
    
  );
}
