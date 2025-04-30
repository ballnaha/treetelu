const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;

// กำหนดพาธของไฟล์ JSON
const dataFilePath = path.join(process.cwd(), 'src/data/blogs.json');

// สร้าง Prisma Client
const prisma = new PrismaClient();

async function migrateBlogData() {
  try {
    // อ่านข้อมูลจากไฟล์ JSON
    const jsonData = await fs.readFile(dataFilePath, 'utf8');
    const blogs = JSON.parse(jsonData);
    
    console.log(`พบบทความจำนวน ${blogs.length} บทความในไฟล์ JSON`);
    
    // ตรวจสอบจำนวนบทความในฐานข้อมูล
    const dbCount = await prisma.blog.count();
    console.log(`มีบทความจำนวน ${dbCount} บทความในฐานข้อมูล`);
    
    // ถ้ามีข้อมูลในฐานข้อมูลแล้ว ให้ถามผู้ใช้ว่าต้องการแทนที่หรือไม่
    if (dbCount > 0) {
      console.log('คำเตือน: มีข้อมูลในฐานข้อมูลแล้ว');
      console.log('หากต้องการลบข้อมูลเดิมและเพิ่มข้อมูลใหม่ ให้รันคำสั่ง: node src/scripts/migrate-blog-data.js --force');
      
      // ตรวจสอบว่ามีการใช้ flag --force หรือไม่
      if (!process.argv.includes('--force')) {
        console.log('ยกเลิกการนำเข้าข้อมูล');
        return;
      }
      
      console.log('กำลังลบข้อมูลเดิมทั้งหมด...');
      await prisma.blog.deleteMany({});
    }
    
    // นำเข้าข้อมูลทีละรายการ
    console.log('กำลังนำเข้าข้อมูล...');
    for (const blog of blogs) {
      // ตรวจสอบว่ามีข้อมูลนี้ในฐานข้อมูลแล้วหรือไม่
      const existingBlog = await prisma.blog.findUnique({
        where: { slug: blog.slug }
      });
      
      if (existingBlog) {
        console.log(`ข้ามบทความ "${blog.title}" เนื่องจากมี slug ซ้ำ`);
        continue;
      }
      
      // เพิ่มข้อมูลใหม่
      await prisma.blog.create({
        data: {
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          image: blog.image,
          slug: blog.slug,
          date: blog.date,
          category: blog.category,
          published: true
        }
      });
      
      console.log(`นำเข้าบทความ "${blog.title}" เรียบร้อยแล้ว`);
    }
    
    console.log('นำเข้าข้อมูลเรียบร้อยแล้ว');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// รันฟังก์ชันหลัก
migrateBlogData(); 