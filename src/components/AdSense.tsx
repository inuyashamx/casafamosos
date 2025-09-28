"use client";

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  responsive?: boolean;
  className?: string;
}

export default function AdSense({
  slot = '',
  format = 'auto',
  style = { display: 'block' },
  responsive = true,
  className = ''
}: AdSenseProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-3763339383362664"
        data-ad-format={format}
        data-full-width-responsive={responsive}
        {...(slot && { 'data-ad-slot': slot })}
      />
    </div>
  );
}

// Componente para diferentes tipos de ads
export function BannerAd({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || ''}
      format="horizontal"
      className={`my-4 ${className}`}
      style={{ display: 'block', minHeight: '90px' }}
    />
  );
}

export function InArticleAd({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_ADSENSE_INARTICLE_SLOT || ''}
      format="rectangle"
      className={`my-4 ${className}`}
      style={{ display: 'block', textAlign: 'center', minHeight: '280px' }}
    />
  );
}

export function InFeedAd({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT || ''}
      format="fluid"
      className={`my-4 ${className}`}
      style={{ display: 'block' }}
    />
  );
}

// Sticky footer para móvil
export function StickyFooterAd() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border/20 md:hidden">
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_STICKY_SLOT || ''}
        format="horizontal"
        style={{ display: 'block', width: '100%', height: '50px' }}
      />
    </div>
  );
}