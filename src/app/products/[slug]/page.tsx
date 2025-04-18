import ProductDetailClient from './client';
import { Suspense } from 'react';
import { Metadata } from 'next';

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailClient slug={params.slug} />
    </Suspense>
  );
}
