import { use } from 'react';
import { blogPosts } from '@/data/blogPosts';
import BlogPostClient from '../../../components/BlogPostClient';

export default function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const post = blogPosts.find(p => p.slug === decodedSlug);

  return <BlogPostClient post={post} decodedSlug={decodedSlug} />;
} 