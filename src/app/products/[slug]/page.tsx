import ProductDetailClient from './client';
import { Suspense } from 'react';
import { Metadata } from 'next';

interface PageParams {
  slug: string;
}

interface PageProps {
  params: PageParams;
}

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailClient slug={slug} />
    </Suspense>
  );
}
