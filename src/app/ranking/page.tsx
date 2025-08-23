"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface RankingUserItem {
  rank: number;
  user: { id: string; name: string; image?: string | null; email?: string | null; team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null };
  totalPoints: number;
  voteCount: number;
  lastVoteAt?: string;
}

export default function RankingPage() {
  const [items, setItems] = useState<RankingUserItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [myRank, setMyRank] = useState<{ rank: number; totalUsers: number; totalPoints: number } | null>(null);
  const [detailUser, setDetailUser] = useState<{ id: string; name: string } | null>(null);
  const [detailItems, setDetailItems] = useState<Array<{ candidate: { id: string; name: string; photo?: string | null }, totalPoints: number, voteCount: number, lastVoteAt?: string }>>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const formatUserName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const last = parts[parts.length - 1];
    const initial = last.charAt(0).toUpperCase();
    return `${first} ${initial}.`;
  };

  const loadPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking/users?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Error cargando ranking');
      const data = await res.json();
      // Unir y desduplicar por user.id para evitar claves duplicadas si el backend devuelve usuarios repetidos
      setItems(prev => {
        const merged = [...prev, ...data.items];
        const seen = new Set<string>();
        const deduped: RankingUserItem[] = [];
        for (const it of merged) {
          const id = it.user.id;
          if (!seen.has(id)) {
            seen.add(id);
            deduped.push(it);
          }
        }
        return deduped;
      });
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

  const openUserDetail = async (userId: string, userName: string) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailUser({ id: userId, name: userName });
      const res = await fetch(`/api/ranking/users/${userId}`);
      if (!res.ok) throw new Error('Error cargando desglose');
      const data = await res.json();
      setDetailItems(data.items);
    } catch (err) {
      console.error(err);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const fetchMyRank = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/ranking/users/me');
        if (res.ok) {
          const r = await res.json();
          setMyRank({ rank: r.rank, totalUsers: r.totalUsers, totalPoints: r.totalPoints });
        }
      } catch (e) {
        console.error('Error fetching my rank', e);
      }
    };
    fetchMyRank();
  }, [session]);

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Casa Famosos"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg flex-shrink-0"
          />
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-6 flex-1 justify-center">
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Inicio"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </button>
              <button
                onClick={() => router.push('/vote')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Votar"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7.5v-2H14v2zm2-4H7.5v-2H16v2zm0-4H7.5V7H16v2z"/>
                </svg>
              </button>
              <button
                onClick={() => router.push('/muro')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Muro"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <span className="text-primary p-2" title="Ranking">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h2v-5zm3-7H8v12h2V7zm3 3h-2v9h2v-9zm3-6h-2v15h2V4z"/>
                </svg>
              </span>
              <button
                onClick={() => router.push('/global')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Global"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Título movido al contenido */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">RANKINGS DE VOTANTES</h1>
        </div>
        {session?.user && myRank && (
          <div className="bg-card rounded-xl border border-border/30 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Mi ranking</div>
              <div className="text-2xl font-bold text-foreground">#{myRank.rank}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Puntos acumulados</div>
              <div className="text-xl font-semibold text-primary">{myRank.totalPoints}</div>
            </div>
          </div>
        )}
        <ol className="bg-card rounded-xl border border-border/30 divide-y divide-border/10">
          {items.map((row, idx) => (
            <li key={`${row.user.id}-${row.rank}-${idx}`} className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30" onClick={() => openUserDetail(row.user.id, row.user.name)}>
              <span className="w-8 text-center text-sm font-semibold text-muted-foreground">#{row.rank}</span>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {row.user.image ? (
                  <Image src={row.user.image} alt={row.user.name} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    {row.user.name?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                    {formatUserName(row.user.name)} <TeamBadge team={row.user.team} />
                  </span>
                  <span className="text-sm text-muted-foreground">{row.totalPoints} pts</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{row.voteCount} votos</div>
              </div>
            </li>
          ))}
        </ol>

        {loading && (
          <div className="text-center text-muted-foreground">Cargando...</div>
        )}

        {!hasMore && !loading && items.length === 0 && (
          <div className="text-center text-muted-foreground">No hay resultados aún</div>
        )}

        <div ref={sentinelRef} />
        {detailOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailOpen(false)}>
            <div className="bg-card rounded-xl w/full max-w-md border border-border/40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{formatUserName(detailUser?.name || '')}</h3>
                <button onClick={() => setDetailOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {detailLoading ? (
                  <div className="p-4 text-center text-muted-foreground">Cargando...</div>
                ) : detailItems.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">Sin votos acumulados</div>
                ) : (
                  <ol className="divide-y divide-border/10">
                    {detailItems.map((it) => (
                      <li key={it.candidate.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {it.candidate.photo ? (
                            <Image src={it.candidate.photo} alt={it.candidate.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">{it.candidate.name[0]}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground truncate">{it.candidate.name}</span>
                            <span className="text-sm text-muted-foreground">{it.totalPoints} pts</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{it.voteCount} votos</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


