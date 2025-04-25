/* eslint-disable */ 
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://168.231.118.94:3001'],
  reactStrictMode: true,
  experimental: {},
  images: {
    //
    domains: ['localhost'],
    unoptimized: true, // ไม่ optimize รูปภาพเพื่อให้แสดงได้ทันที
  },
  output: 'standalone',
  assetPrefix: undefined, // ใช้ค่า default ทั้งใน development และ production
  // ป้องกันการแคชรูปภาพจาก public folder
  headers: async () => {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          }
        ],
      },
    ];
  },
  // กำหนดค่า publicRuntimeConfig ที่สามารถเข้าถึงได้ทั้งใน client และ server
  publicRuntimeConfig: {
    staticFolder: '/images',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // ตรวจสอบว่าไฟล์ในโฟลเดอร์ public มีการเปลี่ยนแปลงหรือไม่
  // เพื่อให้ Next.js รีโหลดไฟล์ใหม่
  onDemandEntries: {
    // ลดเวลาที่ไฟล์จะถูกแคชในหน่วยความจำ (ms)
    maxInactiveAge: 10 * 1000, // 10 วินาที
    // จำนวนหน้าที่จะถูกแคช
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
