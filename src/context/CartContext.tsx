"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '@/types/product';
import { CartItem } from '@/components/Cart';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'next-tree-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // โหลดรายการสินค้าจาก localStorage เมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    const loadCartFromStorage = () => {
      if (typeof window !== 'undefined') {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            setCartItems(parsedCart);
          } catch (error) {
            console.error('Failed to parse cart data:', error);
            localStorage.removeItem(CART_STORAGE_KEY);
          }
        }
        setIsLoaded(true);
      }
    };

    loadCartFromStorage();
  }, []);

  // บันทึกรายการสินค้าลงใน localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = (product: Product & { quantity?: number }) => {
    // ฟังก์ชันสำหรับสร้าง URL ของรูปภาพ
    const getImageUrl = (imageName: string | undefined) => {
      // ถ้าไม่มีชื่อรูปภาพหรือชื่อไฟล์ undefined หรือ null
      if (!imageName || imageName === 'undefined' || imageName === 'null') {
        return '/images/product/gift.jpg'; // รูป placeholder
      }
      
      // ตรวจสอบว่ารูปภาพมี path เต็มหรือเปล่า
      if (imageName.startsWith('http') || imageName.startsWith('/')) {
        return imageName;
      }
      
      return `/images/product/${imageName}`;
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      const quantityToAdd = product.quantity || 1;
      
      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantityToAdd } 
            : item
        );
      } else {
        // สร้าง URL รูปภาพสินค้า
        const productImageUrl = getImageUrl(product.productImg || product.image);
        
        return [...prevItems, { 
          ...product, 
          quantity: quantityToAdd,
          image: productImageUrl // ใช้ URL ที่สร้างขึ้น
        }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(String(item.salesPrice || 0));
      return total + (price * item.quantity);
    }, 0);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isCartOpen,
      openCart,
      closeCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
} 