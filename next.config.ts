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
  experimental: {},
  images: {
    //
    domains: ['localhost', '168.231.118.94'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // เพิ่ม config สำหรับ static files
  staticPageGenerationTimeout: 1000,
  onDemandEntries: {
    // ลดเวลาในการเก็บ cache
    maxInactiveAge: 15 * 1000, // 15 วินาที (ค่าเริ่มต้นคือ 25 วินาที)
    pagesBufferLength: 2, // จำนวนหน้าที่เก็บใน cache (ค่าเริ่มต้นคือ 5)
  },
  // ป้องกันการ cache static files นานเกินไป
  headers: async () => {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          }
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          }
        ],
      }
    ]
  },
};

module.exports = nextConfig;
