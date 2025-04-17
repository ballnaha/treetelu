import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "บทความสายมูเตลู - ต้นไม้มงคล ต้นไม้เสริมดวง ไม้ฟอกอากาศ | Treetelu",
  description: "บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้จาก Treetelu รวบรวมความรู้เกี่ยวกับต้นไม้ตามความเชื่อ ฮวงจุ้ย และการจัดวางต้นไม้ในบ้านเพื่อเสริมพลังงานที่ดี",
  keywords: "ต้นไม้มงคล, ต้นไม้เสริมดวง, ต้นไม้ฮวงจุ้ย, ไม้ฟอกอากาศ, การดูแลต้นไม้, ความเชื่อสายมู, พลังงาน",
  openGraph: {
    title: "บทความสายมูเตลู - ต้นไม้มงคล ต้นไม้เสริมดวง | Treetelu",
    description: "บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้จาก Treetelu",
    type: "website",
    locale: "th_TH",
    url: "https://treetelu.com/blog",
    siteName: "Treetelu",
    images: [
      {
        url: "https://treetelu.com/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "บทความสายมูเตลู - Treetelu"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "บทความสายมูเตลู - Treetelu",
    description: "บทความเกี่ยวกับต้นไม้มงคล ต้นไม้เสริมดวง ต้นไม้ฟอกอากาศ และการดูแลต้นไม้จาก Treetelu",
    images: ["https://treetelu.com/images/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: "https://treetelu.com/blog"
  }
}; 