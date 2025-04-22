import ContactPage from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ติดต่อเรา | TreeTelu',
  description: 'ติดต่อทีมงาน TreeTelu เพื่อสอบถามข้อมูลเพิ่มเติมเกี่ยวกับผลิตภัณฑ์และบริการของเรา',
};

export default function Page() {
  return (
    <div suppressHydrationWarning>
      <ContactPage />
    </div>
  );
}
