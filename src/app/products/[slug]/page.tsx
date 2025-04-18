import { Suspense } from 'react';
import ProductDetailClient from './client';

type Props = {
  params: Promise<{ slug: string }> | { slug: string }
};

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

export default async function ProductDetailPage({ params }: Props) {
  // ใช้ await เพื่อรอให้ params ถูก resolve
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return <ProductDetailClient slug={slug} />;
}
