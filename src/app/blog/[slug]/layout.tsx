'use client';

import { ReactNode } from "react";

interface BlogPostLayoutProps {
  children: ReactNode;
  params: { slug: string };
}

export default function BlogPostLayout({
  children,
  params,
}: BlogPostLayoutProps) {
  return (
    <>
      {children}
    </>
  );
} 