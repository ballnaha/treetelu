import type { Metadata } from "next";

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } | Promise<{ slug: string }> 
}): Promise<Metadata> {
  try {
    // รอให้ params resolve ก่อนที่จะเข้าถึง .slug
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;
    
    // ในที่นี้เราจะใช้ slug เป็นชื่อบทความ
    const postTitle = decodeURIComponent(slug);
    
    return {
      title: `${postTitle} - Treetelu ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ`,
      description: `อ่านบทความ ${postTitle} จาก Treetelu - บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้`,
      keywords: "ต้นไม้มงคล, ต้นไม้เสริมดวง, ต้นไม้ฮวงจุ้ย, ไม้ฟอกอากาศ, การดูแลต้นไม้, ความเชื่อสายมู, พลังงาน",
      openGraph: {
        title: `${postTitle} - Treetelu`,
        description: `อ่านบทความ ${postTitle} จาก Treetelu - บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้`,
        type: "article",
        locale: "th_TH",
        url: `https://treetelu.com/blog/${slug}`,
        siteName: "Treetelu",
        images: [
          {
            url: "https://treetelu.com/images/og-image.jpg",
            width: 1200,
            height: 630,
            alt: `${postTitle} - Treetelu`
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: `${postTitle} - Treetelu`,
        description: `อ่านบทความ ${postTitle} จาก Treetelu - บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้`,
        images: ["https://treetelu.com/images/og-image.jpg"]
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