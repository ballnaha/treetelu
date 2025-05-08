"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertProps, AlertTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ประเภทของ notification
export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

// interface สำหรับข้อมูล notification
interface NotificationData {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
  title?: string;
  autoHideDuration?: number;
}

// interface สำหรับ context
interface NotificationContextType {
  notification: NotificationData;
  showNotification: (message: string, severity: NotificationSeverity, title?: string, autoHideDuration?: number) => void;
  hideNotification: () => void;
}

// สร้าง context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  // state สำหรับเก็บข้อมูล notification
  const [notification, setNotification] = useState<NotificationData>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000,
  });

  // แสดง notification
  const showNotification = (
    message: string, 
    severity: NotificationSeverity = 'info', 
    title?: string,
    autoHideDuration: number = 6000
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      title,
      autoHideDuration,
    });
  };

  // ซ่อน notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ 
          zIndex: 99999,
          bottom: { xs: 24, sm: 40 },
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Alert 
          onClose={hideNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ 
            minWidth: { xs: '90vw', sm: '400px' },
            maxWidth: { xs: '90vw', sm: '500px' },
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            borderRadius: 2,
            fontSize: '1rem'
          }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={hideNotification}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {notification.title && (
            <AlertTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{notification.title}</AlertTitle>
          )}
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

// Hook สำหรับการเข้าถึง context
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
} 