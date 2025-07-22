"use client";

interface StructuredDataProps {
  type?: "homepage" | "product" | "category" | "article";
  data?: any;
}

interface SchemaType {
  "@context": string;
  "@type": string | string[];
  [key: string]: any;
}

export default function StructuredData({
  type = "homepage",
  data,
}: StructuredDataProps) {
  // Organization Schema - ปรับปรุงให้ครบถ้วนมากขึ้น
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Treetelu",
    alternateName: "ทรีเตลู ต้นไม้ในกระถาง",
    url: "https://treetelu.com",
    logo: {
      "@type": "ImageObject",
      url: "https://treetelu.com/images/logo.webp",
      width: 400,
      height: 400,
      caption: "Treetelu Logo",
    },
    image: [
      "https://treetelu.com/images/logo.webp",
      "https://treetelu.com/images/banner-3.png",
      "https://treetelu.com/images/banner-4.png",
    ],
    description:
      "ทรีเตลู ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู สำหรับทุกโอกาส ส่งต่อความรัก…ในทุกช่วงเวลา ด้วยช่อดอกไม้และต้นไม้จากเรา",
    foundingDate: "2025",
    slogan: "ส่งต่อความรัก…ในทุกช่วงเวลา ด้วยช่อดอกไม้และต้นไม้จากเรา",
    knowsAbout: [
      "ต้นไม้ในกระถาง",
      "ไม้อวบน้ำ",
      "ไม้ฟอกอากาศ",
      "ช่อดอกไม้",
      "ของชำร่วย",
      "ต้นไม้ของขวัญ",
      "ตะกร้าผลไม้",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Thai", "English"],
        areaServed: "TH",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "09:00",
          closes: "18:00",
        },
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "NakhonPathom",
      addressRegion: "NakhonPathom",
    },
    sameAs: [
      "https://www.facebook.com/treetelu",
      "https://www.instagram.com/treetelu",
      "https://line.me/ti/p/@treetelu",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
  };

  // Website Schema - เพิ่มข้อมูลเพิ่มเติม
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Treetelu",
    alternateName: "ทรีเตลู",
    url: "https://treetelu.com",
    description:
      "ทรีเตลู ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู",
    inLanguage: "th-TH",
    publisher: {
      "@type": "Organization",
      name: "Treetelu",
      logo: {
        "@type": "ImageObject",
        url: "https://treetelu.com/images/logo.webp",
      },
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://treetelu.com/products?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    ],
    mainEntity: {
      "@type": "Organization",
      name: "Treetelu",
    },
  };

  // Online Store Schema - ปรับปรุงให้ครบถ้วนสำหรับ Rich Results
  const onlineStoreSchema = {
    "@context": "https://schema.org",
    "@type": ["OnlineStore", "LocalBusiness", "Store"],
    name: "Treetelu",
    alternateName: "ทรีเตลู",
    description:
      "ทรีเตลู ต้นไม้ในกระถาง ของชำร่วย ต้นไม้ของขวัญ ตะกร้าผลไม้ของขวัญ ไม้ฟอกอากาศ ไม้อวบน้ำ สำหรับสายมู สำหรับทุกโอกาส ส่งต่อความรัก…ในทุกช่วงเวลา ด้วยช่อดอกไม้และต้นไม้จากเรา",
    url: "https://treetelu.com",
    priceRange: "฿35-฿9000",
    image: [
      "https://treetelu.com/images/logo.webp",
      "https://treetelu.com/images/banner-3.png",
      "https://treetelu.com/images/banner-4.png",
    ],
    logo: {
      "@type": "ImageObject",
      url: "https://treetelu.com/images/logo.webp",
      width: 400,
      height: 400,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "NakhonPathom",
      addressRegion: "NakhonPathom",
      streetAddress: "NakhonPathom, Thailand",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "",
      longitude: "",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    paymentAccepted: ["Cash", "Credit Card", "Bank Transfer", "Online Payment"],
    currenciesAccepted: "THB",
    serviceArea: {
      "@type": "Country",
      name: "Thailand",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Treetelu Products",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "ต้นไม้มงคล",
            category: "tree",
            description:
              "ต้นไม้มงคลสำหรับตกแต่งบ้านและออฟฟิศ นำโชคลาภและความเจริญรุ่งเรือง",
          },
          price: "150-599",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "ไม้อวบน้ำ",
            category: "succulent",
            description:
              "ไม้อวบน้ำง่ายต่อการดูแล เหมาะสำหรับมือใหม่ ไม่ต้องรดน้ำบ่อย",
          },
          price: "20-500",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "ช่อดอกไม้",
            category: "bouquet",
            description:
              "ช่อดอกไม้สวยงามสำหรับทุกโอกาส วันเกิด วันครบรอบ และงานพิเศษ",
          },
          price: "300-9000",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "หรีดต้นไม้",
            category: "wreath",
            description: "หรีดต้นไม้สำหรับงานศพ งานบุญ และพิธีกรรมต่างๆ",
          },
          price: "1500-5000",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "ของชำร่วย",
            category: "souvenir",
            description:
              "ของชำร่วยต้นไม้สำหรับงานแต่งงาน งานบุญ และงานเลี้ยงต่างๆ",
          },
          price: "35-100",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "ตะกร้าผลไม้",
            category: "basket",
            description:
              "ตะกร้าผลไม้ของขวัญสำหรับเยี่ยมไข้ งานเลี้ยง และโอกาสพิเศษ",
          },
          price: "500-5000",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
      ],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    sameAs: [
      "https://www.facebook.com/treetelu",
      "https://www.instagram.com/treetelu",
      "https://line.me/ti/p/@treetelu",
    ],
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: "https://treetelu.com",
      },
    ],
  };

  // FAQ Schema สำหรับ Rich Results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "ทรีเตลูขายอะไรบ้าง?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ทรีเตลูขายต้นไม้ในกระถาง ไม้อวบน้ำ ไม้ฟอกอากาศ ช่อดอกไม้ ของชำร่วย ต้นไม้ของขวัญ และตะกร้าผลไม้ของขวัญ เหมาะสำหรับทุกโอกาส",
        },
      },
      {
        "@type": "Question",
        name: "มีบริการจัดส่งหรือไม่?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "มีครับ เรามีบริการจัดส่งทั่วกรุงเทพและปริมณฑล สามารถสั่งซื้อผ่านเว็บไซต์หรือติดต่อทีมงานได้โดยตรง",
        },
      },
      {
        "@type": "Question",
        name: "ต้นไม้เหมาะสำหรับมือใหม่หรือไม่?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "เหมาะมากครับ เรามีไม้อวบน้ำและไม้ฟอกอากาศที่ดูแลง่าย เหมาะสำหรับผู้เริ่มต้นปลูกต้นไม้ พร้อมคำแนะนำการดูแล",
        },
      },
      {
        "@type": "Question",
        name: "สามารถสั่งทำของชำร่วยได้หรือไม่?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ได้ครับ เรารับสั่งทำของชำร่วยต้นไม้สำหรับงานแต่งงาน งานบุญ และงานต่างๆ สามารถปรับแต่งตามความต้องการได้",
        },
      },
    ],
  };

  // LocalBusiness Schema สำหรับ Google My Business
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Treetelu",
    alternateName: "ทรีเตลู",
    description:
      "ร้านต้นไม้และดอกไม้ออนไลน์ จำหน่ายต้นไม้ในกระถาง ไม้อวบน้ำ ไม้ฟอกอากาศ ช่อดอกไม้ และของชำร่วย",
    url: "https://treetelu.com",
    priceRange: "฿35-฿9000",
    image: [
      "https://treetelu.com/images/logo.webp",
      "https://treetelu.com/images/banner-3.png",
      "https://treetelu.com/images/banner-4.png",
    ],
    logo: {
      "@type": "ImageObject",
      url: "https://treetelu.com/images/logo.webp",
      width: 400,
      height: 400,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "NakhonPathom",
      addressRegion: "NakhonPathom",
      streetAddress: "NakhonPathom, Thailand",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "",
      longitude: "",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    paymentAccepted: ["Cash", "Credit Card", "Bank Transfer", "Online Payment"],
    currenciesAccepted: "THB",
    serviceArea: {
      "@type": "Country",
      name: "Thailand",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    sameAs: [
      "https://www.facebook.com/treetelu",
      "https://www.instagram.com/treetelu",
      "https://line.me/ti/p/@treetelu",
    ],
  };

  // Product Schema (สำหรับหน้าสินค้า)
  const getProductSchema = (productData: any) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: productData?.name || "ต้นไม้ในกระถาง",
    description:
      productData?.description ||
      "ต้นไม้คุณภาพดี เหมาะสำหรับตั้งโต๊ะ ของชำร่วย",
    image:
      productData?.image ||
      "https://treetelu.com/images/product-placeholder.jpg",
    brand: {
      "@type": "Brand",
      name: "Treetelu",
    },
    offers: {
      "@type": "Offer",
      price: productData?.price || "299",
      priceCurrency: "THB",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Treetelu",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
    },
  });

  // สร้าง schema ตามประเภทหน้า
  const getSchemas = (): SchemaType[] => {
    const schemas: SchemaType[] = [organizationSchema, websiteSchema];

    if (type === "homepage") {
      schemas.push(
        onlineStoreSchema,
        localBusinessSchema,
        breadcrumbSchema,
        faqSchema
      );
    }

    if (type === "product" && data) {
      schemas.push(getProductSchema(data));
    }

    return schemas;
  };

  const schemas = getSchemas();

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2),
          }}
        />
      ))}
    </>
  );
}
