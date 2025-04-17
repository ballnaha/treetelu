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
    
    // รับพารามิเตอร์ filter จาก URL
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 20;
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, price_low, price_high
    const bestseller = searchParams.get('bestseller') || null;
    const search = searchParams.get('search') || '';
    
    // สร้างเงื่อนไขการค้นหา
    const whereClause: any = {
      productStatus: 'on'
    };
    
    // เพิ่มเงื่อนไขการค้นหาตามหมวดหมู่
    if (category) {
      whereClause.category = category;
    }
    
    // เพิ่มเงื่อนไขการค้นหาตามคำค้น
    if (search) {
      whereClause.OR = [
        { productName: { contains: search } },
        { productDesc: { contains: search } },
        { category: { contains: search } }
      ];
    }
    
    // สร้างการจัดเรียงตามค่าที่ต้องการ
    let orderBy: any;
    switch (sortBy) {
      case 'price_low':
        orderBy = { salesPrice: 'asc' };
        break;
      case 'price_high':
        orderBy = { salesPrice: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // คำนวณการข้ามรายการสำหรับการแบ่งหน้า
    const skip = (page - 1) * pageSize;
    
    // ดึงข้อมูลสินค้าทั้งหมดตามเงื่อนไข
    const products = await prisma.product.findMany({
      where: whereClause,
      skip: limit ? undefined : skip,
      take: limit || pageSize,
      orderBy: orderBy
    });

    // นับจำนวนสินค้าทั้งหมดที่ตรงกับเงื่อนไข (สำหรับการแบ่งหน้า)
    const totalCount = await prisma.product.count({
      where: whereClause
    });
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalCount / pageSize);

    // ถ้าต้องการสุ่มลำดับของสินค้า
    const shouldRandomize = searchParams.get('random') === 'true';
    const finalProducts = shouldRandomize 
      ? [...products].sort(() => Math.random() - 0.5)
      : products;

    // ส่งข้อมูลกลับพร้อมข้อมูลการแบ่งหน้า
    return NextResponse.json({
      products: finalProducts,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}
