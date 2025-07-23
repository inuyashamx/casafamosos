"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock data - esto vendrá de la API
const mockNominees = [
  { id: '1', name: 'Ana García', photo: '/api/placeholder/150/150', currentVotes: 1250 },
  { id: '2', name: 'Carlos López', photo: '/api/placeholder/150/150', currentVotes: 980 },
  { id: '3', name: 'María Rodríguez', photo: '/api/placeholder/150/150', currentVotes: 750 },
  { id: '4', name: 'Diego Martín', photo: '/api/placeholder/150/150', currentVotes: 570 },
];

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [availablePoints, setAvailablePoints] = useState(60);
  const [votes, setVotes] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si no está logueado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const usedPoints = Object.values(votes).reduce((sum, points) => sum + points, 0);
  const remainingPoints = availablePoints - usedPoints;

  const handleVoteChange = (candidateId: string, points: number) => {
    const newVotes = { ...votes };
    const currentVote = newVotes[candidateId] || 0;
    const difference = points - currentVote;

    // Verificar que no exceda los puntos disponibles
    if (difference > remainingPoints) {
      points = currentVote + remainingPoints;
    }

    if (points <= 0) {
      delete newVotes[candidateId];
    } else {
      newVotes[candidateId] = points;
    }

    setVotes(newVotes);
  };

  const handleSubmitVotes = async () => {
    if (usedPoints === 0) {
      alert('Debes asignar al menos 1 punto para votar');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Aquí iría la llamada a la API
      console.log('Enviando votos:', votes);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('¡Votos enviados exitosamente!');
      router.push('/');
    } catch (error) {
      alert('Error al enviar votos. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border/40">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </button>
          <span className="font-bold text-foreground">Votar</span>
          <div className="text-sm text-primary font-medium">
            {remainingPoints} puntos
          </div>
        </div>
      </header>

      {/* Points Summary */}
      <section className="px-4 py-4">
        <div className="bg-card/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">{remainingPoints}</div>
          <div className="text-sm text-muted-foreground">puntos disponibles</div>
          {usedPoints > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Has usado {usedPoints} de {availablePoints} puntos
            </div>
          )}
        </div>
      </section>

      {/* Voting Interface */}
      <section className="px-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Distribuye tus puntos
        </h2>
        
        {mockNominees.map((nominee) => {
          const currentVote = votes[nominee.id] || 0;
          
          return (
            <div key={nominee.id} className="bg-card rounded-lg p-4 border border-border/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{nominee.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {nominee.currentVotes.toLocaleString()} votos actuales
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {currentVote} pts
                  </div>
                </div>
              </div>

              {/* Vote Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleVoteChange(nominee.id, Math.max(0, currentVote - 1))}
                  disabled={currentVote <= 0}
                  className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
                >
                  -
                </button>
                
                <input
                  type="number"
                  min="0"
                  max={currentVote + remainingPoints}
                  value={currentVote}
                  onChange={(e) => handleVoteChange(nominee.id, parseInt(e.target.value) || 0)}
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-center text-foreground focus:border-primary focus:outline-none"
                />
                
                <button
                  onClick={() => handleVoteChange(nominee.id, currentVote + 1)}
                  disabled={remainingPoints <= 0}
                  className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Quick Vote Buttons */}
              <div className="flex space-x-2 mt-3">
                {[5, 10, 20].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleVoteChange(nominee.id, Math.min(currentVote + amount, currentVote + remainingPoints))}
                    disabled={remainingPoints < amount}
                    className="flex-1 bg-muted/30 text-muted-foreground py-1 px-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/40 p-4">
        <button
          onClick={handleSubmitVotes}
          disabled={usedPoints === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed glow hover:scale-[1.02] transition-transform"
        >
          {isSubmitting ? 'Enviando...' : `Enviar ${usedPoints} votos`}
        </button>
        
        {usedPoints === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-2">
            Asigna puntos para poder votar
          </p>
        )}
      </div>
    </main>
  );
} 