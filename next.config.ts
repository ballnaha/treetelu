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
    //
    domains: ['localhost', '168.231.118.94'],
    unoptimized: true, // ไม่ทำการ optimize รูปภาพเพื่อป้องกันปัญหา cache
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
  // เพื่อป้องกันการ cache static files นานเกินไป
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
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          }
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
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
