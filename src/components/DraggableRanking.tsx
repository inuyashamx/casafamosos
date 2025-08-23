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
    
    // Notificar cambio inicial
    const initialRankings = ordered.map(candidate => ({
      candidateId: candidate._id
    }));
    onRankingChange(initialRankings);
  }, [candidates, initialRanking, onRankingChange]);

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

  // Arrow button functions
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

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';  
    if (position === 3) return '🥉';
    return position.toString();
  };

  const getCardStyle = (index: number) => {
    if (index === 0) {
      return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700';
    } else if (index === 1) {
      return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 dark:from-gray-800/20 dark:to-slate-800/20 dark:border-gray-600';
    } else if (index === 2) {
      return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-700';
    } else {
      return 'bg-card dark:bg-card border-border';
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
        </div>
        
        <div className="text-sm text-muted-foreground">
          {orderedCandidates.length} candidatos
        </div>
      </div>

      {/* Lista de candidatos con botones de flecha */}
      <div className="space-y-3">
        {orderedCandidates.map((candidate, index) => {
          const position = index + 1;
          
          return (
            <div
              key={candidate._id}
              className={`
                ${getCardStyle(index)}
                border rounded-xl p-4 
                transition-all duration-200 
                flex items-center space-x-4
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

              {/* Botones de flecha grandes y visibles */}
              <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                {/* Flecha arriba */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveUp(index);
                  }}
                  disabled={index === 0}
                  className={`
                    w-16 h-12 rounded-xl flex items-center justify-center transition-all
                    border-2 font-semibold text-sm
                    ${index === 0 
                      ? 'text-muted-foreground/50 cursor-not-allowed bg-muted/20 border-muted/30' 
                      : 'text-primary bg-primary/5 border-primary/20 hover:text-white hover:bg-primary hover:border-primary active:bg-primary/90 active:scale-95 shadow-sm hover:shadow-md'
                    }
                    touch-manipulation
                  `}
                  title="Mover arriba"
                >
                  <div className="flex flex-col items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                      <path d="M7 14l5-5 5 5z"/>
                    </svg>
                    <span className="text-xs">SUBIR</span>
                  </div>
                </button>
                
                {/* Flecha abajo */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveDown(index);
                  }}
                  disabled={index === orderedCandidates.length - 1}
                  className={`
                    w-16 h-12 rounded-xl flex items-center justify-center transition-all
                    border-2 font-semibold text-sm
                    ${index === orderedCandidates.length - 1
                      ? 'text-muted-foreground/50 cursor-not-allowed bg-muted/20 border-muted/30' 
                      : 'text-primary bg-primary/5 border-primary/20 hover:text-white hover:bg-primary hover:border-primary active:bg-primary/90 active:scale-95 shadow-sm hover:shadow-md'
                    }
                    touch-manipulation
                  `}
                  title="Mover abajo"
                >
                  <div className="flex flex-col items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                    <span className="text-xs">BAJAR</span>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje explicativo */}
      <div className="text-center text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
        💡 Usa los botones SUBIR/BAJAR para reordenar tu ranking
      </div>
    </div>
  );
}