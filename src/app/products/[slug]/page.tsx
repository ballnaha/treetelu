import ProductDetailClient from './client';
import { Suspense } from 'react';

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

export default function Page({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailClient slug={params.slug} />
    </Suspense>
  );
}
