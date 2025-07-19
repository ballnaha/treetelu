import { Metadata } from 'next';
import ShippingSettingsManager from '@/components/admin/ShippingSettingsManager';

export const metadata: Metadata = {
  title: 'จัดการการตั้งค่าค่าจัดส่ง - Admin',
  description: 'จัดการการตั้งค่าค่าจัดส่งและยอดขั้นต่ำสำหรับฟรีค่าจัดส่ง',
};

export default function ShippingSettingsPage() {
  return <ShippingSettingsManager />;
}