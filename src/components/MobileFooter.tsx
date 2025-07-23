"use client";

import { Box, IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PetsIcon from "@mui/icons-material/Pets";
import PersonIcon from "@mui/icons-material/Person";
import { useRouter, usePathname } from "next/navigation";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalFloristOutlinedIcon from "@mui/icons-material/LocalFloristOutlined";
const MobileFooter = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: <HomeIcon />, path: "/", label: "หน้าหลัก" },
    { icon: <LocalFloristOutlinedIcon />, path: "/products", label: "สินค้า" },
    {
      icon: <ShoppingCartOutlinedIcon />,
      path: "/checkout",
      label: "รายการโปรด",
      isCenter: true,
    },
    {
      icon: <HistoryOutlinedIcon />,
      path: "/order-history",
      label: "ประวัติการสั่งซื้อ",
    },
    { icon: <PersonIcon />, path: "/profile", label: "โปรไฟล์" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", md: "none" },
        zIndex: 1000,
      }}
    >
      {/* Background with curved notch using SVG */}
      <Box
        sx={{
          position: "relative",
          height: 60,
        }}
      >
        <svg
          width="100%"
          height="60"
          viewBox="0 0 375 60"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            filter: "drop-shadow(0 -4px 20px rgba(0,0,0,0.1))",
          }}
        >
          <path
            d="M 24,0 
               L 140,0
               C 150,0 155,5 160,15
               C 165,25 175,35 187.5,35
               C 200,35 210,25 215,15
               C 220,5 225,0 235,0
               L 351,0 
               C 363,0 375,12 375,24
               L 375,70 
               L 0,70
               L 0,24
               C 0,12 12,0 24,0 Z"
            fill="white"
          />
        </svg>
      </Box>

      {/* Navigation items */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-end",
          px: 2,
          pb: 1,
          
        }}
      >
        {navItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            <IconButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                width: item.isCenter ? 56 : 48,
                height: item.isCenter ? 56 : 48,
                bgcolor: item.isCenter ? "primary.main" : "transparent",
                color: item.isCenter
                  ? "#FFFFFF"
                  : pathname === item.path
                    ? "primary.main"
                    : "text.secondary",
                borderRadius: "50%",
                boxShadow: item.isCenter
                  ? "0 4px 16px rgba(25, 118, 210, 0.4)"
                  : "none",
                transform: item.isCenter ? "translateY(-25px)" : "none",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: item.isCenter ? "primary.dark" : "action.hover",
                  transform: item.isCenter
                    ? "translateY(-27px) scale(1.05)"
                    : "scale(1.05)",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: item.isCenter ? 28 : 24,
                },
              }}
            >
              {item.icon}
            </IconButton>

            {/* Active indicator for non-center items */}
            {!item.isCenter && pathname === item.path && (
              <Box
                sx={{
                  
                  bgcolor: "primary.main",
                  borderRadius: "50%",
                  
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MobileFooter;
