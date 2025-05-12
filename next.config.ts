/* eslint-disable */ 
import type { NextConfig } from 'next';

/**
 * การตั้งค่า Next.js แบบ TypeScript
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'treetelu.com', 
      'cdn.treetelu.com',
      'res.cloudinary.com',
      'app1.treetelu.com',
      'app.treetelu.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    formats: ['image/webp'],
  },
  // webpack config แบบเรียบง่าย
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // อนุญาตให้ใช้ fs module ใน middleware
    if (isServer) {
      config.externals.push('fs');
    }
    
    return config;
  },
};

export default nextConfig;
