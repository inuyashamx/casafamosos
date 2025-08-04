"use client";
import { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Emojis organizados por categorías
const emojiCategories = {
  'Caras': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
    '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
  ],
  'Corazones': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
  ],
  'Gestos': [
    '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
    '🖖', '👏', '🙌', '🤝', '🙏', '✊', '👊', '🤛', '🤜', '💪'
  ],
  'Actividades': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'
  ],
  'Objetos': [
    '⚡', '🔥', '💥', '⭐', '🌟', '✨', '💫', '💢', '💨', '💦',
    '💤', '🎉', '🎊', '🎈', '🎁', '🎀', '🎗️', '🎟️', '🎫', '🎯',
    '🎲', '🎮', '🕹️', '🎰', '🎳', '🎪', '🎭', '🎨', '🎬', '🎤'
  ],
  'Símbolos': [
    '❗', '❓', '❕', '❔', '‼️', '⁉️', '💯', '🔴', '🟠', '🟡',
    '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹',
    '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️'
  ]
};

export default function EmojiPicker({ onEmojiSelect, isOpen, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('Caras');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Picker */}
      <div className="fixed inset-x-0 top-0 z-50 p-4">
        <div
          ref={pickerRef}
          className="bg-card border border-border/40 rounded-xl shadow-2xl p-4 w-full max-w-md mx-auto max-h-80 overflow-hidden animate-in slide-in-from-top-4 duration-200"
        >
        {/* Categorías */}
        <div className="flex space-x-1 mb-3 overflow-x-auto pb-2 justify-center">
          {Object.keys(emojiCategories).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emojis */}
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-48 overflow-y-auto">
          {emojiCategories[activeCategory as keyof typeof emojiCategories].map((emoji, index) => (
            <button
              key={index}
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-xl hover:bg-muted/50 rounded transition-colors active:scale-95"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Footer con info */}
        <div className="mt-3 pt-2 border-t border-border/20">
          <p className="text-xs text-muted-foreground text-center">
            Haz click en un emoji para agregarlo
          </p>
        </div>
        </div>
      </div>
    </>
  );
}