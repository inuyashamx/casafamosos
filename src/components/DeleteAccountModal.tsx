'use client';

import { useState } from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (confirmationText.trim() !== 'ELIMINAR MI CUENTA') {
      setError('Debes escribir exactamente "ELIMINAR MI CUENTA" para confirmar');
      return;
    }
    setError('');
    onConfirm();
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full p-6 border border-border/20 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-destructive mb-2">⚠️ Eliminar Cuenta</h2>
          <p className="text-foreground/90 text-sm">
            Esta acción es <strong>irreversible</strong> y eliminará permanentemente:
          </p>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <ul className="text-sm text-foreground/90 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Tu cuenta de usuario</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Todos tus votos</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Todos tus posts y comentarios</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Todas tus dedicatorias</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Todas tus notificaciones</span>
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Escribe <span className="font-mono text-destructive">ELIMINAR MI CUENTA</span> para confirmar:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => {
              setConfirmationText(e.target.value);
              setError('');
            }}
            disabled={isDeleting}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:border-destructive focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="ELIMINAR MI CUENTA"
          />
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-foreground hover:bg-muted/30 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || confirmationText.trim() !== 'ELIMINAR MI CUENTA'}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
