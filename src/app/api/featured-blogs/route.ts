import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - ดึงข้อมูลบทความเด่นสำหรับหน้าแรก
export async function GET(req: NextRequest) {
  try {
    // ดึงข้อมูลบทความล่าสุด 3 รายการ
    try {
      const featuredBlogs = await prisma.blog.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      });
      
      // ส่งข้อมูลกลับไป
      return NextResponse.json({ 
        blogs: featuredBlogs,
        status: 'success' 
      });
    } catch (error) {
      console.error('Error finding featured blogs with Prisma:', error);
      // ใช้ direct SQL query แทน
      const featuredBlogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs WHERE published = true ORDER BY createdAt DESC LIMIT 3`
      ) as any[];
      
      return NextResponse.json({ 
        blogs: featuredBlogs,
        status: 'success' 
      });
    }
  } catch (error) {
    console.error('Error getting featured blogs:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      status: 'error' 
    }, { status: 500 });
  }
} 