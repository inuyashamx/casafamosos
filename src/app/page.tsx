"use client";
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import Chat from '@/components/Chat';

// Mock data - esto vendrá de la API
const mockNominees = [
  { id: '1', name: 'Ana García', photo: '/api/placeholder/150/150', votes: 1250, percentage: 35 },
  { id: '2', name: 'Carlos López', photo: '/api/placeholder/150/150', votes: 980, percentage: 28 },
  { id: '3', name: 'María Rodríguez', photo: '/api/placeholder/150/150', votes: 750, percentage: 21 },
  { id: '4', name: 'Diego Martín', photo: '/api/placeholder/150/150', votes: 570, percentage: 16 },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userPoints, setUserPoints] = useState(60);
  
  // Contador regresivo (mock)
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 32, seconds: 15 });

  const handleVoteClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      // Redirigir a página de votación
      window.location.href = '/vote';
    }
  };

  const handleChatClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      setShowChat(true);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg glow"></div>
            <span className="text-lg font-bold text-foreground">Casa Famosos 2025</span>
          </div>
          {session && (
            <div className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
              {userPoints} puntos
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Nominados de la Semana
        </h1>
        <div className="bg-card/50 rounded-lg p-4 mb-4 border border-primary/20">
          <p className="text-muted-foreground text-sm mb-2">Votación cierra en:</p>
          <div className="flex justify-center space-x-4 text-primary font-mono">
            <div className="text-center">
              <div className="text-xl font-bold">{timeLeft.days}</div>
              <div className="text-xs">días</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{timeLeft.hours}</div>
              <div className="text-xs">hrs</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{timeLeft.minutes}</div>
              <div className="text-xs">min</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{timeLeft.seconds}</div>
              <div className="text-xs">seg</div>
            </div>
          </div>
        </div>
      </section>

      {/* Nominees List */}
      <section className="px-4 space-y-4">
        {mockNominees.map((nominee, index) => (
          <div key={nominee.id} className="vote-card rounded-lg p-4">
            <div className="flex items-center space-x-4 mb-3">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <span className="text-2xl">👤</span>
                </div>
                <div 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                    boxShadow: '0 2px 10px rgba(59, 130, 246, 0.5)'
                  }}
                >
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">{nominee.name}</h3>
                <p className="text-sm text-muted-foreground">{nominee.votes.toLocaleString()} votos</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">{nominee.percentage}%</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700/30 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${nominee.percentage}%`,
                  background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'
                }}
              ></div>
            </div>
            
            {/* Vote indicator */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {nominee.percentage}% del total
              </span>
              <span className="text-primary font-medium">
                +{Math.floor(nominee.votes * 0.1)} votos hoy
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Stats */}
      <section className="px-4 py-6">
        <div className="bg-card/30 rounded-lg p-4 grid grid-cols-2 gap-4 text-center border border-primary/20">
          <div>
            <div className="text-2xl font-bold text-primary">3,550</div>
            <div className="text-sm text-muted-foreground">Votos totales</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">1,234</div>
            <div className="text-sm text-muted-foreground">Usuarios activos</div>
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col space-y-3 z-50">
        {/* Chat Button */}
        <button
          onClick={handleChatClick}
          className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
          style={{
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          }}
        >
          <span className="text-xl">💬</span>
        </button>
        
        {/* Vote Button */}
        <button
          onClick={handleVoteClick}
          className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
          style={{
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.6)',
          }}
        >
          <span className="text-2xl">🗳️</span>
        </button>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-sm border border-primary/20 shadow-xl">
            <h2 className="text-xl font-bold text-center mb-4">Iniciar Sesión</h2>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              Inicia sesión para votar y participar en el chat
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 rounded-lg font-medium glow hover:opacity-90 transition-all duration-200 mb-4"
            >
              Continuar con Google
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Chat Component */}
      <Chat isOpen={showChat} onClose={() => setShowChat(false)} />
    </main>
  );
}
