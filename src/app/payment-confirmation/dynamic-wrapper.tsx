'use client';

import dynamic from 'next/dynamic';

// Import ClientOnly component แบบ dynamic
const ClientOnly = dynamic(() => import("@/components/ClientOnly"), { 
  ssr: false
});

// Import PaymentConfirmationClient แบบ dynamic
const PaymentConfirmationClient = dynamic(() => import('./client'), {
  ssr: false
});

export default function DynamicWrapper() {
  return (
    <ClientOnly>
      <PaymentConfirmationClient />
    </ClientOnly>
  );
} 