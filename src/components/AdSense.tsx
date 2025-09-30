"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const [loadKey, setLoadKey] = useState(0);

  // Reinicializar cuando cambie la ruta
  useEffect(() => {
    setLoadKey(prev => prev + 1);
  }, [pathname]);

  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }, 100);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [loadKey]);

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        key={`${slot}-${loadKey}`}
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

export function SmallBannerAd({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || ''}
      format="fluid"
      className={`my-4 ${className}`}
      style={{ display: 'block', textAlign: 'center', minHeight: '90px', maxHeight: '150px' }}
    />
  );
}

export function InArticleAd({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_ADSENSE_INARTICLE_SLOT || ''}
      format="fluid"
      className={`my-4 ${className}`}
      style={{ display: 'block', textAlign: 'center', minHeight: '100px', maxHeight: '250px' }}
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