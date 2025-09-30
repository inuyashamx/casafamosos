"use client";
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Feed from '@/components/Feed';
import Navbar from '@/components/Navbar';
import { SmallBannerAd } from '@/components/AdSense';

export default function MuroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Small Banner Ad */}
        <SmallBannerAd className="mb-4" />

        <Feed />
      </div>
    </main>
  );
}