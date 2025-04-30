/** @type {import('next').NextConfig} */
const nextConfig = {
  // ตั้งค่า output เป็น 'export' สำหรับการ build เป็น static HTML
  // กรณีต้องการ deploy บน static hosting
  // output: 'export',
  
  // ตั้งค่าสำหรับการแสดงรูปภาพ
  images: {
    // รองรับการแสดงรูปภาพจากแหล่งภายนอก
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // รองรับการแสดงรูปภาพจาก URL ที่ไม่รู้จัก (ไม่แนะนำในโหมด production เนื่องจากเปิดรองรับทุก URL)
    unoptimized: true,
  },
};

module.exports = nextConfig; 