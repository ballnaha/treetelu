import { Suspense } from 'react';
import ProductDetailClient from './client';

type Props = {
  params: { slug: string }
};

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

export default function ProductDetailPage({ params }: Props) {
  const slug = params.slug;

  return <ProductDetailClient slug={slug} />;
}
