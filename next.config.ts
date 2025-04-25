/* eslint-disable */ 
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://168.231.118.94:3001'],
  experimental: {},
  images: {
    //
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
