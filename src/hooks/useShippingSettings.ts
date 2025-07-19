"use client";

import { useState, useEffect } from 'react';

export interface ShippingSettings {
  freeShippingMinAmount: number;
  standardShippingCost: number;
}

export function useShippingSettings() {
  const [settings, setSettings] = useState<ShippingSettings>({
    freeShippingMinAmount: 1500,
    standardShippingCost: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/shipping-settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings({
          freeShippingMinAmount: data.data.freeShippingMinAmount,
          standardShippingCost: data.data.standardShippingCost
        });
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      console.error('Error fetching shipping settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // คำนวณค่าจัดส่งตามยอดสั่งซื้อ
  const calculateShippingCost = (subtotal: number): number => {
    return subtotal >= settings.freeShippingMinAmount ? 0 : settings.standardShippingCost;
  };

  // ตรวจสอบว่าได้รับฟรีค่าจัดส่งหรือไม่
  const isEligibleForFreeShipping = (subtotal: number): boolean => {
    return subtotal >= settings.freeShippingMinAmount;
  };

  // คำนวณยอดที่ต้องซื้อเพิ่มเพื่อได้ฟรีค่าจัดส่ง
  const getAmountNeededForFreeShipping = (subtotal: number): number => {
    if (subtotal >= settings.freeShippingMinAmount) return 0;
    return settings.freeShippingMinAmount - subtotal;
  };

  return {
    settings,
    loading,
    error,
    calculateShippingCost,
    isEligibleForFreeShipping,
    getAmountNeededForFreeShipping,
    refetch: fetchSettings
  };
}