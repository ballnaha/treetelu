"use client";

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

// Helper function สำหรับติดตาม events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
};

// Helper functions สำหรับ e-commerce tracking
export const trackPurchase = (transactionId: string, value: number, currency: string = 'THB', items: any[] = []) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items
  });
};

export const trackAddToCart = (currency: string = 'THB', value: number, items: any[] = []) => {
  trackEvent('add_to_cart', {
    currency: currency,
    value: value,
    items: items
  });
};

export const trackViewItem = (currency: string = 'THB', value: number, items: any[] = []) => {
  trackEvent('view_item', {
    currency: currency,
    value: value,
    items: items
  });
};
