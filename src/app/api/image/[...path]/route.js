import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// สร้าง cache สำหรับเก็บข้อมูลรูปภาพ
const imageCache = new Map();
// ตั้งค่าเวลาหมดอายุของ cache (1 ชั่วโมง)
const CACHE_TTL = 60 * 60 * 1000;

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
    
    // ตรวจสอบ URL ว่ามีการระบุให้ skip cache หรือไม่
    const url = new URL(request.url);
    const noCache = url.searchParams.get('no-cache') === 'true';
    
    // สร้าง cache key จาก path
    const cacheKey = filePath;
    
    // ถ้าไม่ได้ระบุให้ skip cache และมีข้อมูลใน cache
    if (!noCache && imageCache.has(cacheKey)) {
      const cachedData = imageCache.get(cacheKey);
      // ตรวจสอบว่า cache ยังไม่หมดอายุ
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        // ส่งข้อมูลจาก cache กลับไป
        return new NextResponse(cachedData.data, {
          headers: {
            'Content-Type': cachedData.contentType,
            'Cache-Control': 'public, max-age=3600',
            'X-Cache': 'HIT'
          }
        });
      } else {
        // ลบ cache ที่หมดอายุ
        imageCache.delete(cacheKey);
      }
    }
    
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
    
    // เก็บข้อมูลลงใน cache
    if (!noCache) {
      imageCache.set(cacheKey, {
        data: fileBuffer,
        contentType,
        timestamp: Date.now()
      });
    }
    
    // ส่งไฟล์กลับ
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image: ' + error.message, { status: 500 });
  }
} 