import { NextRequest, NextResponse } from 'next/server';
import { BlogPost } from '@/types/blog';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// GET - ดึงข้อมูลบทความทั้งหมด
export async function GET(req: NextRequest) {
  try {
    // ดึงพารามิเตอร์จาก URL (ถ้ามี)
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    
    // ถ้ามีการระบุ id ให้ค้นหาบทความตาม id
    if (id) {
      try {
        const blog = await prisma.blog.findUnique({
          where: { id: Number(id) }
        });
        
        if (!blog) {
          return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
        }
        
        return NextResponse.json(blog);
      } catch (error) {
        console.error('Error finding blog by id with Prisma:', error);
        // ใช้ direct SQL query แทน
        const blogs = await prisma.$queryRaw(
          Prisma.sql`SELECT * FROM blogs WHERE id = ${Number(id)}`
        ) as any[];
        
        if (!blogs || blogs.length === 0) {
          return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
        }
        
        return NextResponse.json(blogs[0]);
      }
    }
    
    // ถ้ามีการระบุ slug ให้ค้นหาบทความตาม slug
    if (slug) {
      try {
        const blog = await prisma.blog.findUnique({
          where: { slug }
        });
        
        if (!blog) {
          return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
        }
        
        return NextResponse.json(blog);
      } catch (error) {
        console.error('Error finding blog by slug with Prisma:', error);
        // ใช้ direct SQL query แทน
        const blogs = await prisma.$queryRaw(
          Prisma.sql`SELECT * FROM blogs WHERE slug = ${slug}`
        ) as any[];
        
        if (!blogs || blogs.length === 0) {
          return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
        }
        
        return NextResponse.json(blogs[0]);
      }
    }
    
    // ดึงข้อมูลทั้งหมด
    try {
      const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      // ส่งข้อมูลทั้งหมดกลับไป
      return NextResponse.json(blogs);
    } catch (error) {
      console.error('Error finding all blogs with Prisma:', error);
      // ใช้ direct SQL query แทน
      const blogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs ORDER BY createdAt DESC`
      ) as any[];
      
      return NextResponse.json(blogs);
    }
  } catch (error) {
    console.error('Error getting blogs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - เพิ่มบทความใหม่
export async function POST(req: NextRequest) {
  try {
    // รับข้อมูลจาก request body
    const blogData = await req.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!blogData.title || !blogData.content || !blogData.slug) {
      return NextResponse.json({ error: 'Title, content, and slug are required' }, { status: 400 });
    }
    
    // ตรวจสอบว่า slug ซ้ำหรือไม่
    try {
      const existingBlog = await prisma.blog.findUnique({
        where: { slug: blogData.slug }
      });
      
      if (existingBlog) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    } catch (error) {
      // ถ้าเกิด error ลองใช้ Raw SQL แทน
      const existingBlogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs WHERE slug = ${blogData.slug}`
      ) as unknown[];
      
      const existingBlogsArray = existingBlogs as any[];
      if (existingBlogsArray.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }
    
    // เพิ่มบทความใหม่
    try {
      const newBlog = await prisma.blog.create({
        data: {
          title: blogData.title,
          excerpt: blogData.excerpt || '',
          content: blogData.content,
          image: blogData.image || '/images/blog/placeholder.jpg',
          slug: blogData.slug,
          date: blogData.date || new Date().toLocaleDateString('th-TH'),
          category: blogData.category || 'อื่นๆ',
          published: true
        }
      });
      
      return NextResponse.json(newBlog, { status: 201 });
    } catch (error) {
      // ถ้าเกิด error ลองใช้ Raw SQL แทน
      const result = await prisma.$executeRaw`
        INSERT INTO blogs (title, excerpt, content, image, slug, date, category, published, createdAt, updatedAt) 
        VALUES (
          ${blogData.title}, 
          ${blogData.excerpt || ''}, 
          ${blogData.content}, 
          ${blogData.image || '/images/blog/placeholder.jpg'}, 
          ${blogData.slug}, 
          ${blogData.date || new Date().toLocaleDateString('th-TH')}, 
          ${blogData.category || 'อื่นๆ'}, 
          ${true},
          ${new Date()},
          ${new Date()}
        )
      `;
      
      const newBlogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs WHERE slug = ${blogData.slug}`
      ) as unknown[];
      
      const newBlogsArray = newBlogs as any[];
      if (newBlogsArray.length > 0) {
        return NextResponse.json(newBlogsArray[0], { status: 201 });
      } else {
        return NextResponse.json({ error: 'Failed to retrieve new blog' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - อัปเดตบทความ
export async function PUT(req: NextRequest) {
  try {
    // รับข้อมูลจาก request body
    const blogData = await req.json();
    
    // ตรวจสอบว่ามี id หรือไม่
    if (!blogData.id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }
    
    try {
      // ตรวจสอบว่าบทความมีอยู่หรือไม่
      const existingBlog = await prisma.blog.findUnique({
        where: { id: blogData.id }
      });
      
      if (!existingBlog) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
      }
      
      // ถ้ามีการเปลี่ยน slug ให้ตรวจสอบว่าซ้ำหรือไม่
      if (blogData.slug !== existingBlog.slug) {
        const slugExists = await prisma.blog.findUnique({
          where: { slug: blogData.slug }
        });
        
        if (slugExists) {
          return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }
      }
      
      // อัปเดตบทความ
      const updatedBlog = await prisma.blog.update({
        where: { id: blogData.id },
        data: {
          title: blogData.title,
          excerpt: blogData.excerpt,
          content: blogData.content,
          image: blogData.image,
          slug: blogData.slug,
          date: blogData.date,
          category: blogData.category,
          published: blogData.published !== undefined ? blogData.published : existingBlog.published
        }
      });
      
      return NextResponse.json(updatedBlog);
    } catch (error) {
      // ถ้าเกิด error ลองแก้ไขด้วย Raw SQL
      const existingBlogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs WHERE id = ${blogData.id}`
      ) as unknown[];
      
      const existingBlogsArray = existingBlogs as any[];
      if (!existingBlogsArray.length) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
      }
      
      const existingBlog = existingBlogsArray[0];
      
      if (blogData.slug !== existingBlog.slug) {
        const slugExistsArr = await prisma.$queryRaw(
          Prisma.sql`SELECT * FROM blogs WHERE slug = ${blogData.slug}`
        ) as unknown[];
        
        const slugExistsArray = slugExistsArr as any[];
        if (slugExistsArray.length > 0) {
          return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }
      }
      
      await prisma.$executeRaw`
        UPDATE blogs 
        SET 
          title = ${blogData.title},
          excerpt = ${blogData.excerpt},
          content = ${blogData.content},
          image = ${blogData.image},
          slug = ${blogData.slug},
          date = ${blogData.date},
          category = ${blogData.category},
          published = ${blogData.published !== undefined ? blogData.published : existingBlog.published},
          updatedAt = ${new Date()}
        WHERE id = ${blogData.id}
      `;
      
      const updatedBlogs = await prisma.$queryRaw(
        Prisma.sql`SELECT * FROM blogs WHERE id = ${blogData.id}`
      ) as unknown[];
      
      const updatedBlogsArray = updatedBlogs as any[];
      if (updatedBlogsArray.length > 0) {
        return NextResponse.json(updatedBlogsArray[0]);
      } else {
        return NextResponse.json({ error: 'Failed to retrieve updated blog' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - ลบบทความ
export async function DELETE(req: NextRequest) {
  try {
    // ดึงพารามิเตอร์จาก URL
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }
    
    const blogId = Number(id);
    
    // ค้นหาบทความก่อนลบเพื่อเก็บข้อมูลรูปภาพ
    let blog;
    try {
      blog = await prisma.blog.findUnique({
        where: { id: blogId }
      });
      
      console.log('ข้อมูลบทความก่อนลบ:', blog);
    } catch (dbError) {
      console.error('Error finding blog:', dbError);
      return NextResponse.json({ error: 'ไม่สามารถค้นหาบทความได้' }, { status: 500 });
    }
    
    if (!blog) {
      return NextResponse.json({ error: 'ไม่พบบทความที่ต้องการลบ' }, { status: 404 });
    }
    
    // ถ้ามีรูปภาพ ให้ลบไฟล์
    if (blog.image && typeof blog.image === 'string' && blog.image.startsWith('/images/blog/')) {
      try {
        // รับชื่อไฟล์จาก path
        const imageName = blog.image.split('/').pop();
        console.log('ชื่อไฟล์รูปภาพที่จะลบ:', imageName);
        
        if (imageName) {
          // สร้าง path สำหรับไฟล์รูปภาพ
          // แก้ไขพาธให้ถูกต้องตามระบบปฏิบัติการ
          const publicPath = path.join(process.cwd(), 'public');
          const imagePath = path.join(publicPath, 'images', 'blog', imageName);
          
          console.log('พาธของโปรเจค:', process.cwd());
          console.log('พาธของโฟลเดอร์ public:', publicPath);
          console.log('พาธของไฟล์รูปภาพที่จะลบ:', imagePath);
          
          // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
          try {
            if (fs.existsSync(imagePath)) {
              console.log('พบไฟล์รูปภาพ กำลังลบ...');
              fs.unlinkSync(imagePath);
              console.log(`ลบไฟล์รูปภาพสำเร็จ: ${imagePath}`);
            } else {
              console.warn(`ไม่พบไฟล์รูปภาพที่จะลบ: ${imagePath}`);
              
              // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่
              const blogFolderPath = path.join(publicPath, 'images', 'blog');
              if (fs.existsSync(blogFolderPath)) {
                console.log('โฟลเดอร์ blog มีอยู่ รายการไฟล์ในโฟลเดอร์:');
                const files = fs.readdirSync(blogFolderPath);
                console.log(files);
              } else {
                console.warn('ไม่พบโฟลเดอร์ blog');
              }
            }
          } catch (fsError) {
            console.error('เกิดข้อผิดพลาดในการตรวจสอบหรือลบไฟล์:', fsError);
          }
        }
      } catch (fileError) {
        console.error('เกิดข้อผิดพลาดในการลบไฟล์รูปภาพ:', fileError);
        // ยังคงดำเนินการลบบทความต่อไปแม้ว่าจะลบไฟล์ไม่สำเร็จ
      }
    } else {
      console.log('บทความไม่มีรูปภาพที่จะลบ หรือรูปภาพไม่ได้อยู่ใน /images/blog/ โฟลเดอร์:', blog.image);
    }
    
    // ลบบทความจากฐานข้อมูล
    try {
      const deletedBlog = await prisma.blog.delete({
        where: { id: blogId }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'ลบบทความเรียบร้อยแล้ว', 
        data: deletedBlog 
      });
    } catch (deleteError) {
      console.error('Error deleting blog from database:', deleteError);
      return NextResponse.json({ error: 'ไม่สามารถลบบทความได้' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in DELETE API route:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
} 