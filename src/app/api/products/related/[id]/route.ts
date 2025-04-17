import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// API endpoint สำหรับดึงสินค้าที่เกี่ยวข้อง โดยใช้ category เดียวกันเท่านั้น
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // รอและตรวจสอบ params
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // ตรวจสอบว่าได้รับ ID
    if (!id) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสสินค้า' }, 
        { status: 400 }
      );
    }

    // หา product ต้นทางก่อน
    const productId = parseInt(id, 10);
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    // ดึง categoryId จากสินค้าต้นทาง
    const categoryId = product.categoryId;
    
    // ถ้าไม่มี categoryId ให้คืนค่าเป็นอาร์เรย์ว่าง
    if (!categoryId) {
      return NextResponse.json([]);
    }
    
    // นับจำนวนสินค้าในหมวดหมู่เดียวกัน
    const totalProducts = await prisma.product.count({
      where: {
        AND: [
          { categoryId: categoryId },
          { id: { not: productId } }
        ]
      }
    });

    // ถ้าไม่มีสินค้าเลย ให้คืนค่าเป็นอาร์เรย์ว่าง
    if (totalProducts === 0) {
      return NextResponse.json([]);
    }
    
    // คำนวณค่า skip สำหรับการสุ่ม
    // ถ้ามีสินค้าน้อยกว่า 10 รายการ ให้ใช้ 0 เป็น offset
    // ถ้ามีสินค้ามากกว่า ให้สุ่มค่า skip โดยไม่ให้เกินจำนวนสินค้าที่มี - 10
    const randomSkip = totalProducts <= 10 ? 0 : Math.floor(Math.random() * (totalProducts - 10));

    // ค้นหาสินค้าอื่นที่มีหมวดหมู่เดียวกัน โดยไม่รวมสินค้าต้นทาง
    // และใช้ค่า skip แบบสุ่ม
    const relatedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { categoryId: categoryId },
          { id: { not: productId } }
        ]
      },
      skip: randomSkip,
      take: 10 // เพิ่มจำนวนเป็น 10 เพื่อให้มีโอกาสได้สินค้าที่มีรูปภาพครบ 5 รายการ
    });

    // สลับตำแหน่งสินค้าให้เป็นแบบสุ่ม
    const shuffledProducts = [...relatedProducts].sort(() => Math.random() - 0.5);

    // หาเพิ่มรูปภาพสำหรับสินค้าที่เกี่ยวข้อง
    const productsWithImages = await Promise.all(shuffledProducts.map(async (product) => {
      const images = await prisma.productimage.findMany({
        where: { productId: product.id },
        take: 1
      });
      return { ...product, images };
    }));
    
    // กรองเฉพาะสินค้าที่มีรูปภาพ
    const productsWithImageOnly = productsWithImages.filter(product => 
      (product.images && product.images.length > 0) || product.productImg
    );
    
    // จำกัดจำนวนสินค้าให้เหลือไม่เกิน 5 รายการ
    const limitedProducts = productsWithImageOnly.slice(0, 5);

    // จัดการรูปภาพและราคา
    const formattedProducts = limitedProducts.map(product => {
      let imageName = product.productImg || 'default.jpg';
      
      // หากมีรูปภาพใน images array ให้ใช้รูปภาพแรก
      if (product.images && product.images.length > 0 && product.images[0].imageName) {
        imageName = product.images[0].imageName;
      }

      // คำนวณราคาขายและส่วนลด
      const originalPrice = product.originalPrice instanceof Decimal 
        ? product.originalPrice.toNumber() 
        : typeof product.originalPrice === 'string' 
          ? parseFloat(product.originalPrice) 
          : product.originalPrice || 0;
      
      const salesPrice = product.salesPrice instanceof Decimal 
        ? product.salesPrice.toNumber() 
        : typeof product.salesPrice === 'string' 
          ? parseFloat(product.salesPrice) 
          : product.salesPrice || 0;
      
      const hasDiscount = originalPrice > 0 && salesPrice > 0 && originalPrice !== salesPrice;
      const discountPercent = hasDiscount 
        ? Math.round((1 - salesPrice / originalPrice) * 100) 
        : 0;

      // ดึงข้อมูลหมวดหมู่
      const category = product.category || '';

      // สร้างข้อมูลสินค้าแบบง่าย
      return {
        id: product.id.toString(),
        sku: product.sku || '',
        name: product.productName || '',
        slug: product.slug || '',
        imageName,
        originalPrice,
        salesPrice,
        hasDiscount,
        discountPercent,
        category
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าที่เกี่ยวข้อง' },
      { status: 500 }
    );
  }
} 