import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const uploadsPath = path.join(process.cwd(), 'uploads', 'images', 'product');
    const publicPath = path.join(process.cwd(), 'public', 'images', 'product');
    
    // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่
    const uploadsExists = fs.existsSync(uploadsPath);
    const publicExists = fs.existsSync(publicPath);
    
    // รายการไฟล์ในโฟลเดอร์ uploads
    let uploadFiles = [];
    if (uploadsExists) {
      uploadFiles = fs.readdirSync(uploadsPath).map(file => {
        const filePath = path.join(uploadsPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          path: `/uploads/images/product/${file}`
        };
      });
    }
    
    // รายการไฟล์ในโฟลเดอร์ public
    let publicFiles = [];
    if (publicExists) {
      publicFiles = fs.readdirSync(publicPath).map(file => {
        const filePath = path.join(publicPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          path: `/images/product/${file}`
        };
      });
    }
    
    return NextResponse.json({
      uploadsExists,
      publicExists,
      uploadsPath,
      publicPath,
      uploadFiles,
      publicFiles
    });
  } catch (error) {
    console.error('Error checking uploads:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
} 