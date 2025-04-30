import { BlogPost } from '@/types/blog';
import prisma from './prisma';

/**
 * ฟังก์ชันดึงบทความทั้งหมด
 * @returns รายการบทความทั้งหมด
 */
export async function getAllBlogs(): Promise<BlogPost[]> {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
      where: { published: true }
    });
    
    return blogs;
  } catch (error) {
    console.error('Error fetching all blogs:', error);
    return [];
  }
}

/**
 * ฟังก์ชันดึงบทความตาม slug
 * @param slug slug ของบทความ
 * @returns ข้อมูลบทความ หรือ null ถ้าไม่พบ
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug }
    });
    
    return blog;
  } catch (error) {
    console.error(`Error fetching blog by slug (${slug}):`, error);
    return null;
  }
}

/**
 * ฟังก์ชันดึงบทความตามหมวดหมู่
 * @param category หมวดหมู่ของบทความ
 * @returns รายการบทความในหมวดหมู่ที่กำหนด
 */
export async function getBlogsByCategory(category: string): Promise<BlogPost[]> {
  try {
    const blogs = await prisma.blog.findMany({
      where: { 
        category,
        published: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return blogs;
  } catch (error) {
    console.error(`Error fetching blogs by category (${category}):`, error);
    return [];
  }
}

/**
 * ฟังก์ชันดึงหมวดหมู่ทั้งหมด
 * @returns รายการหมวดหมู่ที่มีบทความ
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const categories = await prisma.blog.groupBy({
      by: ['category'],
      where: { published: true }
    });
    
    return categories.map((item: { category: string }) => item.category);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return [];
  }
}

/**
 * ฟังก์ชันดึงบทความล่าสุด
 * @param limit จำนวนบทความที่ต้องการ
 * @returns รายการบทความล่าสุด
 */
export async function getLatestBlogs(limit: number = 5): Promise<BlogPost[]> {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return blogs;
  } catch (error) {
    console.error(`Error fetching latest blogs (${limit}):`, error);
    return [];
  }
} 