"use client";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-border/40">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Términos y Condiciones</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Última actualización:</strong> 17 de septiembre de 2025
            </p>

            <div>
              <h3 className="text-foreground font-semibold mb-2">1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
              <p>
                Al acceder y utilizar La Casa Vota (lacasavota.com), usted acepta estar sujeto a estos
                Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe usar nuestro servicio.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">2. DESCRIPCIÓN DEL SERVICIO</h3>
              <p>
                La Casa Vota es una plataforma <strong className="text-foreground">NO OFICIAL</strong> de entretenimiento que permite a los usuarios
                participar en encuestas y votaciones sobre el programa &quot;La Casa de los Famosos&quot;.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">IMPORTANTE:</strong> Esta plataforma no tiene afiliación oficial con Telemundo, VIX,
                Endemol Shine, o cualquier otra entidad relacionada con el programa oficial.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">3. REGISTRO Y CUENTA DE USUARIO</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Debe proporcionar información veraz y actualizada</li>
                <li>Es responsable de mantener la confidencialidad de su cuenta</li>
                <li>Solo se permite una cuenta por persona</li>
                <li>Nos reservamos el derecho de suspender cuentas que violen estos términos</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">4. USO ACEPTABLE</h3>
              <p>
                <strong className="text-foreground">ESTÁ PROHIBIDO:</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Crear múltiples cuentas para manipular votaciones</li>
                <li>Usar bots, scripts o métodos automatizados</li>
                <li>Comportarse de manera abusiva o acosadora</li>
                <li>Intentar hackear o comprometer la seguridad del sitio</li>
                <li>Usar el servicio para actividades ilegales</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">5. VOTACIONES Y PUNTOS</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Las votaciones son solo para entretenimiento</li>
                <li>Los resultados NO afectan el programa oficial</li>
                <li>Los puntos no tienen valor monetario</li>
                <li>Nos reservamos el derecho de invalidar votos fraudulentos</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">6. CONTENIDO DEL USUARIO</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Usted mantiene los derechos de su contenido</li>
                <li>Nos otorga licencia para usar, mostrar y distribuir su contenido en la plataforma</li>
                <li>No publicar contenido ofensivo, ilegal o que infrinja derechos de terceros</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">7. PRIVACIDAD</h3>
              <p>
                Su privacidad es importante. Consulte nuestra Política de Privacidad para entender
                cómo recopilamos y usamos su información.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">8. LIMITACIÓN DE RESPONSABILIDAD</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>El servicio se proporciona &quot;tal como está&quot;</li>
                <li>No garantizamos disponibilidad continua</li>
                <li>No somos responsables por pérdidas directas o indirectas</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">9. MODIFICACIONES</h3>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios entrarán en vigor inmediatamente después de su publicación.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">10. TERMINACIÓN</h3>
              <p>
                Podemos suspender o terminar su acceso al servicio en cualquier momento, con o sin causa.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">11. LEY APLICABLE</h3>
              <p>
                Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta
                en los tribunales competentes de México.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">12. CONTACTO</h3>
              <p>
                Para preguntas sobre estos términos, contacte:
                <strong className="text-foreground"> xpellitofficial@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}