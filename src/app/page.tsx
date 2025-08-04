"use client";
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Chat from '@/components/Chat';
import Footer from '@/components/Footer';

interface Nominee {
  id: string;
  name: string;
  photo: string;
  votes: number;
  percentage: number;
}

interface WeekData {
  id: string;
  weekNumber: number;
  name: string;
  votingEndDate: string;
  isActive: boolean;
  status?: string;
}

interface SeasonData {
  id: string;
  name: string;
  year: number;
}

interface EliminatedCandidate {
  id: string;
  name: string;
  photo?: string;
  eliminatedAt: string;
}

interface SavedCandidate {
  id: string;
  name: string;
  photo?: string;
  savedAt: string;
}

interface VotingData {
  nominees: Nominee[];
  week: WeekData;
  season: SeasonData;
  totalVotes?: number;
  eliminatedCandidate?: EliminatedCandidate;
  savedCandidate?: SavedCandidate;
}

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canReceiveShareBonus, setCanReceiveShareBonus] = useState(false);
  
  // Redes sociales
  const [socialMedia, setSocialMedia] = useState({
    whatsapp: '',
    telegram: '',
    twitter: '',
    facebook: '',
    instagram: '',
    tiktok: '',
  });
  
  // Contador regresivo
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Cargar datos de votación
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          setVotingData(data);
          
          // Calcular tiempo restante si hay votación activa
          if (data.week?.votingEndDate) {
            updateCountdown(data.week.votingEndDate);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error al cargar datos');
        }
      } catch (error) {
        console.error('Error fetching voting data:', error);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchVotingData();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchVotingData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar redes sociales
  useEffect(() => {
    const fetchSocialMedia = async () => {
      try {
        const response = await fetch('/api/social-media');
        if (response.ok) {
          const data = await response.json();
          setSocialMedia(data);
        }
      } catch (error) {
        console.error('Error fetching social media:', error);
      }
    };

    fetchSocialMedia();
  }, []);

  // Cargar puntos del usuario y verificar si es admin
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session) return;
      
      try {
        // Cargar puntos
        const pointsResponse = await fetch('/api/vote?action=points');
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setUserPoints(pointsData.availablePoints);
        }

        // Verificar si es admin
        const adminResponse = await fetch('/api/admin?action=checkAdmin');
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          setIsAdmin(adminData.isAdmin || false);
        }

        // Verificar si puede recibir bono de compartir
        const shareBonusResponse = await fetch('/api/vote?action=share-bonus');
        if (shareBonusResponse.ok) {
          setCanReceiveShareBonus(true);
        } else {
          const errorData = await shareBonusResponse.json();
          setCanReceiveShareBonus(!errorData.alreadyReceived);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session]);

  // Actualizar contador regresivo
  const updateCountdown = (endDate: string) => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (votingData?.week?.votingEndDate) {
      const cleanup = updateCountdown(votingData.week.votingEndDate);
      return cleanup;
    }
  }, [votingData?.week?.votingEndDate]);

  const handleVoteClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      // Redirigir a página de votación
      router.push('/vote');
    }
  };

  // Redirigir a votación después del login si hay votación activa
  useEffect(() => {
    if (session && votingData?.week?.isActive && window.location.search.includes('message=voted')) {
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [session, votingData?.week?.isActive]);

  // const handleChatClick = () => {
  //   if (!session) {
  //     setShowLoginModal(true);
  //   } else {
  //     setShowChat(true);
  //   }
  // };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/public/vote');
      if (response.ok) {
        const data = await response.json();
        setVotingData(data);
        if (data.week?.votingEndDate) {
          updateCountdown(data.week.votingEndDate);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar datos');
      }
          } catch (error) {
        setError('Error de conexión');
      } finally {
      setLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      const shareUrl = window.location.origin;
      const shareText = '¡Vota por tus candidatos favoritos en Casa Famosos! 🏠✨';
      
      // Detectar si es móvil real (no solo viewport)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Solo usar Web Share API en móviles reales
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: 'Casa Famosos 2025',
            text: shareText,
            url: shareUrl
          });
          
          // Después de compartir exitosamente, dar puntos extra
          await giveShareBonus();
          return;
        } catch (err) {
          // Si el usuario cancela el share nativo, mostrar nuestra ventana personalizada
          console.log('Share nativo cancelado, mostrando ventana personalizada');
        }
      }
      
      // En desktop o si falla el share nativo, mostrar ventana personalizada
      showCustomShareModal(shareUrl, shareText);
      
          } catch (shareError) {
        console.error('Error compartiendo app:', shareError);
        // En caso de error, mostrar ventana personalizada
        const shareUrl = window.location.origin;
        const shareText = '¡Vota por tus candidatos favoritos en Casa Famosos! 🏠✨';
        showCustomShareModal(shareUrl, shareText);
      }
  };

  const showCustomShareModal = (shareUrl: string, shareText: string) => {
    // Crear modal personalizado
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-card rounded-2xl w-full max-w-md border border-border/40 overflow-hidden shadow-2xl">
        <div class="bg-gradient-to-r from-primary to-accent p-6 text-center text-white">
          <div class="text-4xl mb-2">📤</div>
          <h3 class="text-xl font-bold">¡Comparte Casa Famosos!</h3>
          <p class="text-sm opacity-90 mt-1">Ayuda a tus candidatos favoritos</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="bg-muted/30 rounded-lg p-4 border border-border/20">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span class="text-xl">🔗</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground break-all">${shareUrl}</p>
                <p class="text-xs text-muted-foreground mt-1">Enlace de la aplicación</p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <button onclick="copyToClipboard('${shareUrl}')" class="share-option-btn">
              <div class="text-3xl mb-2">📋</div>
              <span class="text-sm font-medium">Copiar Enlace</span>
            </button>
            <button onclick="shareToWhatsApp('${shareText} ${shareUrl}')" class="share-option-btn">
              <div class="text-3xl mb-2">💬</div>
              <span class="text-sm font-medium">WhatsApp</span>
            </button>
            <button onclick="shareToTwitter('${shareText} ${shareUrl}')" class="share-option-btn">
              <div class="text-3xl mb-2">🐦</div>
              <span class="text-sm font-medium">Twitter</span>
            </button>
            <button onclick="shareToFacebook('${shareText} ${shareUrl}')" class="share-option-btn">
              <div class="text-3xl mb-2">📘</div>
              <span class="text-sm font-medium">Facebook</span>
            </button>
          </div>
          
          <div class="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
            <p class="text-sm text-amber-600 font-bold">🎁 ¡Gana 60 puntos extra por compartir!</p>
            <p class="text-xs text-amber-500/80 mt-1">Una vez por día</p>
          </div>
        </div>
        
        <div class="p-4 border-t border-border/20 bg-muted/20">
          <button onclick="closeShareModal()" class="w-full bg-muted hover:bg-muted/80 text-foreground py-3 rounded-lg text-sm font-medium transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    // Agregar estilos CSS mejorados
    const style = document.createElement('style');
    style.textContent = `
      .share-option-btn {
        @apply bg-card border border-border/20 rounded-xl p-4 text-center hover:bg-muted/50 transition-all duration-200 hover:scale-105 cursor-pointer;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .share-option-btn:hover {
        @apply border-primary/30 shadow-lg;
      }
      .share-option-btn:active {
        @apply scale-95;
      }
    `;
    document.head.appendChild(style);
    
    // Agregar funciones globales
    // Función para mostrar mensajes de éxito
    (window as any).showSuccessMessage = (message: string) => {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-60 transform translate-x-full transition-all duration-500 border border-green-400/20 backdrop-blur-sm';
      toast.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="text-2xl">🎉</div>
          <div class="font-semibold">${message}</div>
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.remove('translate-x-full');
        toast.classList.add('scale-105');
      }, 100);
      
      setTimeout(() => {
        toast.classList.remove('scale-105');
        toast.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    };
    
    (window as any).copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        (window as any).showSuccessMessage('¡Enlace copiado al portapapeles!');
        await giveShareBonus();
      } catch (err) {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        (window as any).showSuccessMessage('¡Enlace copiado al portapapeles!');
        await giveShareBonus();
      }
    };
    
    (window as any).shareToWhatsApp = async (text: string) => {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      (window as any).showSuccessMessage('¡Abriendo WhatsApp!');
      await giveShareBonus();
    };
    
    (window as any).shareToTwitter = async (text: string) => {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      (window as any).showSuccessMessage('¡Abriendo Twitter!');
      await giveShareBonus();
    };
    
         (window as any).shareToFacebook = async (_text: string) => {
       // Facebook tiene limitaciones con parámetros de texto, usar solo la URL
       const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`;
       window.open(url, '_blank');
       (window as any).showSuccessMessage('¡Abriendo Facebook! El texto se puede agregar manualmente.');
       await giveShareBonus();
     };
    
    (window as any).closeShareModal = () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    };
    
    document.body.appendChild(modal);
  };

  const giveShareBonus = async () => {
    try {
      const response = await fetch('/api/vote?action=share-bonus');
      if (response.ok) {
        const data = await response.json();
        (window as any).showSuccessMessage(`🎉 ${data.message}`);
        // Recargar puntos del usuario
        const pointsResponse = await fetch('/api/vote?action=points');
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setUserPoints(pointsData.availablePoints);
        }
        // Actualizar estado del bono
        setCanReceiveShareBonus(false);
      } else {
        const errorData = await response.json();
        if (!errorData.alreadyReceived) {
          console.log('Ya recibiste el bono hoy');
        }
        // Actualizar estado del bono
        setCanReceiveShareBonus(false);
      }
          } catch (bonusError) {
        console.error('Error dando bono:', bonusError);
      }
  };




  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="Casa Famosos"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg"
            />
            <button
              onClick={() => window.location.href = '/'}
              className="text-lg font-bold text-primary"
            >
              Inicio
            </button>
            <button
              onClick={() => window.location.href = '/muro'}
              className="text-lg font-bold text-foreground hover:text-primary transition-colors"
            >
              Muro
            </button>
          </div>

          {/* User Menu or Login Button */}
          {session ? (
            <div className="flex items-center space-x-3">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/30 transition-colors overflow-hidden"
                >
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Usuario'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Si la imagen falla, mostrar la inicial
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-primary text-sm font-bold ${session.user?.image ? 'hidden' : ''}`}>
                    {session.user?.name?.[0] || 'U'}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    {/* Overlay para cerrar el menú */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />

                    {/* Menú desplegable */}
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border/40 rounded-lg shadow-lg z-20">
                      <div className="p-3 border-b border-border/20">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user?.email}
                        </p>
                      </div>

                      <div className="py-2">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              window.location.href = '/admin';
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                          >
                            <span>👑</span>
                            <span>Panel Admin</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            window.location.href = '/perfil';
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                        >
                          <span>👤</span>
                          <span>Perfil</span>
                        </button>

                        <div className="border-t border-border/20 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              signOut({ callbackUrl: '/' });
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center space-x-2"
                          >
                            <span>🚪</span>
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        {loading ? (
          <div className="bg-card/50 rounded-xl p-4 border border-border/20 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-destructive font-medium">Error al cargar datos</h3>
                <p className="text-destructive/80 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm hover:bg-destructive/90 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : !votingData?.season ? (
          <div className="bg-muted/30 border border-border/40 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay temporada activa</h3>
            <p className="text-muted-foreground">Actualmente no hay ninguna temporada en curso. Vuelve más tarde.</p>
          </div>
                ) : !votingData?.week ? (
          <div className="bg-muted/30 border border-border/40 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay votación activa</h3>
            <p className="text-muted-foreground">
              Temporada: {votingData.season.name} ({votingData.season.year})
            </p>
            <p className="text-muted-foreground mt-2">No hay ninguna semana de votación activa en este momento.</p>
          </div>
        ) : null}

        {/* Countdown Timer */}
        {votingData?.week?.isActive && (
          <div className="bg-card rounded-xl p-4 border border-border/20">
            <h3 className="text-center text-muted-foreground text-sm font-medium mb-3">
              Votación cierra en:
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.days}</div>
                <div className="text-xs text-muted-foreground">Días</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.hours}</div>
                <div className="text-xs text-muted-foreground">Horas</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.minutes}</div>
                <div className="text-xs text-muted-foreground">Min</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.seconds}</div>
                <div className="text-xs text-muted-foreground">Seg</div>
              </div>
            </div>
          </div>
        )}

        {/* Vote Button o Estado de Votación */}
        {votingData?.week && (
          <>
            {votingData.week.isActive && votingData.week.status === 'voting' ? (
              <button
                onClick={handleVoteClick}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-lg glow hover:scale-105 transition-all duration-200 shadow-lg"
              >
                🗳️ VOTAR AHORA
              </button>
            ) : votingData.week.status === 'completed' ? (
              <div className="w-full bg-muted/30 border border-border/40 text-muted-foreground py-4 rounded-xl font-bold text-lg text-center">
                🔒 VOTACIONES CERRADAS
              </div>
            ) : (
              <div className="w-full bg-muted/30 border border-border/40 text-muted-foreground py-4 rounded-xl font-bold text-lg text-center">
                ⏳ VOTACIÓN NO DISPONIBLE
              </div>
            )}
          </>
        )}

        {/* Eliminated Candidate Section */}
        {votingData?.eliminatedCandidate && votingData.week.status === 'completed' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Candidato Expulsado</h2>
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20 shadow-lg">
                  {votingData.eliminatedCandidate.photo ? (
                    <Image 
                      src={votingData.eliminatedCandidate.photo} 
                      alt={votingData.eliminatedCandidate.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-2xl">😢</span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-red-600">
                      {votingData.eliminatedCandidate.name}
                    </h3>
                    <span className="text-red-500">💔</span>
                  </div>
                  <p className="text-red-600 font-medium mb-1">¡Ha sido expulsado de la casa!</p>
                  <p className="text-sm text-red-500/80">
                    Eliminado el {new Date(votingData.eliminatedCandidate.eliminatedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nominees List */}
        {votingData?.nominees && votingData.nominees.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Nominados</h2>
              <button
                onClick={handleRefresh}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                🔄
              </button>
            </div>
            
            {votingData.nominees
              .sort((a, b) => b.votes - a.votes)
              .map((nominee, index) => (
              <div key={nominee.id} className={`rounded-xl p-4 border vote-card ${
                index === 0 
                  ? '!bg-violet-600 !border-violet-700 shadow-lg' 
                  : 'bg-card border-border/20'
              }`}>
                <div className="flex items-center space-x-4">
                  {/* Position Badge */}
                  <div className={`position-badge ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg' 
                      : index === 1 
                        ? 'bg-gray-400' 
                        : index === 2 
                          ? 'bg-amber-600' 
                          : 'bg-muted'
                  }`}>
                    {index === 0 ? '👑' : `#${index + 1}`}
                  </div>
                  
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index === 0 
                      ? 'bg-gradient-to-br from-yellow-400/30 to-amber-500/30 avatar-glow shadow-lg' 
                      : 'bg-gradient-to-br from-primary/20 to-accent/20 avatar-glow'
                  }`}>
                    {nominee.photo ? (
                      <Image 
                        src={nominee.photo} 
                        alt={nominee.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      index === 0 
                        ? 'text-white font-bold' 
                        : 'text-foreground'
                    }`}>
                      {nominee.name}
                      {index === 0 && <span className="ml-2 text-yellow-300">🏆</span>}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2 progress-bar">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                          style={{ width: `${nominee.percentage}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm min-w-[3rem] ${
                        index === 0 ? 'text-white' : 'text-muted-foreground'
                      }`}>
                        {nominee.percentage}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Votes */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      index === 0 ? 'text-white' : 'text-primary'
                    }`}>
                      {nominee.votes.toLocaleString()}
                    </div>
                    <div className={`text-xs ${
                      index === 0 ? 'text-white' : 'text-muted-foreground'
                    }`}>
                      votos
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved Candidate Section */}
        {votingData?.savedCandidate && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Candidato Salvado</h2>
            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500/20 shadow-lg">
                  {votingData.savedCandidate.photo ? (
                    <Image 
                      src={votingData.savedCandidate.photo} 
                      alt={votingData.savedCandidate.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-2xl">🙏</span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-green-600">
                      {votingData.savedCandidate.name}
                    </h3>
                    <span className="text-green-500">🛡️</span>
                  </div>
                  <p className="text-green-600 font-medium mb-1">¡Ha sido salvado esta semana!</p>
                  <p className="text-sm text-green-500/80">
                    Salvado el {new Date(votingData.savedCandidate.savedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {votingData?.nominees && (
          <div className="bg-card rounded-xl p-4 border border-border/20">
            <h3 className="font-semibold text-foreground mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {votingData.totalVotes ? votingData.totalVotes.toLocaleString() : votingData.nominees.reduce((sum, n) => sum + n.votes, 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total de votos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{votingData.nominees.length}</div>
                <div className="text-xs text-muted-foreground">Nominados</div>
              </div>
            </div>
          </div>
        )}

        {/* Share App Banner - Al final de la página */}
        {session && votingData?.week && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              ¡Comparte esta APP y consigue 60 puntos extra!
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Invita a tus amigos a votar y obtén puntos extra para seguir participando
            </p>
            <button
              onClick={handleShareApp}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
            >
              📤 COMPARTIR APP
            </button>
          </div>
        )}

        {/* Redes Sociales */}
        {(socialMedia.whatsapp || socialMedia.telegram || socialMedia.twitter || socialMedia.facebook || socialMedia.instagram || socialMedia.tiktok) && (
          <div className="bg-card rounded-xl p-6 border border-border/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Grupos */}
              {(socialMedia.whatsapp || socialMedia.telegram) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground text-center md:text-left">
                    📱 Únete a los grupos
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    {socialMedia.whatsapp && (
                      <a
                        href={socialMedia.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>💚</span>
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {socialMedia.telegram && (
                      <a
                        href={socialMedia.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>💙</span>
                        <span>Telegram</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Redes Sociales */}
              {(socialMedia.twitter || socialMedia.facebook || socialMedia.instagram || socialMedia.tiktok) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground text-center md:text-left">
                    🌐 Sigue nuestras redes sociales
                  </h3>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                         {socialMedia.twitter && (
                       <a
                         href={socialMedia.twitter}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition-colors"
                         title="Twitter / X"
                       >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                         </svg>
                       </a>
                     )}
                     {socialMedia.facebook && (
                       <a
                         href={socialMedia.facebook}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                         title="Facebook"
                       >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                         </svg>
                       </a>
                     )}
                     {socialMedia.instagram && (
                       <a
                         href={socialMedia.instagram}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                         title="Instagram"
                       >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.875-.385-.875-.875s.385-.875.875-.875.875.385.875.875-.385.875-.875.875zm-7.83 9.781c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                         </svg>
                       </a>
                     )}
                     {socialMedia.tiktok && (
                       <a
                         href={socialMedia.tiktok}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition-colors"
                         title="TikTok"
                       >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                         </svg>
                       </a>
                     )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button - Oculto por ahora */}
      {/* <button
        onClick={handleChatClick}
        className="floating-button fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg glow hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
      >
        💬
      </button> */}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border/40">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h2>
              <p className="text-muted-foreground text-sm">
                Inicia sesión para votar por tus candidatos favoritos
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => signIn('google', { callbackUrl: votingData?.week?.isActive ? '/vote' : '/' })}
                className="w-full bg-white text-gray-800 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Continuar con Google</span>
              </button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Al continuar, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full mt-6 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md h-[600px] border border-border/40 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <h2 className="text-lg font-bold text-foreground">Chat en Vivo</h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
                         <div className="flex-1">
               <Chat isOpen={true} onClose={() => setShowChat(false)} />
             </div>
          </div>
        </div>
      )}
      
      <Footer />
    </main>
  );
}
