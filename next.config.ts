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
  output: 'standalone', // ช่วยให้การเข้าถึงไฟล์สถิติใน production mode ดีขึ้น
  distDir: '.next', // ระบุโฟลเดอร์สำหรับ build output
  experimental: {
    // เปิดใช้งานการทำงานแบบ serverActions เพื่อใช้ revalidatePath และ revalidateTag
    serverActions: true,
    serverExternalPackages: [],
  },
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
    return config;
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
