/* eslint-disable */ 
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'http://168.231.118.94:3001',
    'http://168.231.118.94',
    'https://168.231.118.94:3001',
    'https://168.231.118.94'
  ],
  reactStrictMode: true,
  distDir: '.next', // ระบุโฟลเดอร์สำหรับ build output
  experimental: {
    // Server Actions ได้ถูกเปิดใช้งานเป็นค่าเริ่มต้นใน Next.js เวอร์ชัน 14 ขึ้นไป
    // ไม่จำเป็นต้องระบุ serverActions: true อีกต่อไป
  },
  // ย้ายจาก experimental.serverComponentsExternalPackages ไปเป็น serverExternalPackages ตามคำแนะนำ
  serverExternalPackages: ['fs', 'path'],
  images: {
    domains: ['localhost', '168.231.118.94'],
    unoptimized: false, // เปิดใช้งานการ optimize รูปภาพของ Next.js เพื่อให้รูปภาพโหลดเร็วขึ้น
    formats: ['image/webp'], // แปลงรูปภาพเป็น WebP เพื่อให้ขนาดไฟล์เล็กลง
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // ขนาดของอุปกรณ์ที่จะใช้ในการสร้างรูปภาพ
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // ขนาดของรูปภาพที่จะถูกสร้าง
    minimumCacheTTL: 3600, // ตั้งค่า cache รูปภาพขั้นต่ำเป็น 1 ชั่วโมง
  },
  // เพิ่ม config สำหรับ static files
  staticPageGenerationTimeout: 1000,
  onDemandEntries: {
    // ลดเวลาในการเก็บ cache
    maxInactiveAge: 5 * 1000, // 5 วินาที (ค่าเริ่มต้นคือ 25 วินาที)
    pagesBufferLength: 1, // จำนวนหน้าที่เก็บใน cache (ค่าเริ่มต้นคือ 5)
  },
  // ป้องกัน webpack จากการ cache ไฟล์
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // ปิดการ cache ในโหมด production
    if (!dev) {
      config.cache = false;
    }
    
    // อนุญาตให้ใช้ fs module ใน middleware
    if (isServer) {
      config.externals.push('fs');
    }
    
    return config;
  },
  // เพิ่ม rewrites สำหรับ production mode
  async rewrites() {
    return {
      beforeFiles: [
        // เฉพาะในโหมด production, ให้ redirect การเข้าถึงไฟล์รูปภาพไปที่ API route
        {
          source: '/images/product/:path*',
          destination: '/api/image/images/product/:path*',
          has: [
            {
              type: 'header',
              key: 'x-middleware-rewrite',
              value: '(?!.*)',
              value_missing: true
            }
          ]
        },
        // เพิ่ม route สำหรับรูปภาพบทความ
        {
          source: '/images/blog/:path*',
          destination: '/api/image/images/blog/:path*',
          has: [
            {
              type: 'header',
              key: 'x-middleware-rewrite',
              value: '(?!.*)',
              value_missing: true
            }
          ]
        },
        {
          source: '/uploads/payment-slips/:path*',
          destination: '/api/image/uploads/payment-slips/:path*',
          has: [
            {
              type: 'header',
              key: 'x-middleware-rewrite',
              value: '(?!.*)',
              value_missing: true
            }
          ]
        }
      ]
    }
  },
  // แก้ไขการตั้งค่า headers เพื่อให้สามารถ cache รูปภาพได้
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          }
        ],
      },
      {
        // เปิดใช้งาน cache สำหรับรูปภาพใน /images/ 
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          }
        ],
      },
      {
        // เปิดใช้งาน cache สำหรับรูปภาพใน /uploads/
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          }
        ],
      }
    ]
  },
};

module.exports = nextConfig;
