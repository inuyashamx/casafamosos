"use client";
import { useState } from 'react';

export default function Footer() {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  return (
    <footer className="bg-card/50 border-t border-border/20 mt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-lg glow"></div>
            <span className="text-lg font-bold text-foreground">
              Casa Famosos 2025
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Plataforma oficial de votación para Casa Famosos
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs text-muted-foreground">
            <button
              onClick={() => setShowPrivacyPolicy(true)}
              className="hover:text-foreground transition-colors underline"
            >
              Política de Privacidad
            </button>
            <span>•</span>
            <span>© 2025 Casa Famosos. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>

      {/* Modal de Política de Privacidad */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-border/40">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Política de Privacidad</h2>
                <button
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Última actualización:</strong> 31 de julio de 2025
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
                    <li>Información de dispositivo y navegador</li>
                    <li>Datos de uso de la aplicación</li>
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
                  <h3 className="text-foreground font-semibold mb-2">4. Publicidad y Marketing</h3>
                  <p>
                    Podemos utilizar servicios de terceros como Twitter Ads y Facebook Ads para mostrar 
                    anuncios relevantes. Estos servicios pueden recopilar información sobre su uso de 
                    nuestra aplicación para personalizar la publicidad.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">5. Compartir Información</h3>
                  <p>
                    No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Con su consentimiento explícito</li>
                    <li>Para cumplir con obligaciones legales</li>
                    <li>Con proveedores de servicios que nos ayudan a operar la plataforma</li>
                    <li>Para proteger nuestros derechos y seguridad</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">6. Seguridad de Datos</h3>
                  <p>
                    Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger 
                    su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">7. Sus Derechos</h3>
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
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">8. Retención de Datos</h3>
                  <p>
                    Conservamos su información personal solo durante el tiempo necesario para cumplir 
                    con los propósitos descritos en esta política, a menos que la ley requiera un 
                    período de retención más largo.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">9. Menores de Edad</h3>
                  <p>
                    Nuestros servicios no están dirigidos a menores de 13 años. No recopilamos 
                    intencionalmente información personal de menores de 13 años. Si cree que hemos 
                    recopilado información de un menor, contáctenos inmediatamente.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">10. Cambios a esta Política</h3>
                  <p>
                    Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos 
                    sobre cualquier cambio significativo publicando la nueva política en esta página 
                    y actualizando la fecha de "Última actualización".
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2">11. Contacto</h3>
                  <p>
                    Si tiene preguntas sobre esta política de privacidad o nuestras prácticas de 
                    privacidad, contáctenos en:
                  </p>
                  <p className="mt-2">
                    <strong>Email:</strong> privacidad@casafamosos.com<br />
                    <strong>Dirección:</strong> Av. Principal 123, Ciudad de México, México
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
} 