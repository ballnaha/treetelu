import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const product = await prisma.product.findFirst({
      where: {
        slug: slug,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'ไม่พบสินค้าที่ต้องการ' },
        { status: 404 }
      );
    }

    const productImages = await prisma.productimage.findMany({
      where: {
        productId: product.id,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const productWithImages = {
      ...product,
      images: productImages,
    };

    return NextResponse.json(productWithImages);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}
