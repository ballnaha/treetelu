import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Helper function to convert BigInt values to strings in an object
 * This is needed because JSON.stringify cannot serialize BigInt values
 */
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntToString(obj[key]);
    }
    return result;
  }

  return obj;
}

/**
 * GET handler for fetching all products (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  console.log('Admin products API called');
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    
    console.log('Query params:', { page, limit, category, status, search });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where: any = {};
    
    if (category) {
      where.categoryId = parseInt(category);
    }
    
    if (status) {
      where.productStatus = status;
    }
    
    if (search) {
      where.OR = [
        { productName: { contains: search } },
        { sku: { contains: search } },
        { productDesc: { contains: search } }
      ];
    }
    
    // Count total products matching the filter
    const totalItems = await prisma.product.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    
    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedProducts = products.map(product => {
      // Create a new object with formatted dates
      const formattedProduct = {
        ...product,
        createdAt: product.createdAt ? product.createdAt.toISOString() : null,
        updatedAt: product.updatedAt ? product.updatedAt.toISOString() : null
      };
      return formattedProduct;
    });
    
    // Convert BigInt values to strings
    const safeProducts = convertBigIntToString(formattedProducts);
    
    return NextResponse.json({
      success: true,
      products: safeProducts,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in products API endpoint:', error);
    
    // Add more detailed error information
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
      console.error('Error details:', errorDetails, error.stack);
    } else {
      errorDetails = String(error);
      console.error('Unknown error type:', typeof error, error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

/**
 * POST handler for creating a new product (admin only)
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    console.log('Create product request:', body);
    
    // Validate required fields
    if (!body.productName) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อสินค้า' },
        { status: 400 }
      );
    }
    
    // Check if SKU already exists
    if (body.sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: body.sku }
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, message: 'รหัสสินค้า (SKU) นี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }
    
    // Create slug from product name if not provided
    if (!body.slug) {
      body.slug = body.productName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    }
    
    // Create the product
    const newProduct = await prisma.product.create({
      data: {
        productName: body.productName,
        sku: body.sku || null,
        productImg: body.productImg || null,
        slug: body.slug,
        productDesc: body.productDesc || null,
        salesPrice: body.salesPrice !== undefined ? parseFloat(body.salesPrice) : null,
        originalPrice: body.originalPrice !== undefined ? parseFloat(body.originalPrice) : null,
        discount: body.discount !== undefined ? parseInt(body.discount) : null,
        potSize: body.potSize || null,
        plantHeight: body.plantHeight || null,
        preparationTime: body.preparationTime || null,
        stock: body.stock !== undefined ? parseInt(body.stock) : null,
        stockStatus: body.stockStatus || 'in_stock',
        category: body.category || null,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        productStatus: body.productStatus || 'on',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedProduct = {
      ...newProduct,
      createdAt: newProduct.createdAt ? newProduct.createdAt.toISOString() : null,
      updatedAt: newProduct.updatedAt ? newProduct.updatedAt.toISOString() : null
    };
    
    // Convert BigInt values to strings
    const safeProduct = convertBigIntToString(formattedProduct);
    
    return NextResponse.json({
      success: true,
      message: 'เพิ่มสินค้าใหม่เรียบร้อย',
      product: safeProduct
    });
  } catch (error) {
    console.error('Error in create product endpoint:', error);
    
    let errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า',
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for updating a product (admin only)
 */
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    console.log('Update product request:', body);
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสสินค้า' },
        { status: 400 }
      );
    }
    
    // Check if SKU already exists (but not for this product)
    if (body.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: { 
          sku: body.sku,
          NOT: { id: parseInt(body.id) }
        }
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, message: 'รหัสสินค้า (SKU) นี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }
    
    // Update slug if product name changed and slug not provided
    if (body.productName && !body.slug) {
      body.slug = body.productName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    }
    
    // Prepare update data
    const updateData: any = {
      ...body,
      id: undefined, // Remove id from update data
      updatedAt: new Date()
    };
    
    // Convert numeric strings to numbers
    if (updateData.salesPrice !== undefined) updateData.salesPrice = parseFloat(updateData.salesPrice);
    if (updateData.originalPrice !== undefined) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.discount !== undefined) updateData.discount = parseInt(updateData.discount);
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);
    if (updateData.categoryId !== undefined && updateData.categoryId !== null) {
      updateData.categoryId = parseInt(updateData.categoryId);
    }
    
    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(body.id) },
      data: updateData
    });
    
    // Format dates and convert BigInt values to strings before sending to client
    const formattedProduct = {
      ...updatedProduct,
      createdAt: updatedProduct.createdAt ? updatedProduct.createdAt.toISOString() : null,
      updatedAt: updatedProduct.updatedAt ? updatedProduct.updatedAt.toISOString() : null
    };
    
    // Convert BigInt values to strings
    const safeProduct = convertBigIntToString(formattedProduct);
    
    return NextResponse.json({
      success: true,
      message: 'อัปเดตสินค้าเรียบร้อย',
      product: safeProduct
    });
  } catch (error) {
    console.error('Error in update product endpoint:', error);
    
    let errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า',
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for deleting a product (admin only)
 */
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    
    console.log('Delete product request:', { productId });
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสสินค้า' },
        { status: 400 }
      );
    }
    
    // Check if product is used in any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: parseInt(productId) }
    });
    
    if (orderItems) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถลบสินค้านี้ได้เนื่องจากมีการใช้งานในคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // First, get the product details to know which images to delete
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });
    
    // Get associated product images
    const productImages = await prisma.productimage.findMany({
      where: { productId: parseInt(productId) }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลสินค้า' },
        { status: 404 }
      );
    }
    
    // Delete main product image if it exists
    if (product.productImg) {
      try {
        const mainImagePath = path.join(process.cwd(), 'public', 'images', 'product', product.productImg);
        if (fs.existsSync(mainImagePath)) {
          fs.unlinkSync(mainImagePath);
          console.log(`Deleted main product image: ${mainImagePath}`);
        }
      } catch (err) {
        console.error(`Error deleting main product image: ${err}`);
        // Continue with deletion even if image deletion fails
      }
    }
    
    // Delete additional product images if they exist
    if (productImages && productImages.length > 0) {
      for (const image of productImages) {
        if (image.imageName) {
          try {
            const imagePath = path.join(process.cwd(), 'public', 'images', 'product', image.imageName);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log(`Deleted additional product image: ${imagePath}`);
            }
          } catch (err) {
            console.error(`Error deleting additional product image: ${err}`);
            // Continue with deletion even if image deletion fails
          }
        }
      }
      
      // Delete the product image records from the database
      await prisma.productimage.deleteMany({
        where: { productId: parseInt(productId) }
      });
    }
    
    // Delete the product
    const deletedProduct = await prisma.product.delete({
      where: { id: parseInt(productId) }
    });
    
    return NextResponse.json({
      success: true,
      message: 'ลบสินค้าเรียบร้อยแล้ว',
      product: convertBigIntToString(deletedProduct)
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบสินค้า' },
      { status: 500 }
    );
  }
});
