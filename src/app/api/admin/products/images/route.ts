import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';
import fs from 'fs';
import path from 'path';
import { revalidatePath, revalidateTag } from 'next/cache';

const prisma = new PrismaClient();

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
    console.log('Adding product image - request received');
    const body = await req.json();
    const { productId, imageName, imageDesc } = body;
    
    console.log('Product image data:', { productId, imageName, imageDesc });
    
    if (!productId || !imageName) {
      console.error('Missing required fields:', { productId, imageName });
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุรหัสสินค้าและชื่อไฟล์รูปภาพ' },
        { status: 400 }
      );
    }
    
    // Create new product image
    console.log('Creating product image record in database');
    const newImage = await prisma.productimage.create({
      data: {
        productId: parseInt(productId.toString()),
        imageName,
        imageDesc: imageDesc || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('Product image created in database:', newImage);
    
    // Force revalidation for production mode
    console.log('Starting cache revalidation process');
    
    // Revalidate cache
    revalidatePath('/images/product', 'layout');
    revalidatePath('/admin/products', 'layout');
    revalidatePath('/products', 'layout');
    revalidatePath('/', 'layout');
    
    // Specific product page revalidation
    revalidatePath(`/products/${productId}`, 'layout');
    revalidatePath(`/admin/products/${productId}`, 'layout');
    
    // Add tags for more targeted revalidation
    revalidateTag('product-images');
    revalidateTag(`product-${productId}`);
    
    console.log('Cache revalidation complete');
    
    // Return response with cache control headers
    console.log('Returning success response');
    return NextResponse.json({
      success: true,
      message: 'เพิ่มรูปภาพสินค้าเรียบร้อย',
      image: newImage
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
        console.log(`Deleted image file: ${imagePath}`);
      } else {
        console.warn(`Image file not found for deletion: ${imagePath}`);
      }
    } catch (fileError) {
      console.error('Error deleting image file:', fileError);
      // Continue even if file deletion fails
    }
    
    // Force revalidation for production mode
    console.log('Starting cache revalidation after image deletion');
    
    // Revalidate cache
    revalidatePath('/images/product', 'layout');
    revalidatePath('/admin/products', 'layout');
    revalidatePath('/products', 'layout');
    revalidatePath('/', 'layout');
    
    // Specific product page revalidation
    const productId = image.productId;
    if (productId) {
      revalidatePath(`/products/${productId}`, 'layout');
      revalidatePath(`/admin/products/${productId}`, 'layout');
      
      // Add tags for more targeted revalidation
      revalidateTag(`product-${productId}`);
    }
    
    revalidateTag('product-images');
    
    console.log('Cache revalidation complete');
    
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
