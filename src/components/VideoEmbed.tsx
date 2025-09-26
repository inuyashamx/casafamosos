"use client";
import { useState, useEffect } from 'react';
import { VideoEmbed as VideoEmbedType } from '@/utils/videoEmbeds';

interface VideoEmbedProps {
  embed: VideoEmbedType;
}

export default function VideoEmbed({ embed }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [resolvedVideoId, setResolvedVideoId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    // Si es una URL corta de TikTok, resolver el video ID real
    if (embed.type === 'tiktok' && embed.requiresResolution) {
      setIsResolving(true);
      fetch(`/api/tiktok/resolve?url=${encodeURIComponent(embed.url)}`)
        .then(res => res.json())
        .then(data => {
          if (data.videoId) {
            setResolvedVideoId(data.videoId);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setIsResolving(false));
    }
  }, [embed]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 border border-border/20">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <span>📺</span>
          <div>
            <p className="text-sm">No se pudo cargar el video</p>
            <a
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Ver en {embed.type === 'youtube' ? 'YouTube' : embed.type === 'tiktok' ? 'TikTok' : 'Facebook'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-embed-container my-3">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {embed.type === 'youtube' && (
          <div className="relative pb-[56.25%] h-0"> {/* 16:9 aspect ratio */}
            <iframe
              src={embed.embedUrl}
              title="YouTube video"
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        )}

        {embed.type === 'tiktok' && (
          <div className="relative pb-[177.78%] h-0 max-w-[325px] mx-auto">
            {isResolving ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <iframe
                src={
                  embed.requiresResolution && resolvedVideoId
                    ? `https://www.tiktok.com/embed/v2/${resolvedVideoId}?autoplay=0&playsinline=0`
                    : embed.embedUrl
                }
                title="TikTok video"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
              />
            )}
          </div>
        )}

        {embed.type === 'facebook' && (
          <div className="relative pb-[56.25%] h-0"> {/* 16:9 aspect ratio for Facebook */}
            <iframe
              src={embed.embedUrl}
              title="Facebook video"
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        )}

        {/* Loading indicator */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Link to original video */}
      <div className="mt-2 text-center">
        <a
          href={embed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ver en {embed.type === 'youtube' ? 'YouTube' : embed.type === 'tiktok' ? 'TikTok' : 'Facebook'} ↗
        </a>
      </div>
    </div>
  );
}