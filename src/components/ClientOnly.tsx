"use client";

import { ReactNode, useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
}

export default function ClientOnly({ children }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div 
        suppressHydrationWarning 
        style={{ 
          visibility: 'hidden', 
          height: 0, 
          overflow: 'hidden' 
        }}
      >
        {/* เนื้อหาที่จะแสดงผลเฉพาะ client-side */}
      </div>
    );
  }

  return <>{children}</>;
} 