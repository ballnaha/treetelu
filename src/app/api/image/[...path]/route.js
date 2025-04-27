import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request, context) {
  console.log('==== API Route: /api/image/[...path] ====');
  console.log('Request URL:', request.url);
  
  try {
    // รอให้ params ถูก resolve ก่อนใช้งาน
    const params = await context.params;
    console.log('Params:', params);
    
    // รวม path segments เข้าด้วยกัน
    const filePath = params.path.join('/');
    console.log('File path:', filePath);
    
    // กำหนดเส้นทางของไฟล์
    const uploadsFilePath = path.join(process.cwd(), 'uploads', filePath);
    const publicFilePath = path.join(process.cwd(), 'public', filePath);
    
    console.log('Looking for files at:');
    console.log('- Uploads path:', uploadsFilePath);
    console.log('- Public path:', publicFilePath);
    
    let finalPath = '';
    
    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (fs.existsSync(uploadsFilePath)) {
      console.log('File found in uploads folder');
      finalPath = uploadsFilePath;
    } else if (fs.existsSync(publicFilePath)) {
      console.log('File found in public folder');
      finalPath = publicFilePath;
    } else {
      console.log('File not found in any location');
      return new NextResponse('File not found', { status: 404 });
    }
    
    // อ่านไฟล์
    const fileBuffer = fs.readFileSync(finalPath);
    console.log('File loaded successfully, size:', fileBuffer.length, 'bytes');
    
    // กำหนด content type
    let contentType = 'application/octet-stream';
    
    if (finalPath.endsWith('.jpg') || finalPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (finalPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (finalPath.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (finalPath.endsWith('.webp')) {
      contentType = 'image/webp';
    }
    
    console.log('Sending response with Content-Type:', contentType);
    
    // ส่งไฟล์กลับ
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image: ' + error.message, { status: 500 });
  }
} 