import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // ดึงพารามิเตอร์จาก URL
    let searchParams;
    try {
      searchParams = new URL(request.url).searchParams;
    } catch (error) {
      console.error("Invalid URL:", request.url);
      searchParams = new URLSearchParams();
    }
    
    // รับพารามิเตอร์ geographyId (ถ้ามี)
    const geographyId = searchParams.get('geographyId') 
      ? parseInt(searchParams.get('geographyId') as string) 
      : undefined;
    
    // สร้างเงื่อนไขการค้นหา
    const whereClause: any = {
      deletedAt: null
    };
    
    // เพิ่มเงื่อนไขการค้นหาตามภูมิภาค (ถ้ามี)
    if (geographyId) {
      whereClause.geographyId = geographyId;
    }
    
    // ดึงข้อมูลจังหวัดทั้งหมดตามเงื่อนไข
    const provinces = await prisma.thaiprovinces.findMany({
      where: whereClause,
      orderBy: {
        nameTh: 'asc'
      }
    });
    
    return NextResponse.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจังหวัด' },
      { status: 500 }
    );
  }
} 