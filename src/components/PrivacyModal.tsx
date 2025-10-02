"use client";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center min-h-screen">
      <div className="bg-card rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-border/40 m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Política de Privacidad</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Última actualización:</strong> 2 de octubre de 2025
            </p>

            <div>
              <h3 className="text-foreground font-semibold mb-2">1. Información que Recopilamos</h3>
              <p>
                Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta,
                participa en votaciones, o se comunica con nosotros. Esto puede incluir:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Información de perfil (nombre, email, foto de perfil)</li>
                <li>Datos de votación y participación</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">2. Uso de la Información</h3>
              <p>
                Utilizamos su información para:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Procesar y registrar sus votos</li>
                <li>Gestionar su cuenta y participación</li>
                <li>Mejorar nuestros servicios</li>
                <li>Enviar notificaciones sobre la votación</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">3. Cookies y Tecnologías de Seguimiento</h3>
              <p>
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mantener su sesión activa</li>
                <li>Recordar sus preferencias</li>
                <li>Analizar el uso de la aplicación</li>
                <li>Mostrar contenido personalizado</li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">4. Compartir Información</h3>
              <p>
                <strong className="text-foreground">NO compartimos su información personal con terceros bajo ninguna circunstancia.</strong> Su información permanece privada y segura en nuestra plataforma únicamente para el funcionamiento del servicio.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">5. Seguridad de Datos</h3>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger
                su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">6. Sus Derechos</h3>
              <p>
                Usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Acceder a su información personal</li>
                <li>Corregir información inexacta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Retirar su consentimiento en cualquier momento</li>
              </ul>
              <p className="mt-2">
                <strong className="text-foreground">Eliminación de Cuenta:</strong> Puede eliminar su cuenta y todos sus datos asociados en cualquier momento desde la sección de perfil. Esta acción eliminará permanentemente su información, incluyendo votos, posts, comentarios, dedicatorias y notificaciones. Esta acción es irreversible.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">7. Retención de Datos</h3>
              <p>
                Conservamos su información personal solo durante el tiempo necesario para cumplir
                con los propósitos descritos en esta política, a menos que la ley requiera un
                período de retención más largo.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">8. Menores de Edad</h3>
              <p>
                Nuestros servicios no están dirigidos a menores de 13 años. No recopilamos
                intencionalmente información personal de menores de 13 años. Si cree que hemos
                recopilado información de un menor, contáctenos inmediatamente.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">9. Cambios a esta Política</h3>
              <p>
                Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos
                sobre cualquier cambio significativo publicando la nueva política en esta página
                y actualizando la fecha de &quot;Última actualización&quot;.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">10. Contacto</h3>
              <p>
                Si tiene preguntas sobre esta política de privacidad o nuestras prácticas de
                privacidad, contáctenos en: <strong>casadelosfamosos36@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}