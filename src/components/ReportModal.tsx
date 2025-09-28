"use client";
import { useState } from 'react';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: string, customReason?: string) => void;
}

export default function ReportModal({ onClose, onSubmit }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { value: 'offensive', label: 'Contenido ofensivo o irrespetuoso' },
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'inappropriate', label: 'Contenido inapropiado' },
    { value: 'other', label: 'Otro motivo' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      alert('Por favor selecciona una razón');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      alert('Por favor especifica el motivo');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, customReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-xl border border-border/20 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Reportar contenido
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ayúdanos a mantener un espacio respetuoso. ¿Por qué estás reportando este contenido?
            </p>

            {/* Reasons */}
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-start space-x-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-sm text-foreground">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Custom reason input */}
            {selectedReason === 'other' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Especifica el motivo
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe brevemente el problema..."
                  className="w-full px-3 py-2 bg-background rounded-lg border border-border/50
                           focus:outline-none focus:border-primary resize-none
                           text-foreground placeholder:text-muted-foreground"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {customReason.length}/200 caracteres
                </p>
              </div>
            )}

            {/* Info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Los reportes son anónimos y serán revisados por nuestro equipo de moderación.
                Solo reporta contenido que viole nuestras normas de comunidad.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:text-foreground
                         transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedReason}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg
                         hover:bg-yellow-600 transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}