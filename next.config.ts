/* eslint-disable */ 
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    //
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
