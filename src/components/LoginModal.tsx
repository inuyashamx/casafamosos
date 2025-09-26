"use client";
import { useState } from 'react';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';

interface LoginModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onAccept, onClose }: LoginModalProps) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center min-h-screen">
      <div className="bg-card rounded-xl w-full max-w-md border border-border/40 overflow-hidden m-4">
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-bold text-foreground mb-2">Iniciar Sesión con Google</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Al iniciar sesión aceptas nuestros{" "}
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-primary font-medium hover:text-primary/80 underline transition-colors"
              >
                términos y condiciones
              </button>{" "}
              y nuestra{" "}
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-primary font-medium hover:text-primary/80 underline transition-colors"
              >
                política de privacidad
              </button>.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Acepto e Iniciar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Modales de términos y privacidad */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}