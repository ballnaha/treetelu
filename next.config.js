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
};

module.exports = nextConfig; 