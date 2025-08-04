"use client";
import { useState } from 'react';

interface ImageCarouselProps {
  images: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
  onClose: () => void;
}

export default function ImageCarousel({ images, onClose }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const currentMedia = images[currentIndex];

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10"
      >
        ✕
      </button>

      {/* Contenido del carrusel */}
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Botón anterior */}
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
          >
            ‹
          </button>
        )}

        {/* Media actual */}
        <div className="max-w-4xl max-h-full p-4">
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt="Media"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              poster={currentMedia.thumbnail}
              className="max-w-full max-h-full object-contain"
            >
              Tu navegador no soporta video.
            </video>
          )}
        </div>

        {/* Botón siguiente */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
          >
            ›
          </button>
        )}

        {/* Indicadores */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Contador */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
} 