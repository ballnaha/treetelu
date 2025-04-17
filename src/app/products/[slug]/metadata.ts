import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  
  try {
    // ดึงข้อมูลสินค้าจากฐานข้อมูล
    const product = await prisma.product.findFirst({
      where: {
        slug: slug,
      }
    });

    if (!product) {
      return {
        title: `สินค้า - Treetelu`,
        description: `สินค้าจาก Treetelu - ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ`
      };
    }

    // ดึงรูปภาพจากตาราง productimage แยกต่างหาก
    const productImages = await prisma.productimage.findMany({
      where: {
        productId: product.id
      },
      take: 1
    });

    // กำหนดค่าเริ่มต้น
    const productName = product.productName || slug;
    const description = product.productDesc || `ซื้อ ${productName} จาก Treetelu - ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ`;
    
    // กำหนด URL รูปภาพ
    let imageUrl = `/images/default-product.jpg`; // รูปภาพเริ่มต้น
    
    // ถ้ามีรูปภาพในฐานข้อมูล
    if (product.productImg) {
      imageUrl = product.productImg.startsWith('http') 
        ? product.productImg 
        : `/images/product/${product.productImg}`;
    } 
    // หรือถ้ามีรูปภาพในตาราง productimage
    else if (productImages.length > 0 && productImages[0].imageName) {
      const imageName = productImages[0].imageName;
      imageUrl = imageName.startsWith('http')
        ? imageName
        : `/images/product/${imageName}`;
    }

    // กำหนด absolute URL สำหรับรูปภาพ
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
    
    return {
      title: `${productName} - Treetelu ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ`,
      description: description,
      openGraph: {
        title: `${productName} - Treetelu`,
        description: description,
        type: "website",
        locale: "th_TH",
        url: `${baseUrl}/products/${params.slug}`,
        siteName: "Treetelu",
        images: [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: productName,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${productName} - Treetelu`,
        description: description,
        images: [fullImageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "สินค้า - Treetelu",
      description: "ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ"
    };
  }
} 