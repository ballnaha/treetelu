import type { Metadata } from "next";
import { generateMetadata } from "./metadata";

export { generateMetadata };

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  // รอให้ params resolve ก่อนถ้าเป็น Promise
  const resolvedParams = await Promise.resolve(params);
  
  return (
    <>
      {children}
    </>
  );
} 