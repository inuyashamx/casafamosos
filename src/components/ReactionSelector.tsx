"use client";
import { useState, useRef, useEffect } from 'react';

interface ReactionSelectorProps {
  onReact: (reactionType: string) => void;
  currentUserReaction?: string | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const reactions = [
  { type: 'like', emoji: '❤️', label: 'Me gusta' },
  { type: 'laugh', emoji: '😂', label: 'Me divierte' },
  { type: 'angry', emoji: '😠', label: 'Me enoja' },
  { type: 'wow', emoji: '😮', label: 'Me asombra' },
  { type: 'sad', emoji: '😢', label: 'Me entristece' },
  { type: 'poop', emoji: '💩', label: 'Caca' },
];

export default function ReactionSelector({
  onReact,
  currentUserReaction,
  isOpen,
  onClose,
  triggerRef,
}: ReactionSelectorProps) {
  const selectorRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const selectorWidth = 280; // Ancho aproximado del selector
      const selectorHeight = 60; // Alto aproximado del selector

      let left = rect.left + rect.width / 2 - selectorWidth / 2;
      let top = rect.top - selectorHeight - 10;

      // Ajustar si se sale de los límites de la ventana
      if (left < 10) left = 10;
      if (left + selectorWidth > window.innerWidth - 10) {
        left = window.innerWidth - selectorWidth - 10;
      }

      // Si no hay espacio arriba, mostrar abajo
      if (top < 10) {
        top = rect.bottom + 10;
      }

      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Usar click para evitar conflicto con mousedown de los botones
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;


  return (
    <div
      ref={selectorRef}
      className="fixed z-50 bg-card border border-border/40 rounded-full shadow-xl px-3 py-2 flex items-center gap-1 animate-in fade-in zoom-in duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.type}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onReact(reaction.type);
            setTimeout(() => onClose(), 50);
          }}
          className={`
            relative group transition-all duration-200 hover:scale-125 p-2 rounded-full
            ${currentUserReaction === reaction.type
              ? 'bg-primary/20 scale-110'
              : 'hover:bg-muted/50'
            }
          `}
          title={reaction.label}
        >
          <span className="text-2xl">{reaction.emoji}</span>

          {/* Tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {reaction.label}
          </span>
        </button>
      ))}
    </div>
  );
}