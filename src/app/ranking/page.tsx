"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface RankingItem {
  id: string;
  weekNumber: number;
  name?: string;
  votingStartDate?: string;
  votingEndDate?: string;
  results: {
    totalVotes: number;
    votingStats: Array<{
      candidateId: string | null;
      candidateName: string;
      candidatePhoto: string | null;
      votes: number;
      percentage: number;
    }>;
    winner?: any;
  };
}

export default function RankingPage() {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const loadPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Error cargando ranking');
      const data = await res.json();
      setItems(prev => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadPage();
      }
    }, { rootMargin: '200px' });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, [loadPage]);

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/muro')} className="text-lg font-bold text-foreground hover:text-primary transition-colors">Muro</button>
            <span className="text-muted-foreground">/</span>
            <span className="text-lg font-bold text-primary">RANKING DE TODOS LOS TIEMPOS</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {items.map((week) => (
          <section key={week.id} className="bg-card rounded-xl border border-border/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Semana {week.weekNumber}</span>
                {week.name && <span className="text-sm text-foreground">• {week.name}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(week.votingStartDate)} - {formatDate(week.votingEndDate)}
              </div>
            </div>
            <ol className="divide-y divide-border/10">
              {week.results.votingStats.map((stat, idx) => (
                <li key={`${week.id}-${stat.candidateId || idx}`} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {stat.candidatePhoto ? (
                      <Image src={stat.candidatePhoto} alt={stat.candidateName} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        {stat.candidateName[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{stat.candidateName}</span>
                      <span className="text-sm text-muted-foreground">{stat.votes} pts</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, stat.percentage)}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {loading && (
          <div className="text-center text-muted-foreground">Cargando...</div>
        )}

        {!hasMore && !loading && items.length === 0 && (
          <div className="text-center text-muted-foreground">No hay resultados aún</div>
        )}

        <div ref={sentinelRef} />
      </div>
    </main>
  );
}


