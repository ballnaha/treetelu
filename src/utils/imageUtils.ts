import { Product } from '../types/product';

/**
 * สร้าง slug จากข้อความ
 * @param text ข้อความที่ต้องการแปลงเป็น slug
 * @returns slug ที่สร้างขึ้น
 */
export const generateSlug = (text: string): string => {
  // แปลงอักขระไทยเป็นอักขระละติน (transliteration)
  const transliterated = text
    .replace(/[\u0E00-\u0E7F]/g, char => {
      // แมปอักขระไทยเป็นอักษรละติน (อย่างง่าย)
      const thaiMap: Record<string, string> = {
        'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ฆ': 'kh', 'ง': 'ng',
        'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
        'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th',
        'ฒ': 'th', 'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th',
        'ท': 'th', 'ธ': 'th', 'น': 'n', 'บ': 'b', 'ป': 'p',
        'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph',
        'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
        'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
        'อ': 'o', 'ฮ': 'h',
        // สระ
        'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am', 'ิ': 'i',
        'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
        'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai',
        '็': '', '่': '', '้': '', '๊': '', '๋': '', '์': ''
      };
      return thaiMap[char] || '';
    });

  // แปลงเป็น slug
  return transliterated
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
    .trim()
    .replace(/[\s]+/g, '-') // แทนที่ช่องว่างด้วย -
    .replace(/^-+|-+$/g, '') // ลบ - ที่อยู่ต้นและท้าย
    || 'product'; // กรณีที่ slug ว่าง ให้ใช้ 'product'
};

/**
 * ฟังก์ชันสำหรับแปลง path รูปภาพผลิตภัณฑ์ให้ถูกต้อง
 * @param product ข้อมูลผลิตภัณฑ์
 * @returns path รูปภาพที่ถูกต้อง
 */
export const getProductImagePath = (product: Product): string => {
  let imagePath = "/images/no-image.png";
  
  // ถ้ามี productImg ให้ใช้ path ที่ถูกต้อง
  if (product.productImg && product.productImg !== 'undefined') {
    // ตรวจสอบว่า productImg มี path เต็มหรือไม่
    if (typeof product.productImg === 'string' && (product.productImg.startsWith('/') || product.productImg.startsWith('http'))) {
      imagePath = product.productImg;
    } else if (typeof product.productImg === 'string') {
      // เพิ่ม prefix สำหรับรูปภาพที่อยู่ในโฟลเดอร์ thumbnails
      imagePath = `/images/product/${product.productImg}`;
    }
  } else if (product.image && product.image !== 'undefined') {
    // ถ้าไม่มี productImg แต่มี image
    if (typeof product.image === 'string' && (product.image.startsWith('/') || product.image.startsWith('http'))) {
      imagePath = product.image;
    } else if (typeof product.image === 'string') {
      imagePath = `/images/product/${product.image}`;
    }
  }
  
  // ป้องกันกรณีที่รูปไม่มีอยู่จริง
  if (imagePath.includes('undefined')) {
    imagePath = "/images/no-image.png";
  }
  
  return addNoCacheParam(imagePath);
};

/**
 * เพิ่ม timestamp ใน URL เพื่อป้องกันการแคชรูปภาพ
 * @param path path ของรูปภาพ
 * @returns path ที่มีพารามิเตอร์ timestamp เพื่อป้องกันการแคช
 */
export const addNoCacheParam = (path: string): string => {
  // ถ้า path เป็น URL ภายนอกหรือเป็น data URL ไม่ต้องเพิ่มพารามิเตอร์
  if (!path || path.startsWith('data:')) {
    return path;
  }
  
  // เพิ่ม timestamp เพื่อป้องกันการแคช
  const timestamp = Date.now();
  // ตรวจสอบว่ามี query parameter อยู่แล้วหรือไม่
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}t=${timestamp}`;
};

/**
 * ฟังก์ชันสำหรับแปลงข้อมูลผลิตภัณฑ์จาก API ให้อยู่ในรูปแบบที่ใช้งานได้
 * @param product ข้อมูลผลิตภัณฑ์จาก API
 * @returns ข้อมูลผลิตภัณฑ์ที่แปลงแล้ว
 */
export const formatProductData = (product: any): Product => {
  // คำนวณราคา
  const price = typeof product.price === 'string' ? parseFloat(product.price) : 
                (product.salesPrice ? parseFloat(product.salesPrice) : 650);
  
  // แปลง path รูปภาพ
  const imagePath = getProductImagePath(product);
  
  // กำหนดชื่อสินค้า
  const productName = product.productName || product.name || "สินค้า";
  
  // สร้าง slug จากชื่อสินค้า หรือใช้ slug ที่มีอยู่แล้ว
  const slug = product.slug || generateSlug(productName);
  
  return {
    ...product,
    price,
    image: imagePath,
    name: productName,
    description: product.productDesc || product.description || "รายละเอียดสินค้า",
    rating: product.rating || 4.5,
    id: product.id || product.sku || String(Math.random()).slice(2, 10),
    slug
  };
};

/**
 * สร้าง image onError handler สำหรับแก้ไขกรณีที่โหลดรูปไม่สำเร็จ
 * @param setImageSrc ฟังก์ชันสำหรับตั้งค่า src ของรูป
 * @returns ฟังก์ชัน handler สำหรับ onError event
 */
export const createImageErrorHandler = (setImageSrc: (src: string) => void) => {
  return () => {
    // ตั้งค่ารูปภาพใหม่เป็นรูปตัวอย่าง
    setImageSrc('/images/no-image.png');
  };
};

/**
 * ฟังก์ชันตรวจสอบและแปลง URL ของรูปภาพให้ถูกต้อง
 * 
 * @param url URL ของรูปภาพที่ต้องการตรวจสอบ
 * @returns URL ที่ถูกต้องและใช้งานได้
 */
export const getValidImageUrl = (url: string | undefined): string => {
  // ถ้าไม่มี URL หรือค่าไม่ถูกต้อง หรือเป็นรูปจาก LINE ให้ใช้รูปเริ่มต้น
  if (!url || url === 'undefined' || url === 'null' || url === '' || 
      url.includes('profile.line-scdn.net') || url.includes('obs.line-scdn.net')) {
    return '/images/no-image.png';
  }

  // กรณีที่เป็น URL ทั่วไป ส่งกลับโดยไม่มีการเปลี่ยนแปลง
  return url;
};
