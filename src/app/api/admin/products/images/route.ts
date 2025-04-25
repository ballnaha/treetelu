import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

/**
 * GET handler for fetching product images (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสสินค้า' },
        { status: 400 }
      );
    }
    
    // Fetch product images
    const images = await prisma.productimage.findMany({
      where: {
        productId: parseInt(productId)
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('Error in product images API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพสินค้า';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
    } else {
      errorDetails = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * POST handler for adding a product image (admin only)
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { productId, imageName, imageDesc } = body;
    
    if (!productId || !imageName) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุรหัสสินค้าและชื่อไฟล์รูปภาพ' },
        { status: 400 }
      );
    }
    
    // Create new product image
    const newImage = await prisma.productimage.create({
      data: {
        productId: parseInt(productId.toString()),
        imageName,
        imageDesc: imageDesc || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'เพิ่มรูปภาพสินค้าเรียบร้อย',
      image: newImage
    });
  } catch (error) {
    console.error('Error in add product image API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการเพิ่มรูปภาพสินค้า';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
    } else {
      errorDetails = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for removing a product image (admin only)
 */
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('id');
    
    if (!imageId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสรูปภาพ' },
        { status: 400 }
      );
    }
    
    // Find the image to get the filename
    const image = await prisma.productimage.findUnique({
      where: {
        id: parseInt(imageId)
      }
    });
    
    if (!image) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรูปภาพที่ต้องการลบ' },
        { status: 404 }
      );
    }
    
    // Delete from database
    await prisma.productimage.delete({
      where: {
        id: parseInt(imageId)
      }
    });
    
    // Delete the file from disk
    try {
      const imagePath = path.join(process.cwd(), 'public', 'images', 'product', image.imageName || '');
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (fileError) {
      console.error('Error deleting image file:', fileError);
      // Continue even if file deletion fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'ลบรูปภาพสินค้าเรียบร้อย'
    });
  } catch (error) {
    console.error('Error in delete product image API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการลบรูปภาพสินค้า';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
    } else {
      errorDetails = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      },
      { status: 500 }
    );
  }
});
