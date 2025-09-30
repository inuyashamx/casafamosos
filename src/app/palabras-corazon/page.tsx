"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import LoginModal from '@/components/LoginModal';
import { SmallBannerAd } from '@/components/AdSense';

interface Candidate {
  _id: string;
  name: string;
  photo?: string;
  status: string;
}

export default function PalabrasCorazonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/public/candidates');
      if (!response.ok) throw new Error('Error al cargar candidatos');

      const data = await response.json();

      // Incluir todos los candidatos (activos y eliminados), ordenados por nombre
      const sortedCandidates = data.candidates.sort((a: Candidate, b: Candidate) =>
        a.name.localeCompare(b.name)
      );
      setCandidates(sortedCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateClick = (candidateId: string) => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    router.push(`/palabras-corazon/${candidateId}`);
  };

  if (status === 'loading' || loading) {
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

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Small Banner Ad - Top */}
        <SmallBannerAd className="mb-4" />

        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            ❤️ Palabras al Corazón
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
            Un espacio especial donde puedes expresar tu apoyo, admiración y cariño
            a tu habitante favorito. Escribe desde el corazón y deja que tus palabras
            lleguen a quien más admiras.
          </p>
        </div>

        {/* Candidates Grid */}
        <div className="bg-card rounded-xl border border-border/20 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 text-center">
            Selecciona un habitante para escribirle
          </h2>

          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No hay habitantes disponibles en este momento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {candidates.map((candidate) => (
                <button
                  key={candidate._id}
                  onClick={() => handleCandidateClick(candidate._id)}
                  className="group relative bg-background rounded-lg overflow-hidden border border-border/20
                           hover:border-primary/50 transition-all duration-300 hover:shadow-lg
                           hover:scale-105 cursor-pointer"
                >
                  <div className="aspect-square relative">
                    {candidate.photo ? (
                      <Image
                        src={candidate.photo}
                        alt={candidate.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10
                                    flex items-center justify-center">
                        <span className="text-4xl text-primary/50">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <div className="text-xs mb-1">Escribir a</div>
                        <div className="font-semibold">{candidate.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 sm:p-3">
                    <h3 className="text-sm sm:text-base font-medium text-foreground truncate">
                      {candidate.name}
                    </h3>
                    <div className="flex items-center justify-center mt-1 sm:mt-2 text-primary">
                      <span className="text-xs sm:text-sm group-hover:animate-pulse">
                        ❤️ Escribir
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Small Banner Ad */}
        <SmallBannerAd className="my-6" />

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border/20 text-center">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💬</div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">
              Expresa tus sentimientos
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Escribe mensajes de apoyo y cariño a tu habitante favorito
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border/20 text-center">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">❤️</div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">
              Dale like a otras dedicatorias
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Apoya los mensajes de otros fans con los que te identifiques
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border/20 text-center">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🛡️</div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">
              Espacio seguro y respetuoso
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Solo se permiten mensajes con buenas intenciones y respeto
            </p>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={true}
          onClose={() => setShowLoginModal(false)}
          onAccept={() => setShowLoginModal(false)}
        />
      )}
    </main>
  );
}