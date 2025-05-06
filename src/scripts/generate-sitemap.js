// สคริปต์สำหรับสร้าง sitemap แบบไดนามิก
// สร้างไฟล์ sitemap.xml ในโฟลเดอร์ public

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// สร้าง instance ของ PrismaClient โดยตรงในไฟล์นี้
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// ตั้งค่าค่าคงที่
const WEBSITE_URL = 'https://treetelu.com';
const currentDate = new Date().toISOString().split('T')[0];

// รายการหน้าสถิตของเว็บไซต์
const staticPages = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    url: '/products',
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    url: '/blog',
    changefreq: 'weekly',
    priority: 0.8
  },
  {
    url: '/contact',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    url: '/login',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    url: '/register',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    url: '/checkout',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: '/payment-confirmation',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: '/order-history',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: '/profile',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: '/forgot-password',
    changefreq: 'yearly',
    priority: 0.4
  },
  {
    url: '/reset-password',
    changefreq: 'yearly',
    priority: 0.4
  },
  {
    url: '/terms-of-service',
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    url: '/privacy-policy',
    changefreq: 'yearly',
    priority: 0.3
  }
];

// สร้าง XML entry สำหรับหน้าเว็บแต่ละหน้า
function generateUrlEntry(pageUrl, lastmod, changefreq, priority) {
  return `
  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// สร้าง sitemap.xml
async function generateSitemap() {
  try {
    console.log('เริ่มสร้าง sitemap.xml...');
    console.log('กำลังเชื่อมต่อกับฐานข้อมูล...');
    
    let products = [];
    try {
      // ดึงข้อมูลสินค้าทั้งหมดที่เผยแพร่
      console.log('กำลังดึงข้อมูลสินค้า...');
      products = await prisma.product.findMany({
        where: {
          productStatus: 'on'
        },
        select: {
          id: true,
          slug: true,
          updatedAt: true
        }
      });
      console.log(`พบสินค้าที่เผยแพร่จำนวน ${products.length} รายการ`);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:', error);
      products = [];
    }
    
    let blogPosts = [];
    try {
      // ดึงข้อมูลบล็อกทั้งหมดที่เผยแพร่
      console.log('กำลังดึงข้อมูลบล็อก...');
      blogPosts = await prisma.blog.findMany({
        select: {
          id: true,
          slug: true,
          updatedAt: true
        }
      });
      console.log(`พบบล็อกที่เผยแพร่จำนวน ${blogPosts.length} รายการ`);
    } catch (error) {
      console.log('ไม่พบตาราง blog หรือเกิดข้อผิดพลาดในการดึงข้อมูลบล็อก:', error.message);
      blogPosts = [];
    }
    
    // เริ่มสร้าง XML
    console.log('กำลังสร้างไฟล์ XML...');
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // เพิ่มหน้าสถิต
    for (const page of staticPages) {
      sitemap += generateUrlEntry(
        `${WEBSITE_URL}${page.url}`, 
        currentDate, 
        page.changefreq, 
        page.priority
      );
    }
    
    // เพิ่มหน้าสินค้า
    for (const product of products) {
      const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += generateUrlEntry(
        `${WEBSITE_URL}/products/${product.slug || product.id}`,
        lastmod,
        'weekly',
        0.8
      );
    }
    
    // เพิ่มหน้าบล็อก (ถ้ามี)
    for (const post of blogPosts) {
      const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += generateUrlEntry(
        `${WEBSITE_URL}/blog/${post.slug || post.id}`,
        lastmod,
        'monthly',
        0.7
      );
    }
    
    // ปิด XML
    sitemap += '\n</urlset>';
    
    // เขียนไฟล์ sitemap.xml
    const sitemapPath = path.resolve(__dirname, '../../public/sitemap.xml');
    console.log(`กำลังเขียนไฟล์ไปยัง ${sitemapPath}...`);
    fs.writeFileSync(sitemapPath, sitemap);
    
    console.log(`สร้าง sitemap.xml เสร็จสมบูรณ์ ที่ ${sitemapPath}`);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้าง sitemap:', error);
  } finally {
    await prisma.$disconnect();
    console.log('ปิดการเชื่อมต่อกับฐานข้อมูล');
  }
}

// รันฟังก์ชันสร้าง sitemap
generateSitemap()
  .then(() => {
    console.log('ทำงานเสร็จสมบูรณ์');
    process.exit(0);
  })
  .catch((error) => {
    console.error('เกิดข้อผิดพลาดในการรันสคริปต์:', error);
    process.exit(1);
  }); 