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
};

module.exports = nextConfig;
