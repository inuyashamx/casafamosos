"use client";
import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import EmojiPicker from './EmojiPicker';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  publicId: string;
  thumbnail?: string;
  file?: File;
}

interface CreatePostProps {
  onPostCreated?: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validar cantidad de archivos (máximo 10)
    if (media.length + files.length > 10) {
      setError('Máximo 10 archivos por post');
      return;
    }

    // Validar que solo sean imágenes
    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
    if (nonImageFiles.length > 0) {
      setError('Solo se permiten imágenes por el momento');
      return;
    }

    setError(null);

    // Crear previews locales sin subir
    const newMediaItems: MediaItem[] = files.map(file => {
      const previewUrl = URL.createObjectURL(file);
      
      return {
        type: 'image' as const, // Forzar tipo imagen
        url: previewUrl,
        publicId: '', // Se llenará al publicar
        file,
      };
    });

    setMedia(prev => [...prev, ...newMediaItems]);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const mediaItem = media[index];
    if (mediaItem.url.startsWith('blob:')) {
      URL.revokeObjectURL(mediaItem.url);
    }
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  const extractLinks = (text: string): Array<{ url: string }> => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches.map(url => ({ url })) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && media.length === 0) {
      setError('Debes escribir algo o agregar una imagen');
      return;
    }

    if (content.length > 2000) {
      setError('El post no puede exceder 2000 caracteres');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingMedia(true);
    setError(null);

    try {
      const links = extractLinks(content);
      const uploadedMedia = [];

      // Subir archivos a Cloudinary
      for (const item of media) {
        if (item.file) {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('type', item.type);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            let errorMessage = 'Error al subir archivo';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const uploadResult = await response.json();
          uploadedMedia.push({
            type: item.type,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            thumbnail: uploadResult.thumbnail,
          });
        }
      }

      // Crear el post con los archivos subidos
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          media: uploadedMedia,
          links,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear post');
      }

      // Limpiar form y liberar URLs de blob
      media.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
      
      setContent('');
      setMedia([]);
      
      // Notificar que se creó el post
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      setError(error.message || 'Error al crear post');
    } finally {
      setIsSubmitting(false);
      setIsUploadingMedia(false);
    }
  };

  if (!session) return null;

  return (
    <div className="bg-card rounded-xl p-6 border border-border/20 space-y-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'Usuario'}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {session.user?.name?.[0] || 'U'}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="relative">
               <textarea
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder="¿Qué está pasando?"
                 className="w-full p-3 pb-8 bg-background border border-border/40 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground"
                 rows={3}
                 maxLength={2000}
               />
               
               {/* Character counter floating inside textarea */}
               <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                 {content.length}/2000
               </div>
             </div>

            {/* Media preview */}
            {media.length > 0 && (
              <div className={`grid gap-2 ${
                media.length === 1 ? 'grid-cols-1' : 
                media.length === 2 ? 'grid-cols-2' : 
                media.length <= 4 ? 'grid-cols-2' :
                media.length <= 6 ? 'grid-cols-3' :
                'grid-cols-4'
              }`}>
                {media.map((item, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden bg-muted">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt="Preview"
                        className="w-full h-24 sm:h-32 object-cover"
                      />
                    ) : (
                      <div className="relative">
                        <video
                          src={item.url}
                          className="w-full h-24 sm:h-32 object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-white text-lg">▶️</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

                         {/* Actions */}
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   multiple
                   onChange={handleFileSelect}
                   className="hidden"
                 />
                 
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isUploadingMedia || media.length >= 10}
                   className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title={`Agregar imagen (${media.length}/10)`}
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                 </button>
                 
                 <button
                   type="button"
                   onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                   className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                   title="Agregar emoji"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </button>
               </div>
               
                               <button
                  type="submit"
                  disabled={isSubmitting || isUploadingMedia || (!content.trim() && media.length === 0)}
                  className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Publicando...' : isUploadingMedia ? 'Subiendo...' : 'Publicar'}
                </button>
             </div>
          </form>

          {/* Emoji Picker */}
          <EmojiPicker
            isOpen={showEmojiPicker}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      </div>
    </div>
  );
}