import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// สร้าง cache สำหรับเก็บข้อมูลรูปภาพ
const imageCache = new Map();
// ตั้งค่าเวลาหมดอายุของ cache (เพิ่มเป็น 1 วัน)
const CACHE_TTL = 24 * 60 * 60 * 1000;
// กำหนดขนาด cache สูงสุด (200 MB)
const MAX_CACHE_SIZE = 200 * 1024 * 1024;
// ขนาด cache ปัจจุบัน
let currentCacheSize = 0;

// คำนวณ ETag จากข้อมูลไฟล์
function generateETag(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// ฟังก์ชันตรวจสอบขนาด cache และลบรายการเก่าออกถ้าเกินขนาด
function manageCacheSize(newItemSize) {
  if (currentCacheSize + newItemSize > MAX_CACHE_SIZE) {
    console.log(`Cache size exceeded: ${currentCacheSize + newItemSize} bytes. Cleaning up...`);
    
    // เรียงลำดับรายการตามเวลาที่เข้ามาในแคช (เก่าสุดอยู่หน้าสุด)
    const sortedEntries = [...imageCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // ลบรายการเก่าๆ ออกจนกว่าจะมีพื้นที่พอ
    for (const [key, item] of sortedEntries) {
      if (currentCacheSize + newItemSize <= MAX_CACHE_SIZE) break;
      
      imageCache.delete(key);
      currentCacheSize -= item.data.length;
      console.log(`Removed item from cache: ${key}, freed ${item.data.length} bytes`);
    }
  }
}

export async function GET(request, context) {
  console.log('==== API Route: /api/image/[...path] ====');
  
  try {
    // รอให้ params ถูก resolve ก่อนใช้งาน
    const params = await context.params;
    
    // รวม path segments เข้าด้วยกัน
    const filePath = params.path.join('/');
    
    // ตรวจสอบ URL ว่ามีการระบุให้ skip cache หรือไม่
    const url = new URL(request.url);
    const noCache = url.searchParams.get('no-cache') === 'true';
    
    // ดึง ETag จาก request header
    const ifNoneMatch = request.headers.get('if-none-match');
    
    // สร้าง cache key จาก path
    const cacheKey = filePath;
    
    // ถ้าไม่ได้ระบุให้ skip cache และมีข้อมูลใน cache
    if (!noCache && imageCache.has(cacheKey)) {
      const cachedData = imageCache.get(cacheKey);
      // ตรวจสอบว่า cache ยังไม่หมดอายุ
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        // ตรวจสอบ ETag
        if (ifNoneMatch && ifNoneMatch === cachedData.etag) {
          // ส่ง 304 Not Modified ถ้า ETag ตรงกัน
          return new NextResponse(null, {
            status: 304,
            headers: {
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800, immutable',
              'ETag': cachedData.etag,
              'X-Cache': 'HIT'
            }
          });
        }
        
        // ส่งข้อมูลจาก cache กลับไป
        return new NextResponse(cachedData.data, {
          headers: {
            'Content-Type': cachedData.contentType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800, immutable',
            'ETag': cachedData.etag,
            'X-Cache': 'HIT'
          }
        });
      } else {
        // ลบ cache ที่หมดอายุ
        imageCache.delete(cacheKey);
        currentCacheSize -= cachedData.data.length;
      }
    }
    
    // กำหนดเส้นทางของไฟล์
    const uploadsFilePath = path.join(process.cwd(), 'uploads', filePath);
    const publicFilePath = path.join(process.cwd(), 'public', filePath);
    
    let finalPath = '';
    
    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (fs.existsSync(uploadsFilePath)) {
      finalPath = uploadsFilePath;
    } else if (fs.existsSync(publicFilePath)) {
      finalPath = publicFilePath;
    } else {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // ตรวจสอบว่าไฟล์มีการเปลี่ยนแปลงหรือไม่
    const stats = fs.statSync(finalPath);
    const lastModified = stats.mtime.toUTCString();
    
    // อ่านไฟล์
    const fileBuffer = fs.readFileSync(finalPath);
    
    // คำนวณ ETag จากเนื้อหาไฟล์
    const etag = generateETag(fileBuffer);
    
    // ตรวจสอบว่า ETag ตรงกับที่ browser ส่งมาหรือไม่
    if (ifNoneMatch && ifNoneMatch === etag) {
      // ส่ง 304 Not Modified ถ้า ETag ตรงกัน
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800, immutable',
          'ETag': etag,
          'Last-Modified': lastModified,
          'X-Cache': 'VALIDATED'
        }
      });
    }
    
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
    
    // เก็บข้อมูลลงใน cache
    if (!noCache) {
      // ตรวจสอบและจัดการขนาด cache
      manageCacheSize(fileBuffer.length);
      
      // เพิ่มข้อมูลลงใน cache
      imageCache.set(cacheKey, {
        data: fileBuffer,
        contentType,
        etag,
        timestamp: Date.now()
      });
      
      // ปรับปรุงขนาด cache ปัจจุบัน
      currentCacheSize += fileBuffer.length;
    }
    
    // ส่งไฟล์กลับ
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800, immutable',
        'ETag': etag,
        'Last-Modified': lastModified,
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image: ' + error.message, { status: 500 });
  }
} 