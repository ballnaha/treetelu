import { Metadata } from "next";
import FAQClient from "./client";

export const metadata: Metadata = {
  title: "คำถามที่พบบ่อย | Treetelu - ทรีเตลู",
  description:
    "รวบรวมคำถามและคำตอบที่ลูกค้าสอบถามบ่อยๆ เกี่ยวกับต้นไม้ในกระถาง ไม้อวบน้ำ ช่อดอกไม้ ตะกร้าผลไม้ และบริการต่างๆ ของ Treetelu",
  keywords: [
    "FAQ",
    "คำถามที่พบบ่อย",
    "ทรีเตลู",
    "Treetelu",
    "ต้นไม้ในกระถาง",
    "ไม้อวบน้ำ",
    "ช่อดอกไม้",
    "ตะกร้าผลไม้",
    "ของชำร่วย",
    "การดูแลต้นไม้",
    "การจัดส่ง",
    "การชำระเงิน",
    "บริการลูกค้า",
  ],
  openGraph: {
    title: "คำถามที่พบบ่อย | Treetelu - ทรีเตลู",
    description:
      "รวบรวมคำถามและคำตอบที่ลูกค้าสอบถามบ่อยๆ เกี่ยวกับสินค้าและบริการของ Treetelu",
    url: "https://treetelu.com/faq",
    siteName: "Treetelu",
    images: [
      {
        url: "https://treetelu.com/images/logo-white.png",
        width: 1200,
        height: 630,
        alt: "Treetelu FAQ - คำถามที่พบบ่อย",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "คำถามที่พบบ่อย | Treetelu - ทรีเตลู",
    description:
      "รวบรวมคำถามและคำตอบที่ลูกค้าสอบถามบ่อยๆ เกี่ยวกับสินค้าและบริการของ Treetelu",
    images: ["https://treetelu.com/images/logo-white.png"],
  },
  alternates: {
    canonical: "https://treetelu.com/faq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// FAQ Structured Data
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ทรีเตลูขายอะไรบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ทรีเตลูขายต้นไม้ในกระถาง ไม้อวบน้ำ ไม้ฟอกอากาศ ช่อดอกไม้ ของชำร่วย ต้นไม้ของขวัญ และตะกร้าผลไม้ของขวัญ เหมาะสำหรับทุกโอกาส ไม่ว่าจะเป็นงานแต่งงาน วันเกิด วันครบรอบ หรือเป็นของขวัญให้คนพิเศษ",
      },
    },
    {
      "@type": "Question",
      name: "มีบริการจัดส่งหรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "มีครับ เรามีบริการจัดส่งทั่วกรุงเทพและปริมณฑล สามารถสั่งซื้อผ่านเว็บไซต์หรือติดต่อทีมงานได้โดยตรง ค่าจัดส่งขึ้นอยู่กับระยะทางและขนาดของสินค้า",
      },
    },
    {
      "@type": "Question",
      name: "ต้นไม้เหมาะสำหรับมือใหม่หรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เหมาะมากครับ เรามีไม้อวบน้ำและไม้ฟอกอากาศที่ดูแลง่าย เหมาะสำหรับผู้เริ่มต้นปลูกต้นไม้ พร้อมคำแนะนำการดูแลที่ละเอียด รวมถึงการรดน้ำ การให้แสง และการใส่ปุ๋ย",
      },
    },
    {
      "@type": "Question",
      name: "สามารถสั่งทำของชำร่วยได้หรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ได้ครับ เรารับสั่งทำของชำร่วยต้นไม้สำหรับงานแต่งงาน งานบุญ และงานต่างๆ สามารถปรับแต่งตามความต้องการได้ ทั้งการเลือกต้นไม้ กระถาง และการตกแต่ง โดยมีราคาเริ่มต้นที่ 35 บาทต่อชิ้น",
      },
    },
    {
      "@type": "Question",
      name: "ตะกร้าผลไม้มีแบบไหนบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เรามีตะกร้าผลไม้หลากหลายแบบ ตั้งแต่ตะกร้าผลไม้พรีเมียม ตะกร้าผลไม้เยี่ยมไข้ ตะกร้าผลไม้ของขวัญ ราคาตั้งแต่ 500-5,000 บาท สามารถเลือกผลไม้ตามความต้องการได้",
      },
    },
    {
      "@type": "Question",
      name: "ใช้เวลาจัดส่งนานแค่ไหน?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "โดยปกติใช้เวลาจัดส่ง 1-3 วันทำการ สำหรับพื้นที่กรุงเทพและปริมณฑล ทั้งนี้ขึ้นอยู่กับความพร้อมของสินค้าและสภาพอากาศ",
      },
    },
    {
      "@type": "Question",
      name: "มีวิธีการชำระเงินอะไรบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เรารับชำระเงินหลายช่องทาง ได้แก่ โอนเงินผ่านธนาคาร บัตรเครดิต พร้อมเพย์ และเก็บเงินปลายทาง (COD) สำหรับพื้นที่ที่มีบริการ",
      },
    },
    {
      "@type": "Question",
      name: "ต้นไม้ที่ซื้อมาต้องดูแลอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "แต่ละชนิดต้นไม้จะมีวิธีการดูแลที่แตกต่างกัน เราจะแนบคำแนะนำการดูแลมาให้ทุกครั้ง โดยทั่วไปควรวางในที่ที่มีแสงเหมาะสม รดน้ำตามความจำเป็น และใส่ปุ๋ยเป็นระยะ",
      },
    },
    {
      "@type": "Question",
      name: "ติดต่อทีมงานได้อย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "สามารถติดต่อเราได้หลายช่องทาง ผ่าน Facebook: Treetelu, Instagram: @treetelu, Line: @treetelu หรือโทรศัพท์ในเวลาทำการ 09:00-18:00 น. ทุกวัน",
      },
    },
    {
      "@type": "Question",
      name: "สามารถยกเลิกคำสั่งซื้อได้หรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "สามารถยกเลิกได้ครับ หากยังไม่ได้เริ่มจัดเตรียมสินค้า กรุณาติดต่อทีมงานโดยเร็วที่สุด เราจะดำเนินการยกเลิกและคืนเงินให้ตามเงื่อนไข",
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <div suppressHydrationWarning>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData, null, 2),
        }}
      />
      <FAQClient />
    </div>
  );
}
