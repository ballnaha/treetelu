/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ปิดการตรวจสอบ ESLint ระหว่าง build process
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ปิดการตรวจสอบ TypeScript ระหว่าง build process (ระวัง: อาจทำให้พลาด type errors)
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'treetelu.com', 
      'cdn.treetelu.com',
      'res.cloudinary.com',
      'app1.treetelu.com',
      'app.treetelu.com',
      'files.stripe.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.stripe.com',
      },
      {
        protocol: 'https',
        hostname: 'treetelu.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    dangerouslyAllowSVG: true,
    formats: ['image/webp'],
  },
  // webpack config แบบเรียบง่าย
  webpack: (config, { isServer }) => {
    // อนุญาตให้ใช้ fs module ใน middleware
    if (isServer) {
      config.externals.push('fs');
    }
    
    return config;
  },
  // ปรับเพิ่มขนาดไฟล์สูงสุดที่อนุญาต
  experimental: {
    largePageDataBytes: 512 * 1000, // 512KB (default is 128KB)
  },
  // เพิ่ม headers สำหรับ cache control
  async headers() {
    return [
      // บังคับให้มีการ revalidate เสมอสำหรับหน้า HTML ทั้งหมด
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Cache control สำหรับไฟล์ static ที่มีการ hash (จาก Next.js build)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Login page ไม่มีการ cache เลย
      {
        source: '/login',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
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
            key: 'X-Accel-Expires',
            value: '0',
          },
        ],
      },
      // API Authentication ไม่มีการ cache เลย
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 