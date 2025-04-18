/**
 * Represents a product detail page
 */

import ProductDetailClient from './client';
import { Suspense } from 'react';

// นำเข้า generateMetadata จากไฟล์ metadata.ts
export { generateMetadata } from './metadata';

export default function Page(props: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { params } = props;
  const { slug } = params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailClient slug={slug} />
    </Suspense>
  );
}
