"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CreateDedicationProps {
  candidateId: string;
  candidateName: string;
  onDedicationCreated: () => void;
}

export default function CreateDedication({
  candidateId,
  candidateName,
  onDedicationCreated,
}: CreateDedicationProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Por favor escribe tu dedicatoria');
      return;
    }

    if (content.trim().length < 20) {
      setError('La dedicatoria debe tener al menos 20 caracteres');
      return;
    }

    if (content.length > 2000) {
      setError('La dedicatoria no puede exceder los 2000 caracteres');
      return;
    }

    // Validación básica de patrones maliciosos en frontend
    if (/<script|javascript:|data:|vbscript:/i.test(content)) {
      setError('El contenido contiene caracteres no permitidos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/dedications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar dedicatoria');
      }

      // Clear form and show success
      setContent('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Notify parent component
      onDedicationCreated();
    } catch (error: any) {
      console.error('Error creating dedication:', error);
      setError(error.message || 'Error al enviar tu dedicatoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border/20 p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
        Escríbele a {candidateName} ❤️
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Expresa tu apoyo, admiración o cariño... Recuerda escribir con respeto y desde el corazón"
              className="w-full px-4 py-3 bg-background rounded-lg border border-border/50
                       focus:outline-none focus:border-primary resize-none
                       text-foreground placeholder:text-muted-foreground"
              rows={4}
              maxLength={2000}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {content.length}/2000 caracteres
              </span>
              {content.length > 1800 && (
                <span className="text-xs sm:text-sm text-yellow-500">
                  Acercándote al límite
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-500">
                ✅ Tu dedicatoria se ha enviado exitosamente
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Solo se permiten mensajes respetuosos y con buenas intenciones
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 rounded-lg
                       hover:bg-primary/90 transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>❤️</span>
                  <span>Enviar dedicatoria</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}