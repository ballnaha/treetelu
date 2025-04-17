import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Product } from '@/types/product';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: Request) {
  try {
    // ดึงพารามิเตอร์จาก URL
    let searchParams;
    try {
      searchParams = new URL(request.url).searchParams;
    } catch (error) {
      console.error('Invalid URL:', request.url);
      searchParams = new URLSearchParams();
    }
    
    // ดึงข้อมูลทั้งหมดที่ product_status = 'on'
    const products = await prisma.product.findMany({
      where: {
        productStatus: 'on'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // จัดกลุ่มสินค้าตาม category
    const groupedProducts: Record<string, any[]> = {};
    
    products.forEach((product: any) => {
      const category = product.category || 'uncategorized';
      
      if (!groupedProducts[category]) {
        groupedProducts[category] = [];
      }
      
      groupedProducts[category].push(product);
    });
    
    // ถ้าต้องการจำกัดจำนวน items ในแต่ละหมวดหมู่
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : undefined;
    
    if (limit) {
      Object.keys(groupedProducts).forEach(category => {
        groupedProducts[category] = groupedProducts[category].slice(0, limit);
      });
    }
    
    // สร้างรูปแบบผลลัพธ์แบบ array ของ objects ที่มี category และ products
    const result = Object.keys(groupedProducts).map(category => ({
      category,
      products: groupedProducts[category]
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categorized products:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าตามหมวดหมู่' },
      { status: 500 }
    );
  }
} 

