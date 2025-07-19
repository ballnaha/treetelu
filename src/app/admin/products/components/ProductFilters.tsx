"use client";

import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  InputAdornment,
  Typography,
  Divider,
  Chip,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CategoryIcon from "@mui/icons-material/Category";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface FiltersProps {
  category: string;
  status: string;
  searchTerm: string;
}

interface ProductFiltersProps {
  filters: FiltersProps;
  onFilterChange: (filters: FiltersProps) => void;
}

export default function ProductFilters({
  filters,
  onFilterChange,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FiltersProps>(filters);
  const [categories, setCategories] = useState<
    { id: number; categoryName: string }[]
  >([]);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetValues = {
      category: "",
      status: "",
      searchTerm: "",
    };

    setLocalFilters(resetValues);
    onFilterChange(resetValues);
  };

  // Check if any filter is active
  const isFilterActive =
    localFilters.category || localFilters.status || localFilters.searchTerm;

  return (
    <Box>
      {/* Search Box */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          display: "flex",
          alignItems: "center",
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          name="searchTerm"
          placeholder="ค้นหาสินค้า..."
          value={localFilters.searchTerm}
          onChange={handleInputChange}
          size="small"
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ ml: 1 }}
        />
        <Tooltip title="ค้นหา">
          <IconButton color="primary" onClick={applyFilters} size="small">
            <FilterAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Active Filters */}
      {isFilterActive && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              กรองโดย:
            </Typography>
            <Button
              size="small"
              variant="text"
              color="inherit"
              startIcon={<RestartAltIcon fontSize="small" />}
              onClick={resetFilters}
              sx={{ ml: "auto", fontSize: "0.75rem" }}
            >
              รีเซ็ตทั้งหมด
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {localFilters.category && (
              <Chip
                size="small"
                label={`หมวดหมู่: ${categories.find((c) => c.id.toString() === localFilters.category)?.categoryName || localFilters.category}`}
                onDelete={() => {
                  setLocalFilters((prev) => ({ ...prev, category: "" }));
                  onFilterChange({ ...localFilters, category: "" });
                }}
                color="primary"
                variant="outlined"
                icon={<CategoryIcon fontSize="small" />}
              />
            )}

            {localFilters.status && (
              <Chip
                size="small"
                label={`สถานะ: ${localFilters.status === "on" ? "เปิดใช้งาน" : "ปิดใช้งาน"}`}
                onDelete={() => {
                  setLocalFilters((prev) => ({ ...prev, status: "" }));
                  onFilterChange({ ...localFilters, status: "" });
                }}
                color={localFilters.status === "on" ? "success" : "error"}
                variant="outlined"
                icon={
                  localFilters.status === "on" ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )
                }
              />
            )}

            {localFilters.searchTerm && (
              <Chip
                size="small"
                label={`ค้นหา: ${localFilters.searchTerm}`}
                onDelete={() => {
                  setLocalFilters((prev) => ({ ...prev, searchTerm: "" }));
                  onFilterChange({ ...localFilters, searchTerm: "" });
                }}
                color="info"
                variant="outlined"
                icon={<SearchIcon fontSize="small" />}
              />
            )}
          </Stack>
        </Box>
      )}

      <Typography
        variant="subtitle2"
        gutterBottom
        color="text.secondary"
        sx={{ mt: 3, mb: 1.5, fontWeight: 500 }}
      >
        ตัวกรองขั้นสูง
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Category Filter */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom fontWeight={500}>
          หมวดหมู่สินค้า
        </Typography>
        <TextField
          select
          fullWidth
          name="category"
          value={localFilters.category}
          onChange={handleInputChange}
          size="small"
          sx={{ mt: 1 }}
          SelectProps={{
            MenuProps: {
              disableScrollLock: true,
              transitionDuration: 0,
            },
          }}
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id.toString()}>
              {category.categoryName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Status Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom fontWeight={500}>
          สถานะสินค้า
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            variant={localFilters.status === "" ? "contained" : "outlined"}
            size="small"
            onClick={() => {
              setLocalFilters((prev) => ({ ...prev, status: "" }));
            }}
            sx={{ minWidth: 80 }}
          >
            ทั้งหมด
          </Button>
          <Button
            variant={localFilters.status === "on" ? "contained" : "outlined"}
            size="small"
            color="success"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={() => {
              setLocalFilters((prev) => ({ ...prev, status: "on" }));
            }}
          >
            เปิดใช้งาน
          </Button>
          <Button
            variant={localFilters.status === "off" ? "contained" : "outlined"}
            size="small"
            color="error"
            startIcon={<VisibilityOffIcon fontSize="small" />}
            onClick={() => {
              setLocalFilters((prev) => ({ ...prev, status: "off" }));
            }}
          >
            ปิดใช้งาน
          </Button>
        </Stack>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 4 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={applyFilters}
          startIcon={<FilterAltIcon />}
          sx={{ mb: 1.5 }}
        >
          ใช้ตัวกรอง
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={resetFilters}
          startIcon={<RestartAltIcon />}
        >
          รีเซ็ตตัวกรอง
        </Button>
      </Box>
    </Box>
  );
}
