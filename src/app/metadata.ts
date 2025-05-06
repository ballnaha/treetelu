import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treetelu - ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู",
  description: "ทรีเตลู ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู สำหรับทุกโอกาส ส่งต่อความรัก…ในทุกช่วงเวลา ด้วยช่อดอกไม้และต้นไม้จากเรา",
  keywords: "ต้นไม้, ต้นไม้มงคล, ไม้อวบน้ำ, ไม้ฟอกอากาศ, ของชำร่วย, ช่อดอกไม้, ของขวัญ, สายมู, ฮวงจุ้ย",
  // Server-side favicon handling
  icons: {
    icon: [
      // This will be served from the app directory (favicon.ico)
      { rel: 'icon', url: '/favicon.ico' },
      // This will be served from the app directory (icon.png)
      { rel: 'icon', url: '/icon.png' },
      { rel: 'icon', url: '/favicon.png', type: 'image/png' },
      // This will be served from the public directory
      { rel: 'icon', url: '/images/favicon.png', type: 'image/png' },
    ],
    apple: [
      { rel: 'apple-touch-icon', url: '/images/favicon.png' },
    ],
    shortcut: [
      { rel: 'shortcut icon', url: '/images/favicon.png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Treetelu - ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ",
    description: "ทรีเตลู ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู",
    url: "https://treetelu.com",
    siteName: "Treetelu",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "https://treetelu.com/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Treetelu - ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Treetelu - ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ",
    description: "ทรีเตลู ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู",
    images: ["https://treetelu.com/images/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: "https://treetelu.com",
    types: {
      'application/xml': [
        {
          url: 'https://treetelu.com/sitemap.xml',
          title: 'Sitemap',
        },
      ],
    },
  }
};