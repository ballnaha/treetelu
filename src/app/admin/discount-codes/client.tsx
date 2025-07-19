"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Grid,
  Chip,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { th } from "date-fns/locale";

// Interface สำหรับข้อมูลรหัสส่วนลด
interface DiscountCode {
  id: number;
  code: string;
  type: string;
  value: number;
  minAmount: number;
  maxDiscount?: number;
  description: string;
  maxUses: number;
  usedCount: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Interface สำหรับฟอร์ม
interface DiscountCodeForm {
  id?: number;
  code: string;
  type: string;
  value: number | string;
  minAmount: number | string;
  maxDiscount?: number | string;
  description: string;
  maxUses: number | string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

export default function DiscountCodesClient() {
  // State สำหรับจัดการข้อมูล
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<DiscountCodeForm>({
    code: "",
    type: "percentage",
    value: "",
    minAmount: "",
    maxDiscount: "",
    description: "",
    maxUses: "0",
    status: "active",
    startDate: null,
    endDate: null,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [isEditing, setIsEditing] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // ดึงข้อมูลรหัสส่วนลดทั้งหมด
  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/discount");
      const result = await response.json();

      if (result.success) {
        setDiscountCodes(result.data);
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      console.error("Error fetching discount codes:", error);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อ component ถูกโหลด
  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  // เปิดฟอร์มเพื่อสร้างรหัสส่วนลดใหม่
  const handleCreateNew = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: "",
      minAmount: "",
      maxDiscount: "",
      description: "",
      maxUses: "0",
      status: "active",
      startDate: null,
      endDate: null,
    });
    setIsEditing(false);
    setOpen(true);
  };

  // เปิดฟอร์มเพื่อแก้ไขรหัสส่วนลด
  const handleEdit = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/discount/${id}`);
      const result = await response.json();

      if (result.success) {
        setFormData({
          id: result.data.id,
          code: result.data.code,
          type: result.data.type,
          value: result.data.value,
          minAmount: result.data.minAmount,
          maxDiscount: result.data.maxDiscount || "",
          description: result.data.description,
          maxUses: result.data.maxUses,
          status: result.data.status,
          startDate: result.data.startDate
            ? new Date(result.data.startDate)
            : null,
          endDate: result.data.endDate ? new Date(result.data.endDate) : null,
        });
        setIsEditing(true);
        setOpen(true);
      } else {
        setSnackbar({
          open: true,
          message: result.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        severity: "error",
      });
      console.error("Error fetching discount code:", error);
    } finally {
      setLoading(false);
    }
  };

  // เปิด confirm dialog สำหรับการลบ
  const handleDeleteConfirm = (id: number) => {
    setSelectedId(id);
    setDeleteConfirmOpen(true);
  };

  // ลบรหัสส่วนลด
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/discount/${selectedId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        setSnackbar({
          open: true,
          message: "ลบรหัสส่วนลดเรียบร้อยแล้ว",
          severity: "success",
        });
        // รีเฟรชข้อมูล
        fetchDiscountCodes();
      } else {
        setSnackbar({
          open: true,
          message: result.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        severity: "error",
      });
      console.error("Error deleting discount code:", error);
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
  };

  // จัดการการเปลี่ยนแปลงข้อมูลใน Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจสอบข้อมูลก่อนส่ง
    if (!formData.code) {
      setSnackbar({
        open: true,
        message: "กรุณากรอกรหัสคูปอง",
        severity: "error",
      });
      return;
    }

    if (
      !formData.value ||
      formData.value === "" ||
      Number(formData.value) <= 0
    ) {
      setSnackbar({
        open: true,
        message: "กรุณากรอกค่าส่วนลดที่ถูกต้อง",
        severity: "error",
      });
      return;
    }

    if (!formData.description) {
      setSnackbar({
        open: true,
        message: "กรุณากรอกคำอธิบาย",
        severity: "error",
      });
      return;
    }

    if (formData.type === "percentage" && Number(formData.value) > 100) {
      setSnackbar({
        open: true,
        message: "ส่วนลดแบบเปอร์เซ็นต์ต้องไม่เกิน 100%",
        severity: "error",
      });
      return;
    }

    // เตรียมข้อมูลสำหรับส่ง API
    const dataToSend = {
      ...formData,
      value: Number(formData.value),
      minAmount: formData.minAmount ? Number(formData.minAmount) : 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      maxUses: formData.maxUses ? Number(formData.maxUses) : 0,
    };

    console.log("Sending discount data:", dataToSend);

    try {
      setLoading(true);
      const url = isEditing
        ? `/api/admin/discount/${formData.id}`
        : "/api/admin/discount";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (result.success) {
        setSnackbar({
          open: true,
          message: isEditing
            ? "อัปเดตรหัสส่วนลดเรียบร้อยแล้ว"
            : "สร้างรหัสส่วนลดเรียบร้อยแล้ว",
          severity: "success",
        });
        setOpen(false);
        fetchDiscountCodes();
        // รีเซ็ตฟอร์ม
        setFormData({
          code: "",
          type: "percentage",
          value: "",
          minAmount: "",
          maxDiscount: "",
          description: "",
          maxUses: "0",
          status: "active",
          startDate: null,
          endDate: null,
        });
      } else {
        console.error("API Error:", result);
        setSnackbar({
          open: true,
          message:
            result.error || result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        severity: "error",
      });
      console.error("Error saving discount code:", error);
    } finally {
      setLoading(false);
    }
  };

  // แสดงสถานะของรหัสส่วนลด
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return <Chip label="ใช้งาน" color="success" size="small" />;
      case "inactive":
        return <Chip label="ไม่ใช้งาน" color="error" size="small" />;
      case "expired":
        return <Chip label="หมดอายุ" color="warning" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // แสดงประเภทของส่วนลด
  const getTypeLabel = (type: string, value: number) => {
    if (type === "percentage") {
      return `${value}%`;
    } else if (type === "fixed" || type === "fixed_amount") {
      return `฿${value.toLocaleString()}`;
    } else {
      return `฿${value.toLocaleString()}`;
    }
  };

  // คอมโพเนนต์การ์ดสำหรับแสดงข้อมูลคูปองบนมือถือ
  const MobileDiscountCard = ({ code }: { code: DiscountCode }) => {
    return (
      <Card
        sx={{ mb: 2, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6" component="div" fontWeight="bold">
              {code.code}
            </Typography>
            {getStatusLabel(code.status)}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {code.description || "ไม่มีคำอธิบาย"}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1 }}>
            <Box sx={{ width: "calc(50% - 8px)" }}>
              <Typography variant="body2" color="text.secondary">
                ประเภท
              </Typography>
              <Typography variant="body1">
                {code.type === "percentage"
                  ? "เปอร์เซ็นต์"
                  : code.type === "fixed" || code.type === "fixed_amount"
                    ? "จำนวนเงิน"
                    : "จำนวนเงิน"}
              </Typography>
            </Box>
            <Box sx={{ width: "calc(50% - 8px)" }}>
              <Typography variant="body2" color="text.secondary">
                มูลค่า
              </Typography>
              <Typography
                variant="body1"
                color="primary.main"
                fontWeight="bold"
              >
                {getTypeLabel(code.type, code.value)}
              </Typography>
            </Box>

            <Box sx={{ width: "calc(50% - 8px)" }}>
              <Typography variant="body2" color="text.secondary">
                ยอดขั้นต่ำ
              </Typography>
              <Typography variant="body1">
                ฿{code.minAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: "calc(50% - 8px)" }}>
              <Typography variant="body2" color="text.secondary">
                ส่วนลดสูงสุด
              </Typography>
              <Typography variant="body1">
                {code.maxDiscount
                  ? `฿${code.maxDiscount.toLocaleString()}`
                  : "ไม่จำกัด"}
              </Typography>
            </Box>

            <Box sx={{ width: "calc(50% - 8px)" }}>
              <Typography variant="body2" color="text.secondary">
                จำนวนที่ใช้ได้
              </Typography>
              <Typography variant="body1">
                {code.maxUses === 0
                  ? "ไม่จำกัด"
                  : `${code.usedCount}/${code.maxUses}`}
              </Typography>
            </Box>
            <Box sx={{ width: "calc(50% - 8px)" }}>
              <Typography variant="body2" color="text.secondary">
                ระยะเวลา
              </Typography>
              <Typography variant="body1">
                {code.startDate && code.endDate
                  ? `${new Date(code.startDate).toLocaleDateString("th-TH")} - ${new Date(code.endDate).toLocaleDateString("th-TH")}`
                  : "ไม่จำกัด"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              size="small"
              onClick={() => handleEdit(code.id)}
              startIcon={<EditIcon />}
              sx={{ mr: 1 }}
            >
              แก้ไข
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleDeleteConfirm(code.id)}
              startIcon={<DeleteIcon />}
            >
              ลบ
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          คูปองส่วนลด
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          สร้างคูปองใหม่
        </Button>
      </Box>

      {loading && discountCodes.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {isMobile ? (
            // แสดงผลบนมือถือด้วย cards
            <Box>
              {discountCodes.length > 0 ? (
                discountCodes.map((code) => (
                  <MobileDiscountCard key={code.id} code={code} />
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body1">ยังไม่มีคูปองส่วนลด</Typography>
                </Paper>
              )}
            </Box>
          ) : (
            // แสดงผลบนจอปกติด้วย table
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                mb: 3,
                overflow: "auto",
                "&::-webkit-scrollbar": {
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#c1c1c1",
                  borderRadius: "4px",
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>รหัส</TableCell>
                    <TableCell>รายละเอียด</TableCell>
                    <TableCell>ประเภท</TableCell>
                    <TableCell>มูลค่า</TableCell>
                    <TableCell>ยอดขั้นต่ำ</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>การใช้งาน</TableCell>
                    <TableCell align="right">จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discountCodes.length > 0 ? (
                    discountCodes.map((code) => (
                      <TableRow key={code.id} hover>
                        <TableCell>
                          <strong>{code.code}</strong>
                        </TableCell>
                        <TableCell>{code.description || "-"}</TableCell>
                        <TableCell>
                          {code.type === "percentage"
                            ? "เปอร์เซ็นต์"
                            : code.type === "fixed" ||
                                code.type === "fixed_amount"
                              ? "จำนวนเงิน"
                              : "จำนวนเงิน"}
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="primary.main">
                            {getTypeLabel(code.type, code.value)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          ฿{code.minAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusLabel(code.status)}</TableCell>
                        <TableCell>
                          {code.maxUses === 0
                            ? "ไม่จำกัด"
                            : `${code.usedCount}/${code.maxUses}`}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(code.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteConfirm(code.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        ยังไม่มีคูปองส่วนลด
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ฟอร์มสร้าง/แก้ไขคูปอง */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            pb: 2,
          }}
        >
          {isEditing ? "แก้ไขคูปองส่วนลด" : "สร้างคูปองส่วนลดใหม่"}
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="รหัสคูปอง"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>ประเภท</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    label="ประเภท"
                    MenuProps={{
                      disableScrollLock: true,
                      transitionDuration: 0,
                    }}
                  >
                    <MenuItem value="percentage">เปอร์เซ็นต์</MenuItem>
                    <MenuItem value="fixed">จำนวนเงิน</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label={
                    formData.type === "percentage"
                      ? "เปอร์เซ็นต์ส่วนลด (%)"
                      : "จำนวนเงินส่วนลด (บาท)"
                  }
                  name="value"
                  type="number"
                  value={formData.value}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputProps={{
                    inputProps: {
                      min: 0,
                      max: formData.type === "percentage" ? 100 : undefined,
                    },
                  }}
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="ยอดสั่งซื้อขั้นต่ำ (บาท)"
                  name="minAmount"
                  type="number"
                  value={formData.minAmount}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              </Box>
              {formData.type === "percentage" && (
                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <TextField
                    fullWidth
                    label="ส่วนลดสูงสุด (บาท)"
                    name="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0 },
                    }}
                    helperText="ปล่อยว่างเพื่อไม่จำกัด"
                  />
                </Box>
              )}
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <TextField
                  fullWidth
                  label="จำนวนสิทธิ์ที่ใช้ได้"
                  name="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                  helperText="ใส่ 0 เพื่อไม่จำกัดจำนวน"
                />
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>สถานะ</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="สถานะ"
                    MenuProps={{
                      disableScrollLock: true,
                      transitionDuration: 0,
                    }}
                  >
                    <MenuItem value="active">ใช้งาน</MenuItem>
                    <MenuItem value="inactive">ไม่ใช้งาน</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={th}
                >
                  <DatePicker
                    label="วันที่เริ่มต้น"
                    value={formData.startDate}
                    onChange={(newValue) => {
                      setFormData((prev) => ({ ...prev, startDate: newValue }));
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={th}
                >
                  <DatePicker
                    label="วันที่สิ้นสุด"
                    value={formData.endDate}
                    onChange={(newValue) => {
                      setFormData((prev) => ({ ...prev, endDate: newValue }));
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  label="คำอธิบาย"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Box>
            </Box>
          </form>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(0, 0, 0, 0.12)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={() => setOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {isEditing ? "บันทึกการแก้ไข" : "สร้างคูปอง"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog ยืนยันการลบ */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>คุณต้องการลบคูปองส่วนลดนี้ใช่หรือไม่?</Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            การกระทำนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar แจ้งเตือน */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{
          vertical: isMobile ? "top" : "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
