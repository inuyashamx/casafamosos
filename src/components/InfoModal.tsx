"use client";
import { useEffect } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay para cerrar */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border/40 shadow-2xl transform scale-95 animate-scale-in relative">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-center text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors text-2xl leading-none"
            title="Cerrar"
          >
            ✕
          </button>
          <div className="text-4xl mb-3">📌</div>
          <h2 className="text-xl font-bold">Diferencia entre votos acumulados y voto único</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Votos Acumulados Section */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-600">Votos Acumulados</h3>
                <p className="text-sm text-blue-500/80">Aquí se suman todos los puntos repartidos</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border/20">
              <p className="font-semibold text-foreground mb-2">📝 Ejemplo:</p>
              <p className="text-foreground text-sm mb-3">Si tienes 100 puntos y decides dar:</p>
              <ul className="space-y-1 text-sm text-foreground ml-4">
                <li>• <strong>50 a Shikis</strong></li>
                <li>• <strong>20 a Abelito</strong></li>
                <li>• <strong>30 a Aaron</strong></li>
              </ul>
              <div className="mt-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-sm font-semibold text-blue-600">
                  Entonces el acumulado es: 50 + 20 + 30 = <span className="text-lg">100 puntos</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-semibold">➝</span> Este sistema mide <strong>qué tanta fuerza o apoyo en puntos</strong> recibe cada persona.
              </p>
              <p className="text-sm text-blue-600">
                <span className="font-semibold">🔗</span> Es parecido a lo que hace <strong>Vix</strong>, donde repartes votos.
              </p>
            </div>
          </div>

          {/* Voto Único Section */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-600">Voto Único</h3>
                <p className="text-sm text-purple-500/80">No importa cuántos puntos des, lo que cuenta es que votaste</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border/20">
              <p className="font-semibold text-foreground mb-2">📝 Siguiendo el ejemplo de arriba:</p>
              <p className="text-foreground text-sm mb-3">Aunque repartiste diferente:</p>
              <ul className="space-y-1 text-sm text-foreground ml-4">
                <li>• <strong>Shikis recibe 1 voto</strong></li>
                <li>• <strong>Abelito recibe 1 voto</strong></li>
                <li>• <strong>Aaron recibe 1 voto</strong></li>
              </ul>
              <div className="mt-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <p className="text-sm font-semibold text-purple-600">
                  Total: <span className="text-lg">3 personas diferentes</span> votaron
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-semibold">➝</span> Este sistema mide <strong>cuántas personas votaron</strong> por alguien (no cuántos puntos).
              </p>
              <p className="text-sm text-purple-600">
                <span className="font-semibold">🔗</span> Es parecido a <strong>Facebook</strong>, donde cada usuario solo puede dar un &quot;me gusta&quot; = 1 voto.
              </p>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5">
            <div className="text-center mb-4">
              <span className="text-3xl">👉</span>
              <h3 className="text-lg font-bold text-foreground mt-2">En resumen:</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <h4 className="font-bold text-blue-600 mb-2">📊 Acumulados</h4>
                <p className="text-sm text-foreground">
                  Mide la <strong>cantidad de puntos</strong> repartidos (qué tanto apoyo).
                </p>
              </div>

              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h4 className="font-bold text-purple-600 mb-2">👥 Único</h4>
                <p className="text-sm text-foreground">
                  Mide la <strong>cantidad de personas distintas</strong> que votaron (popularidad).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/20 bg-muted/20 text-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
          >
            ¡Entendido! 👍
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}