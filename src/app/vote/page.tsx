"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import TeamBadge from '@/components/TeamBadge';
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
}

interface SeasonData {
  id: string;
  name: string;
  year: number;
}

interface VotingData {
  nominees: Nominee[];
  week: WeekData;
  season: SeasonData;
  savedCandidate?: {
    id: string;
    name: string;
    photo?: string;
    savedAt: string;
  };
}

interface UserVotes {
  [candidateId: string]: number;
}

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canReceiveShareBonus, setCanReceiveShareBonus] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Cargar datos de votación
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          setVotingData(data);

          // Inicializar votos del usuario en 0 (excluyendo salvado por seguridad)
          const initialVotes: UserVotes = {};
          const savedId = data?.savedCandidate?.id;
          data.nominees
            .filter((n: Nominee) => !savedId || n.id !== savedId)
            .forEach((nominee: Nominee) => {
              initialVotes[nominee.id] = 0;
            });
          setUserVotes(initialVotes);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error al cargar datos');
        }
      } catch (err) {
        console.error('Error fetching voting data:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPoints = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/vote?action=points');
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.availablePoints);
        }
      } catch (err) {
        console.error('Error fetching user points:', err);
      }
    };

    const checkShareBonus = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/vote?action=check-share-bonus');
        if (response.ok) {
          const data = await response.json();
          setCanReceiveShareBonus(data.canReceiveBonus);
        }
      } catch (err) {
        console.error('Error checking share bonus:', err);
      }
    };

    fetchVotingData();
    fetchUserPoints();
    checkShareBonus();
  }, [session]);


  // Calcular puntos usados
  const usedPoints = Object.values(userVotes).reduce((sum, points) => sum + points, 0);
  const remainingPoints = userPoints - usedPoints;

  // Función para actualizar votos
  const updateVote = (candidateId: string, points: number) => {
    const newPoints = Math.max(0, points);
    const currentUsed = usedPoints - userVotes[candidateId];
    const newUsed = currentUsed + newPoints;
    
    if (newUsed <= userPoints) {
      setUserVotes(prev => ({
        ...prev,
        [candidateId]: newPoints
      }));
    }
  };

  // Función para agregar puntos rápidamente
  const addQuickPoints = (candidateId: string, points: number) => {
    const currentPoints = userVotes[candidateId] || 0;
    const newPoints = currentPoints + points;
    updateVote(candidateId, newPoints);
  };



  // Función para enviar votos
  const submitVotes = async () => {
    if (usedPoints === 0) {
      setError('Debes asignar al menos un punto para poder votar');
      return;
    }

    if (usedPoints > userPoints) {
      setError('No tienes suficientes puntos disponibles');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const votes = Object.entries(userVotes)
        .filter(([_candidateId, points]) => points > 0)
        .filter(([candidateId]) => !votingData?.savedCandidate?.id || candidateId !== votingData.savedCandidate.id)
        .map(([candidateId, points]) => ({
          candidateId,
          points
        }));

      // Ya no enviamos fingerprint ni timeOnPage
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          votes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar votos');
      }

      // Redirigir a la página principal con mensaje de éxito
      router.push('/?message=voted');
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting votes:', err);
    } finally {
      setSubmitting(false);
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
    // Create safe modal structure (same as page.tsx)
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

  if (!session) {
    return null; // Será redirigido
  }

  if (error && !votingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!votingData?.week?.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay votación activa</h3>
          <p className="text-muted-foreground">No hay ninguna semana de votación activa en este momento.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-destructive">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-destructive hover:text-destructive/80"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Available Points */}
        <div className="bg-card rounded-xl p-4 border border-border/20">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{remainingPoints}</div>
            <div className="text-sm text-muted-foreground">puntos disponibles</div>
          </div>
        </div>

        {/* Share Bonus Banner - Solo si puede recibir el bonus */}
        {canReceiveShareBonus && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-600 mb-3">
              🎁 Obtén 50 puntos extra compartiendo
            </p>
            <button
              onClick={handleShareApp}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md"
            >
              📤 Compartir y ganar 50 pts
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Distribuye tus puntos</h2>
          <p className="text-muted-foreground text-sm">
            Esta votación NO es oficial, para votos reales ve al sitio oficial de VIX
          </p>
        </div>

        {/* Candidates (filtrados por seguridad en cliente) */}
        <div className="space-y-4">
          {votingData?.nominees
            .filter((nominee) => !votingData?.savedCandidate?.id || nominee.id !== votingData.savedCandidate.id)
            .map((nominee) => (
            <div key={nominee.id} className="bg-card rounded-xl p-4 border border-border/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {nominee.photo ? (
                    <Image
                      src={nominee.photo}
                      alt={nominee.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground text-lg">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{nominee.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {nominee.votes.toLocaleString()} votos actuales
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {userVotes[nominee.id] || 0} pts
                  </div>
                </div>
              </div>

              {/* Vote Controls */}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <button
                  onClick={() => updateVote(nominee.id, (userVotes[nominee.id] || 0) - 1)}
                  disabled={!userVotes[nominee.id] || userVotes[nominee.id] === 0}
                  className="w-10 h-10 bg-muted text-muted-foreground rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <div className="w-16 h-10 bg-input border border-border rounded-lg flex items-center justify-center">
                  <span className="font-medium text-foreground">
                    {userVotes[nominee.id] || 0}
                  </span>
                </div>
                <button
                  onClick={() => updateVote(nominee.id, (userVotes[nominee.id] || 0) + 1)}
                  disabled={remainingPoints <= 0}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <button
                  onClick={() => updateVote(nominee.id, 0)}
                  disabled={!userVotes[nominee.id] || userVotes[nominee.id] === 0}
                  className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Resetear puntos"
                >
                  ↺
                </button>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => addQuickPoints(nominee.id, 5)}
                  disabled={remainingPoints < 5}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +5
                </button>
                <button
                  onClick={() => addQuickPoints(nominee.id, 10)}
                  disabled={remainingPoints < 10}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +10
                </button>
                <button
                  onClick={() => addQuickPoints(nominee.id, 20)}
                  disabled={remainingPoints < 20}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +20
                </button>
                <button
                  onClick={() => addQuickPoints(nominee.id, 50)}
                  disabled={remainingPoints < 50}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +50
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/40 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Puntos disponibles:</span>
            <span className="font-bold text-primary ml-1">{remainingPoints}</span>
          </div>
          <button
            onClick={submitVotes}
            disabled={submitting || usedPoints === 0}
            className="bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : `Votar (${usedPoints} pts)`}
          </button>
        </div>
      </div>
    </main>
  );
} 