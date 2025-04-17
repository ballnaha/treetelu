import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    let searchParams;
    try {
      searchParams = new URL(request.url).searchParams;
    } catch (error) {
      console.error("Invalid URL:", request.url);
      searchParams = new URLSearchParams();
    }
    
    const status = searchParams.get('status') || 'on';
    const bestseller = searchParams.get('bestseller');
    
    const whereClause: any = {
      status: status,
    };
    
    if (bestseller) {
      whereClause.bestseller = bestseller;
    }
    
    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: {
        priority: 'asc'
      }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}
