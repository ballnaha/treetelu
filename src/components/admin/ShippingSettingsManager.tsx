"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from "@mui/material";
import { useAuth } from "@/context/AuthContext";

interface ShippingSettings {
  id: number;
  freeShippingMinAmount: number;
  standardShippingCost: number;
  isActive: boolean;
  updatedAt: string;
}

export default function ShippingSettingsManager() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [freeShippingMinAmount, setFreeShippingMinAmount] =
    useState<number>(1500);
  const [standardShippingCost, setStandardShippingCost] = useState<number>(100);

  // ตรวจสอบสิทธิ์ Admin
  if (!user?.isAdmin) {
    return <Alert severity="error">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</Alert>;
  }

  // ดึงข้อมูลการตั้งค่าปัจจุบัน
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/shipping-settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setFreeShippingMinAmount(data.data.freeShippingMinAmount);
        setStandardShippingCost(data.data.standardShippingCost);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // บันทึกการตั้งค่า
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // ตรวจสอบข้อมูล
      if (freeShippingMinAmount < 0) {
        setError("ยอดขั้นต่ำสำหรับฟรีค่าจัดส่งต้องมากกว่าหรือเท่ากับ 0");
        return;
      }

      if (standardShippingCost < 0) {
        setError("ค่าจัดส่งมาตรฐานต้องมากกว่าหรือเท่ากับ 0");
        return;
      }

      const response = await fetch("/api/admin/shipping-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freeShippingMinAmount,
          standardShippingCost,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setSuccess("บันทึกการตั้งค่าเรียบร้อยแล้ว");

        // ซ่อนข้อความสำเร็จหลัง 3 วินาที
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        จัดการการตั้งค่าค่าจัดส่ง
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            การตั้งค่าค่าจัดส่ง
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              mb: 3,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="ยอดขั้นต่ำสำหรับฟรีค่าจัดส่ง"
                type="number"
                value={freeShippingMinAmount}
                onChange={(e) =>
                  setFreeShippingMinAmount(Number(e.target.value))
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">฿</InputAdornment>
                    ),
                  },
                }}
                helperText="ลูกค้าจะได้รับฟรีค่าจัดส่งเมื่อสั่งซื้อครบยอดนี้"
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="ค่าจัดส่งมาตรฐาน"
                type="number"
                value={standardShippingCost}
                onChange={(e) =>
                  setStandardShippingCost(Number(e.target.value))
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">฿</InputAdornment>
                    ),
                  },
                }}
                helperText="ค่าจัดส่งสำหรับคำสั่งซื้อที่ไม่ครบยอดขั้นต่ำ"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              ตัวอย่างการคำนวณ:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • สั่งซื้อ ฿{(freeShippingMinAmount - 100).toLocaleString()} →
              ค่าจัดส่ง ฿{standardShippingCost.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • สั่งซื้อ ฿{freeShippingMinAmount.toLocaleString()} ขึ้นไป →
              ฟรีค่าจัดส่ง
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={fetchSettings}
              disabled={saving}
            >
              รีเฟรช
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </Button>
          </Box>

          {settings && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                อัปเดตล่าสุด:{" "}
                {new Date(settings.updatedAt).toLocaleString("th-TH")}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
