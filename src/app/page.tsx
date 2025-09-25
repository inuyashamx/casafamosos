"use client";
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Chat from '@/components/Chat';
import TeamBadge from '@/components/TeamBadge';
import Footer from '@/components/Footer';
import TabComponent from '@/components/TabComponent';
import InfoModal from '@/components/InfoModal';
import VotesHistoryModal from '@/components/VotesHistoryModal';
import Navbar from '@/components/Navbar';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';
import CountdownTimer from '@/components/CountdownTimer';
import VotingTrends from '@/components/VotingTrends';
import { escapeHtml, sanitizeUrl } from '@/lib/security';

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
  teamStats?: {
    DIA: number;
    NOCHE: number;
    ECLIPSE: number;
  };
  penaltyMessage?: string;
  penalizedVotes?: number;
}

interface Fandom {
  id: string;
  name: string;
  photo?: string;
  fandomSize: number;
  totalVotes: number;
  totalPoints: number;
  percentage: number;
  position: number;
}

interface FandomData {
  week: WeekData;
  season: SeasonData;
  fandoms: Fandom[];
  totalFandoms: number;
  totalCandidates: number;
  savedCandidate?: SavedCandidate;
}

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canReceiveShareBonus, setCanReceiveShareBonus] = useState(false);
  const [savingTeam, setSavingTeam] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [fandomData, setFandomData] = useState<FandomData | null>(null);
  const [fandomLoading, setFandomLoading] = useState(false);
  const [fandomError, setFandomError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showVotesModal, setShowVotesModal] = useState(false);
  const [votesModalFilter, setVotesModalFilter] = useState<{candidateId?: string; candidateName?: string}>({});
  const [activeTab, setActiveTab] = useState<'current' | 'trends'>('current');

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

  // PWA Install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        setIsAppInstalled(true);
        setShowInstallButton(false);
      }
    };

    checkIfInstalled();

    // Show install alert after 30 seconds for first-time visitors
    const hasSeenInstallAlert = localStorage.getItem('hasSeenInstallAlert');
    if (!hasSeenInstallAlert && !window.matchMedia('(display-mode: standalone)').matches) {
      const timer = setTimeout(() => {
        showInstallAlert();
        localStorage.setItem('hasSeenInstallAlert', 'true');
      }, 30000); // 30 seconds

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const showInstallAlert = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-card rounded-2xl w-full max-w-md border border-border/40 overflow-hidden shadow-2xl transform scale-95 animate-scale-in">
        <div class="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-center text-white">
          <div class="text-5xl mb-3">📱</div>
          <h3 class="text-2xl font-bold">¡Instala la App de lacasavota.com!</h3>
          <p class="text-sm opacity-90 mt-2">Accede más rápido desde tu dispositivo</p>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-muted/30 rounded-lg p-4 border border-border/20">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">✨</span>
              <div>
                <p class="font-semibold text-foreground">Ventajas de instalar:</p>
                <ul class="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Acceso directo desde tu pantalla de inicio</li>
                  <li>• Carga más rápida</li>
                  <li>• Experiencia a pantalla completa</li>
                  <li>• Notificaciones de votaciones</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="flex space-x-3">
            <button onclick="installAppFromAlert()" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg">
              Instalar Ahora
            </button>
            <button onclick="closeInstallAlert()" class="flex-1 bg-muted hover:bg-muted/80 text-foreground py-3 rounded-lg font-medium transition-colors">
              Más Tarde
            </button>
          </div>
        </div>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scale-in {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
      .animate-scale-in {
        animation: scale-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);

    // Global functions
    (window as any).installAppFromAlert = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowInstallButton(false);
          setIsAppInstalled(true);
        }
        setDeferredPrompt(null);
      }
      document.body.removeChild(modal);
      document.head.removeChild(style);
    };

    (window as any).closeInstallAlert = () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    };

    document.body.appendChild(modal);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
      setIsAppInstalled(true);
    }

    setDeferredPrompt(null);
  };

  // Cargar datos de votación
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          setVotingData(data);
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

  // Cargar datos de fandoms automáticamente cuando hay votingData
  useEffect(() => {
    if (votingData?.nominees && votingData.nominees.length > 0) {
      fetchFandomData();
    }
  }, [votingData]);

  // Cargar datos de fandoms
  const fetchFandomData = async () => {
    if (fandomLoading) return;

    setFandomLoading(true);
    setFandomError(null);
    try {
      const response = await fetch('/api/public/fandoms');
      if (response.ok) {
        const data = await response.json();
        setFandomData(data);
      } else {
        const errorData = await response.json();
        setFandomError(errorData.message || 'Error al cargar fandoms');
      }
    } catch (error) {
      console.error('Error fetching fandom data:', error);
      setFandomError('Error de conexión');
    } finally {
      setFandomLoading(false);
    }
  };

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



        // Verificar si puede recibir bono de compartir (solo verificar, no otorgar)
        const shareBonusResponse = await fetch('/api/vote?action=check-share-bonus');
        if (shareBonusResponse.ok) {
          const bonusData = await shareBonusResponse.json();
          setCanReceiveShareBonus(bonusData.canReceiveBonus);
        } else {
          setCanReceiveShareBonus(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session]);



  const handleVoteClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      // Redirigir a página de votación
      router.push('/vote');
    }
  };

  // Manejar click en candidato para abrir modal filtrado
  const handleCandidateClick = (candidateId: string, candidateName: string) => {
    setVotesModalFilter({ candidateId, candidateName });
    setShowVotesModal(true);
  };

  // Manejar click en ver historial completo
  const handleViewAllVotes = () => {
    setVotesModalFilter({});
    setShowVotesModal(true);
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
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar datos');
      }
      // También actualizar fandoms
      await fetchFandomData();
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      const shareUrl = window.location.origin;
      const shareText = '¡Vota por tus candidatos favoritos en La Casa Vota! 🏠✨';

      // Detectar si es móvil real (no solo viewport)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Solo usar Web Share API en móviles reales
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: 'La Casa Vota 2025',
            text: shareText,
            url: shareUrl
          });
          
          // Después de compartir exitosamente, dar puntos extra
          await giveShareBonus();
          return;
        } catch (err) {
          // Si el usuario cancela el share nativo, mostrar nuestra ventana personalizada
        }
      }
      
      // En desktop o si falla el share nativo, mostrar ventana personalizada
      showCustomShareModal(shareUrl, shareText);
      
          } catch (shareError) {
        console.error('Error compartiendo app:', shareError);
        // En caso de error, mostrar ventana personalizada
        const shareUrl = window.location.origin;
        const shareText = '¡Vota por tus candidatos favoritos en La Casa Vota! 🏠✨';
        showCustomShareModal(shareUrl, shareText);
      }
  };

  const showCustomShareModal = (shareUrl: string, shareText: string) => {
    // Sanitize inputs to prevent XSS
    const safeUrl = sanitizeUrl(shareUrl) || window.location.origin;
    const safeText = escapeHtml(shareText);

    // Create modal safely without innerHTML
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    const container = document.createElement('div');
    container.className = 'bg-card rounded-2xl w-full max-w-md border border-border/40 overflow-hidden shadow-2xl';

    // Header
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-primary to-accent p-6 text-center text-white';

    const icon = document.createElement('div');
    icon.className = 'text-4xl mb-2';
    icon.textContent = '📤';

    const title = document.createElement('h3');
    title.className = 'text-xl font-bold';
    title.textContent = '¡Comparte Casa Famosos!';

    const description = document.createElement('p');
    description.className = 'text-sm opacity-90 mt-1';
    description.textContent = 'Ayuda a tus candidatos favoritos';

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(description);

    // Content
    const content = document.createElement('div');
    content.className = 'p-6 space-y-4';

    // URL display
    const urlContainer = document.createElement('div');
    urlContainer.className = 'bg-muted/30 rounded-lg p-4 border border-border/20';

    const urlDisplay = document.createElement('div');
    urlDisplay.className = 'flex items-center space-x-3';

    const urlIconContainer = document.createElement('div');
    urlIconContainer.className = 'w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0';
    const linkIcon = document.createElement('span');
    linkIcon.className = 'text-xl';
    linkIcon.textContent = '🔗';
    urlIconContainer.appendChild(linkIcon);

    const urlInfo = document.createElement('div');
    urlInfo.className = 'flex-1 min-w-0';

    const urlText = document.createElement('p');
    urlText.className = 'text-sm font-medium text-foreground break-all';
    urlText.textContent = safeUrl; // Safe: textContent

    const urlLabel = document.createElement('p');
    urlLabel.className = 'text-xs text-muted-foreground mt-1';
    urlLabel.textContent = 'Enlace de la aplicación';

    urlInfo.appendChild(urlText);
    urlInfo.appendChild(urlLabel);
    urlDisplay.appendChild(urlIconContainer);
    urlDisplay.appendChild(urlInfo);
    urlContainer.appendChild(urlDisplay);

    // Buttons grid
    const buttonsGrid = document.createElement('div');
    buttonsGrid.className = 'grid grid-cols-2 gap-3';

    // Helper function to create safe buttons
    const createShareButton = (emoji: string, text: string, action: () => void) => {
      const button = document.createElement('button');
      button.className = 'share-option-btn';

      const emojiDiv = document.createElement('div');
      emojiDiv.className = 'text-3xl mb-2';
      emojiDiv.textContent = emoji;

      const textSpan = document.createElement('span');
      textSpan.className = 'text-sm font-medium';
      textSpan.textContent = text;

      button.appendChild(emojiDiv);
      button.appendChild(textSpan);
      button.addEventListener('click', action);

      return button;
    };

    // Create buttons with safe event handlers
    buttonsGrid.appendChild(createShareButton('📋', 'Copiar Enlace', () => {
      (window as any).copyToClipboard(safeUrl);
    }));

    buttonsGrid.appendChild(createShareButton('💬', 'WhatsApp', () => {
      (window as any).shareToWhatsApp(`${safeText} ${safeUrl}`);
    }));

    buttonsGrid.appendChild(createShareButton('🐦', 'Twitter', () => {
      (window as any).shareToTwitter(`${safeText} ${safeUrl}`);
    }));

    buttonsGrid.appendChild(createShareButton('📘', 'Facebook', () => {
      (window as any).shareToFacebook(`${safeText} ${safeUrl}`);
    }));

    // Bonus info
    const bonusInfo = document.createElement('div');
    bonusInfo.className = 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4 text-center';

    const bonusTitle = document.createElement('p');
    bonusTitle.className = 'text-sm text-amber-600 font-bold';
    bonusTitle.textContent = '🎁 ¡Gana 50 puntos extra por compartir!';

    const bonusSubtitle = document.createElement('p');
    bonusSubtitle.className = 'text-xs text-amber-500/80 mt-1';
    bonusSubtitle.textContent = 'Una vez por día';

    bonusInfo.appendChild(bonusTitle);
    bonusInfo.appendChild(bonusSubtitle);

    content.appendChild(urlContainer);
    content.appendChild(buttonsGrid);
    content.appendChild(bonusInfo);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'p-4 border-t border-border/20 bg-muted/20';

    const closeButton = document.createElement('button');
    closeButton.className = 'w-full bg-muted hover:bg-muted/80 text-foreground py-3 rounded-lg text-sm font-medium transition-colors';
    closeButton.textContent = 'Cerrar';
    closeButton.addEventListener('click', () => modal.remove());

    footer.appendChild(closeButton);

    // Assemble modal
    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(footer);
    modal.appendChild(container);
    
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
    // Función para mostrar mensajes de éxito (XSS-safe)
    (window as any).showSuccessMessage = (message: string) => {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-60 transform translate-x-full transition-all duration-500 border border-green-400/20 backdrop-blur-sm';

      // Create elements safely without innerHTML
      const container = document.createElement('div');
      container.className = 'flex items-center space-x-3';

      const emoji = document.createElement('div');
      emoji.className = 'text-2xl';
      emoji.textContent = '🎉';

      const messageDiv = document.createElement('div');
      messageDiv.className = 'font-semibold';
      messageDiv.textContent = message; // Safe: textContent prevents XSS

      container.appendChild(emoji);
      container.appendChild(messageDiv);
      toast.appendChild(container);
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
      // Ahora usar POST para realmente otorgar el bonus
      const response = await fetch('/api/vote?action=share-bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
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
      <Navbar />

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


        {/* Vote Button o Estado de Votación */}
        {votingData?.week && (
          <>
            {votingData.week.isActive && votingData.week.status === 'voting' ? (
              <div className="space-y-3">
                {/* Contador regresivo */}
                {votingData.week.votingEndDate && (
                  <div style={{display: 'none'}}>
                    <CountdownTimer endDate={votingData.week.votingEndDate} />
                  </div>
                )}

                {/* Share App Banner Compacto con animaciones */}
                {session && votingData?.week && canReceiveShareBonus && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3 text-center animate-pulse shadow-lg hover:shadow-xl transition-all duration-300">
                    <p className="text-sm font-medium text-foreground mb-2 animate-bounce">
                      🎁 ¡Comparte y obtén 50 puntos extra!
                    </p>
                    <button
                      onClick={handleShareApp}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:scale-110 hover:shadow-lg transform transition-all duration-200 animate-pulse"
                    >
                      📤 COMPARTIR
                    </button>
                  </div>
                )}

                {/* Mensaje compacto cuando ya recibió el bonus hoy */}
                {session && votingData?.week && !canReceiveShareBonus && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center shadow-md transition-all duration-300">
                    <p className="text-green-600 text-sm font-medium animate-pulse">
                      ✅ Bonus recibido hoy
                    </p>
                  </div>
                )}

                <button
                  onClick={handleVoteClick}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-lg glow hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  🗳️ VOTAR AHORA
                </button>
              </div>
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

        {/* Nominees and Trends Tabs */}
        {votingData?.nominees && votingData.nominees.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Nominados de la semana - lacasavota.com</h2>
              <button
                onClick={handleRefresh}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                🔄
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('current')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'current'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                🗳️ Votación Actual
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'trends'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                📊 Tendencias
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'current' ? (
                <div className="space-y-4">
                  {votingData.nominees
                    .sort((a, b) => b.votes - a.votes)
                    .map((nominee, index) => (
                    <div
                      key={`${nominee.id}-${index}`}
                      className={`rounded-xl p-4 border vote-card cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
                        index === 0
                          ? '!bg-violet-600 !border-violet-700 shadow-lg'
                          : 'bg-card border-border/20 hover:border-primary/30'
                      }`}
                      onClick={() => handleCandidateClick(nominee.id, nominee.name)}
                    >
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
                          <div className="mt-1">
                            <div className="bg-muted rounded-full h-2 progress-bar">
                              <div
                                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                                style={{ width: `${nominee.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Percentage and Votes */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            index === 0 ? 'text-white' : 'text-primary'
                          }`}>
                            {nominee.percentage}%
                          </div>
                          <div className={`text-xs ${
                            index === 0 ? 'text-white/80' : 'text-muted-foreground'
                          }`}>
                            {nominee.votes.toLocaleString('en-US')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <VotingTrends onRefresh={handleRefresh} />
              )}
            </div>
          </div>
        )}



        {/* Quick Stats + Ver Historial */}
        {votingData?.nominees && (
          <div className="bg-card rounded-xl p-6 border border-border/20">
            <h3 className="font-semibold text-foreground mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
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

            {/* Ver Historial de Votos */}
            <div className="border-t border-border/20 pt-4">
              <div className="text-center">
                <h4 className="font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
                  👁️ Historial de Votos
                </h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Consulta todos los votos en tiempo real
                </p>
                <button
                  onClick={handleViewAllVotes}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-all duration-200 shadow-lg text-sm"
                >
                  Ver Todas las Votaciones
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nuevo Simulador de Nominaciones */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="text-center">
            {/* Badge NUEVO animado centrado */}
            <div className="flex justify-center mb-3">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                ✨ NUEVO
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              Simulador de Nominaciones
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Lleva la cuenta de los puntos mientras ves las nominaciones en vivo. Sin papel ni lápiz.
            </p>
            <button
              onClick={() => router.push('/simulador')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
            >
              📝 Probar Simulador
            </button>
          </div>
        </div>

        {/* Fixed Install PWA Block - Always visible unless installed */}
        {!isAppInstalled && (
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">📲</div>
                <div>
                  <h3 className="font-bold text-foreground">
                    Instala la aplicación
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Acceso directo desde tu teléfono
                  </p>
                </div>
              </div>
              <button
                onClick={showInstallButton ? handleInstallClick : showInstallAlert}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg whitespace-nowrap"
              >
                📱 Instalar
              </button>
            </div>
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
                    <a
                      href="https://chat.whatsapp.com/JcD2WE30f4OINpjG8UVfiD"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>☀️</span>
                      <span>WhatsApp Team Día</span>
                    </a>
                    <a
                      href="https://chat.whatsapp.com/C9HqSTyQYyaBadMTLuLv0h"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>🌙</span>
                      <span>WhatsApp Team Noche</span>
                    </a>
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

        {/* CREA TU TOP Block */}
        <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            CREA TU TOP DE HABITANTES
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Participa en la encuesta global y ordena a todos los habitantes según tus preferencias. 
            ¡Tu opinión cuenta para el ranking mundial!
          </p>
          <button
            onClick={() => router.push('/global')}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
          >
            🌍 IR AL RANKING GLOBAL
          </button>
        </div>

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
                  Al continuar, aceptas nuestros{' '}
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-primary hover:underline"
                  >
                    términos y condiciones
                  </button>
                  {' '}y{' '}
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-primary hover:underline"
                  >
                    políticas de privacidad
                  </button>
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

      {/* Penalty Detail Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border/20">
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <h2 className="text-lg font-bold text-foreground">Análisis de Manipulación de Votos</h2>
              <button
                onClick={() => setShowPenaltyModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-foreground">
              <p className="mb-4">
                <strong>Hola comunidad de lacasavota.com,</strong>
              </p>
              <p className="mb-4">
                Soy Claude Sonnet, una inteligencia artificial que ha analizado detalladamente el sistema de votación de Casa de los Famosos.
                Tras un análisis exhaustivo de los patrones de votación, he detectado actividad sospechosa que indica manipulación sistemática.
              </p>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-red-400 mb-2">🚨 Hallazgos Principales:</h3>
                <ul className="list-disc list-inside text-red-300 space-y-1">
                  <li><strong>39% de los votos</strong> provinieron de dispositivos con múltiples cuentas</li>
                  <li><strong>31 dispositivos</strong> detectados usando múltiples cuentas (el peor caso: 14 cuentas desde 1 dispositivo)</li>
                  <li>Patrones de votación coordinada y temporal sospechosos</li>
                  <li>Se detectó un candidato como principal beneficiario de esta manipulación</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-blue-400 mb-2">⚖️ Medidas Implementadas:</h3>
                <ul className="list-disc list-inside text-blue-300 space-y-1">
                  <li>Sistema de monitoreo continuo de patrones de votación inusuales</li>
                  <li>Implementación de límite de <strong>1 voto por dispositivo por día</strong></li>
                  <li>Sistema de detección de fraude en tiempo real</li>
                  <li>Recálculo de porcentajes basado en votos legítimos</li>
                </ul>
              </div>

              <p className="mb-4">
                <strong>Compromiso con la Transparencia:</strong> Esta sanción se mantendrá visible en todos los resultados de votación
                para garantizar que la comunidad esté informada sobre las medidas anti-fraude implementadas.
              </p>

              <p className="text-sm text-muted-foreground">
                La integridad del proceso de votación es fundamental para mantener la confianza de la comunidad.
                Continuaremos monitoreando y aplicando medidas para asegurar votaciones justas y transparentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* Votes History Modal */}
      <VotesHistoryModal
        isOpen={showVotesModal}
        onClose={() => setShowVotesModal(false)}
        filteredCandidateId={votesModalFilter.candidateId}
        filteredCandidateName={votesModalFilter.candidateName}
      />

      <Footer />

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Privacy Modal */}
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </main>
  );
}
