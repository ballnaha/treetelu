import type { Metadata } from "next";
import { generateMetadata } from "./metadata";

export { generateMetadata };

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <>
      {children}
    </>
  );
} 