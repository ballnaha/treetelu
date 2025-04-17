import type { Metadata } from "next";

// นำเข้าข้อมูลบทความ
const blogPosts = [
  {
    id: 1,
    title: 'ต้นไม้มงคลตามทิศเหนือ',
    excerpt: 'เรียนรู้เกี่ยวกับต้นไม้มงคลที่เหมาะสำหรับทิศเหนือ ตามหลักฮวงจุ้ย',
    image: '/images/blog/north.jpg',
    slug: 'ต้นไม้มงคลตามทิศเหนือ',
    date: '20 มีนาคม 2024',
    category: 'ฮวงจุ้ย',
    content: `...`
  },
  {
    id: 2,
    title: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    excerpt: 'แนะนำต้นไม้เสริมดวงที่เหมาะสำหรับทิศตะวันออก',
    image: '/images/blog/east.jpg',
    slug: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    date: '19 มีนาคม 2024',
    category: 'ฮวงจุ้ย',
    content: `...`
  },
  {
    id: 3,
    title: 'ต้นไม้เสริมโชคลาภทิศใต้',
    excerpt: 'ต้นไม้เสริมโชคลาภที่เหมาะสำหรับทิศใต้',
    image: '/images/blog/south.jpg',
    slug: 'ต้นไม้เสริมโชคลาภทิศใต้',
    date: '18 มีนาคม 2024',
    category: 'ฮวงจุ้ย',
    content: `...`
  },
  {
    id: 4,
    title: 'ต้นไม้เสริมความรักทิศตะวันตก',
    excerpt: 'ต้นไม้เสริมความรักที่เหมาะสำหรับทิศตะวันตก',
    image: '/images/blog/west.jpg',
    slug: 'ต้นไม้เสริมความรักทิศตะวันตก',
    date: '17 มีนาคม 2024',
    category: 'ฮวงจุ้ย',
    content: `...`
  },
  {
    id: 5,
    title: '5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    excerpt: 'แนะนำต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน ตามความเชื่อโบราณ',
    image: '/images/blog/money-tree.jpg',
    slug: '5-ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    date: '16 มีนาคม 2024',
    category: 'ความเชื่อ',
    content: `...`
  },
  {
    id: 6,
    title: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    excerpt: 'แนะนำต้นไม้ที่ช่วยดูดซับพลังงานลบและวิธีการดูแลรักษา',
    image: '/images/blog/negative-energy.jpg',
    slug: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    date: '15 มีนาคม 2024',
    category: 'การดูแล',
    content: `...`
  },
  {
    id: 7,
    title: '5 ต้นไม้เสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    excerpt: 'แนะนำต้นไม้ที่ช่วยเสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    image: '/images/blog/work.jpg',
    slug: '5-ต้นไม้เสริมการทำงาน-เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    date: '23 มีนาคม 2024',
    category: 'ไลฟ์สไตล์',
    content: `...`
  }
];

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } | Promise<{ slug: string }> 
}): Promise<Metadata> {
  try {
    // รอให้ params resolve ก่อนที่จะเข้าถึง .slug
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;
    
    // ค้นหาบทความจาก slug
    const decodedSlug = decodeURIComponent(slug);
    const post = blogPosts.find(post => post.slug === decodedSlug);
    
    // หากไม่พบบทความ ใช้ข้อมูลเริ่มต้น
    if (!post) {
      return {
        title: "บทความไม่พบ - Treetelu",
        description: "ไม่พบบทความที่คุณกำลังค้นหา"
      };
    }
    
    // สร้าง metadata จากข้อมูลบทความที่พบ
    return {
      title: `${post.title} - Treetelu ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ`,
      description: post.excerpt,
      keywords: `ต้นไม้มงคล, ต้นไม้เสริมดวง, ต้นไม้ฮวงจุ้ย, ไม้ฟอกอากาศ, การดูแลต้นไม้, ${post.category}, ${post.title}`,
      openGraph: {
        title: `${post.title} - Treetelu`,
        description: post.excerpt,
        type: "article",
        locale: "th_TH",
        url: `https://treetelu.com/blog/${slug}`,
        siteName: "Treetelu",
        images: [
          {
            url: `https://treetelu.com${post.image}`,
            width: 1200,
            height: 630,
            alt: post.title
          }
        ],
        publishedTime: post.date
      },
      twitter: {
        card: "summary_large_image",
        title: `${post.title} - Treetelu`,
        description: post.excerpt,
        images: [`https://treetelu.com${post.image}`]
      },
      robots: {
        index: true,
        follow: true
      },
      alternates: {
        canonical: `https://treetelu.com/blog/${slug}`
      }
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "บทความ - Treetelu",
      description: "บทความเกี่ยวกับต้นไม้มงคล จาก Treetelu"
    }
  }
} 