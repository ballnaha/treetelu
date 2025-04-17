import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const category = resolvedParams.slug;

    const categoryData = await prisma.category.findFirst({
      where: {
        categoryName: category,
      },
    });

    if (!categoryData) {
      return NextResponse.json(
        { message: 'ไม่พบหมวดหมู่ที่ต้องการ' },
        { status: 404 }
      );
    }

    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}
