/* eslint-disable */ 
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://168.231.118.94:3001'],
  reactStrictMode: true,
  experimental: {},
  images: {
    //
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  output: 'standalone',
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // ป้องกันการแคชรูปภาพจาก public folder
  headers: async () => {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
