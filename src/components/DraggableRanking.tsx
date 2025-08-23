"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Candidate {
  _id: string;
  name: string;
  photo?: string;
  bio?: string;
  profession?: string;
}

interface RankingItem {
  candidateId: string;
  position: number;
}

interface DraggableRankingProps {
  candidates: Candidate[];
  initialRanking?: RankingItem[];
  onRankingChange: (rankings: { candidateId: string }[]) => void;
  onSave: (rankings: { candidateId: string }[]) => Promise<void>;
  saving: boolean;
}

export default function DraggableRanking({ 
  candidates, 
  initialRanking, 
  onRankingChange, 
  onSave,
  saving 
}: DraggableRankingProps) {
  const [orderedCandidates, setOrderedCandidates] = useState<Candidate[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Inicializar orden de candidatos
  useEffect(() => {
    if (candidates.length === 0) return;

    const ordered = [...candidates];
    
    if (initialRanking && initialRanking.length > 0) {
      // Crear un mapa de ID a posición
      const rankingMap = new Map();
      initialRanking.forEach(r => {
        const id = typeof r.candidateId === 'string' ? r.candidateId : (r.candidateId as any)?._id;
        rankingMap.set(id, r.position);
      });
      
      // Ordenar candidatos según el ranking guardado
      ordered.sort((a, b) => {
        const posA = rankingMap.get(a._id) || 999;
        const posB = rankingMap.get(b._id) || 999;
        return posA - posB;
      });
    }
    
    setOrderedCandidates(ordered);
  }, [candidates, initialRanking]);

  // Auto-save con debounce
  useEffect(() => {
    if (hasChanges && orderedCandidates.length > 0 && !isAutoSaving) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      const timeout = setTimeout(async () => {
        setIsAutoSaving(true);
        try {
          const rankings = orderedCandidates.map(candidate => ({
            candidateId: candidate._id
          }));
          onRankingChange(rankings);
          await onSave(rankings);
          setHasChanges(false);
        } catch (error) {
          console.error('Error auto-saving:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }, 2000); // Auto-save después de 2 segundos sin cambios
      
      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [hasChanges, orderedCandidates, isAutoSaving]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    // Añadir haptic feedback en dispositivos móviles
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Touch events for mobile
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Add non-passive event listeners to prevent scrolling during drag
  useEffect(() => {
    const handleTouchMoveNonPassive = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMoveNonPassive, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMoveNonPassive);
    };
  }, [isDragging]);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartX(touch.clientX);
    setDraggedIndex(index);
    setIsDragging(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartX === null || draggedIndex === null) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const currentX = touch.clientX;
    const deltaY = Math.abs(currentY - touchStartY);
    const deltaX = Math.abs(currentX - touchStartX);
    
    // Start dragging if there's any movement
    if ((deltaY > 5 || deltaX > 5) || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        const cardElement = element.closest('[data-candidate-index]');
        if (cardElement) {
          const index = parseInt(cardElement.getAttribute('data-candidate-index') || '0');
          setDragOverIndex(index);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
        const newOrder = [...orderedCandidates];
        const draggedItem = newOrder[draggedIndex];
        
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(dragOverIndex, 0, draggedItem);
        
        setOrderedCandidates(newOrder);
        setHasChanges(true);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartY(null);
    setTouchStartX(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Arrow button functions for mobile
  const moveUp = (index: number) => {
    if (index === 0) return; // Already at top
    
    const newOrder = [...orderedCandidates];
    const item = newOrder[index];
    
    newOrder.splice(index, 1);
    newOrder.splice(index - 1, 0, item);
    
    setOrderedCandidates(newOrder);
    setHasChanges(true);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const moveDown = (index: number) => {
    if (index === orderedCandidates.length - 1) return; // Already at bottom
    
    const newOrder = [...orderedCandidates];
    const item = newOrder[index];
    
    newOrder.splice(index, 1);
    newOrder.splice(index + 1, 0, item);
    
    setOrderedCandidates(newOrder);
    setHasChanges(true);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...orderedCandidates];
    const draggedItem = newOrder[draggedIndex];
    
    // Remover el elemento arrastrado
    newOrder.splice(draggedIndex, 1);
    
    // Insertar en la nueva posición
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setOrderedCandidates(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setHasChanges(true);
    
    // Haptic feedback al soltar
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const getCardStyle = (index: number) => {
    const position = index + 1;
    
    if (position === 1) {
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 min-h-[100px]';
    } else if (position === 2) {
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50 min-h-[95px]';
    } else if (position === 3) {
      return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50 min-h-[90px]';
    } else if (position <= 5) {
      return 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/40 min-h-[85px]';
    } else {
      return 'bg-card border-border/20 min-h-[80px]';
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      case 4:
      case 5: return '🏅';
      default: return `${position}°`;
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-muted-foreground">Cargando candidatos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicador de estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {(saving || isAutoSaving) && (
            <div className="flex items-center space-x-2 text-primary text-sm">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Guardando...</span>
            </div>
          )}
          {hasChanges && !saving && !isAutoSaving && (
            <div className="flex items-center space-x-2 text-yellow-500 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Cambios pendientes...</span>
            </div>
          )}
          {!hasChanges && !saving && !isAutoSaving && (
            <div className="flex items-center space-x-2 text-green-500 text-sm">
              <span>✓</span>
              <span>Guardado</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de candidatos arrastrables */}
      <div className="space-y-3">
        {orderedCandidates.map((candidate, index) => {
          const position = index + 1;
          const isBeingDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          
          return (
            <div
              key={candidate._id}
              data-candidate-index={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
              className={`
                ${getCardStyle(index)}
                ${isBeingDragged ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                ${isDragOver ? 'ring-2 ring-primary' : ''}
                border rounded-xl p-4 cursor-grab active:cursor-grabbing
                transition-all duration-200 hover:scale-105 hover:shadow-lg
                flex items-center space-x-4 touch-manipulation
              `}
            >
              {/* Número de posición */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {getPositionIcon(position)}
                </span>
              </div>

              {/* Foto del candidato */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted">
                {candidate.photo ? (
                  <Image
                    src={candidate.photo}
                    alt={candidate.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    👤
                  </div>
                )}
              </div>

              {/* Información del candidato */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {candidate.name}
                </h3>
                {candidate.profession && (
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.profession}
                  </p>
                )}
              </div>

              {/* Botones de flecha para reordenar */}
              <div className="flex-shrink-0 flex flex-col items-center space-y-1">
                {/* Flecha arriba */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveUp(index);
                  }}
                  disabled={index === 0}
                  className={`
                    w-12 h-10 rounded-lg flex items-center justify-center transition-all
                    ${index === 0 
                      ? 'text-muted-foreground/50 cursor-not-allowed bg-muted/20' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 active:scale-95'
                    }
                    touch-manipulation
                  `}
                  title="Mover arriba"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                </button>
                
                {/* Flecha abajo */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveDown(index);
                  }}
                  disabled={index === orderedCandidates.length - 1}
                  className={`
                    w-12 h-10 rounded-lg flex items-center justify-center transition-all
                    ${index === orderedCandidates.length - 1
                      ? 'text-muted-foreground/50 cursor-not-allowed bg-muted/20' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 active:scale-95'
                    }
                    touch-manipulation
                  `}
                  title="Mover abajo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instrucciones */}
      <div className="text-center text-sm text-muted-foreground mt-6 p-4 bg-muted/20 rounded-lg">
        <p>📱 <strong>Móvil:</strong> Mantén presionado y arrastra</p>
        <p>🖱️ <strong>Desktop:</strong> Haz clic y arrastra</p>
        <p>💾 Se guarda automáticamente después de cada cambio</p>
      </div>
    </div>
  );
}