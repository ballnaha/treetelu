import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // ในที่นี้เราจะใช้ slug เป็นชื่อบทความ
  const postTitle = decodeURIComponent(params.slug);
  
  return {
    title: `${postTitle} - Treetelu ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ`,
    description: `อ่านบทความ ${postTitle} จาก Treetelu - บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้`,
    openGraph: {
      title: `${postTitle} - Treetelu`,
      description: `อ่านบทความ ${postTitle} จาก Treetelu - บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้`,
      type: "article",
      locale: "th_TH",
    },
  };
} 