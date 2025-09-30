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
  const [adKey, setAdKey] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Reinicializar el anuncio cuando cambie la ruta con un ID único
    setAdKey(Math.random().toString(36).substr(2, 9));
  }, [pathname]);

  useEffect(() => {
    try {
      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }, 100);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [adKey]);

  const uniqueId = `ad-${slot}-${adKey}`;

  return (
    <div className={`adsense-container ${className}`} key={uniqueId} data-ad-id={uniqueId}>
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

export function SmallBannerAd({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_ADSENSE_INARTICLE_SLOT || ''}
      format="fluid"
      className={`my-4 ${className}`}
      style={{ display: 'block', textAlign: 'center', minHeight: '100px', maxHeight: '250px' }}
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