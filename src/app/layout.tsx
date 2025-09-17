import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "La Casa Vota - Encuestas NO oficiales de La Casa de los Famosos",
  description: "Plataforma de votaciones y encuestas NO OFICIAL de La Casa de los Famosos. Vota por tus habitantes favoritos, participa en encuestas semanales y gana puntos.",
  keywords: "la casa vota, encuestas la casa de los famosos, votaciones no oficial, votar habitantes, lacasavota, reality show encuestas",
  authors: [{ name: "La Casa Vota" }],
  creator: "La Casa Vota",
  publisher: "La Casa Vota",
  manifest: "/manifest.json",
  metadataBase: new URL('https://www.lacasavota.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "La Casa Vota - Encuestas NO oficiales",
    description: "Vota por tus habitantes favoritos de La Casa de los Famosos. Plataforma NO OFICIAL de encuestas y votaciones.",
    url: 'https://www.lacasavota.com',
    siteName: 'La Casa Vota',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'La Casa Vota Logo',
      }
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "La Casa Vota - Encuestas NO oficiales",
    description: "Vota por tus habitantes favoritos de La Casa de los Famosos. Plataforma NO OFICIAL 🏠✨",
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="lacasavota.com" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ff6b6b" />

        {/* Twitter conversion tracking base code */}
        <Script
          id="twitter-tracking"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
              },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
              twq('config','q91m1');
            `,
          }}
        />
        
        {/* Twitter conversion tracking event code */}
        <Script
          id="twitter-event-tracking"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Insert Twitter Event ID
              twq('event', 'tw-q91m1-q91m1', {
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
