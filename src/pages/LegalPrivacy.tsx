import { Link } from "react-router-dom";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ROUTES } from "@/lib/constants";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  SUPPORT_EMAIL_CONFIG_KEY,
  SUPPORT_EMAIL_DEFAULT,
  APP_BRAND_NAME_DEFAULT,
  APP_BRAND_NAME_KEY,
} from "@/lib/config-keys";

/**
 * Política de privacidad pública. Email de soporte desde system_config (igual que footer).
 */
const LegalPrivacy = () => {
  const { value: supportEmail } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  const mail = supportEmail?.trim();

  return (
    <LegalPageShell
      title="Política de Privacidad y Tratamiento de Datos Personales"
      updatedLabel={`Transparencia, seguridad y cumplimiento normativo en ${appBrandName}.`}
    >
      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <p>
            En <strong>{appBrandName}</strong> (en adelante, "la Plataforma"), nos comprometemos a garantizar la protección, confidencialidad y seguridad de los datos personales de nuestros usuarios. La presente Política de Privacidad describe los procesos de recolección, almacenamiento, uso y protección de la información, de conformidad con los estándares internacionales de protección de datos personales y la normativa local vigente.
          </p>
          <p className="mt-4">
            Al acceder y utilizar nuestros servicios, usted (en adelante, "el Titular") acepta los términos aquí descritos, los cuales son complementarios a nuestros{" "}
            <Link to={ROUTES.TERMS} className="text-primary font-medium hover:underline">
              Términos y Condiciones
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">1. Identidad del Responsable</h2>
          <p>
            El responsable del tratamiento de los datos personales recopilados a través de la Plataforma es la entidad operadora de <strong>{appBrandName}</strong>. 
            Para asegurar un canal directo de transparencia, el Titular puede dirigir cualquier consulta, reclamo o ejercicio de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) a nuestro Oficial de Privacidad a través de:{" "}
            {mail ? (
              <a href={`mailto:${mail}`} className="text-primary font-medium hover:underline">
                {mail}
              </a>
            ) : (
              <span className="italic">los canales de soporte técnico habilitados en su panel de control</span>
            )}.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">2. Categorías de Datos Recopilados</h2>
          <p className="mb-3 font-medium text-foreground">La Plataforma podrá recopilar y procesar las siguientes tipologías de datos:</p>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong>Datos de Identificación Directa:</strong> Correo electrónico, nombre completo, números de contacto y credenciales de acceso facilitados voluntariamente durante el proceso de registro o actualización de perfil.
            </li>
            <li>
              <strong>Datos de Navegación y Técnicos:</strong> Dirección IP, metadatos de sesión, identificadores de dispositivo, registros de actividad (logs) y telemetría de errores para garantizar la estabilidad del sistema.
            </li>
            <li>
              <strong>Datos de Interacción y Preferencias:</strong> Información generada a través del uso de herramientas de búsqueda, tales como propiedades visualizadas, criterios de filtrado, geolocalización de búsquedas y avisos guardados en carteras personales.
            </li>
            <li>
              <strong>Retroalimentación de Usuario (Feedback):</strong> Valoraciones numéricas, indicadores de satisfacción (estrellas) y estados de avance en el proceso de interés inmobiliario cargados por el Titular.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">3. Finalidades y Bases Legales del Procesamiento</h2>
          <p className="mb-3 font-medium text-foreground">El procesamiento de datos se fundamenta en la ejecución contractual y el interés legítimo del Responsable, persiguiendo las siguientes finalidades:</p>
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Prestación del Servicio Principal:</strong> Gestión de cuentas de usuario, sincronización de grupos de búsqueda familiar y facilitación de la organización de la demanda inmobiliaria.</li>
            <li><strong>Mejora del Ecosistema Inmobiliario:</strong> Análisis analítico y estadístico de las tendencias del mercado para optimizar el rendimiento de la red y la calidad de los avisos publicados.</li>
            <li><strong>Seguridad y Prevención de Fraude:</strong> Monitoreo de comportamientos inusuales para proteger la integridad de la base de usuarios y del sistema.</li>
            <li><strong>Cumplimiento Normativo:</strong> Respuesta a requerimientos de autoridades competentes y cumplimiento de obligaciones fiscales o legales aplicables.</li>
          </ol>
        </section>

        <section className="bg-muted/50 p-6 rounded-2xl border border-border shadow-inner">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full block"></span>
            4. Interacción con Anunciantes y Colaboradores
          </h2>
          <p>
            La Plataforma actúa como un ecosistema puente entre la oferta y la demanda inmobiliaria. En el marco de este servicio, y para permitir una gestión profesional de las consultas, el sistema permite que los <strong>Anunciantes</strong> (Agentes o Inmobiliarias) visualicen ciertos <strong>Indicadores de Interés</strong> vinculados a sus publicaciones específicas.
          </p>
          <p className="mt-3">
            Esto incluye la transmisión sutil de estados de avance (por ejemplo, coordenadas de visita) y valoraciones de retroalimentación constructiva, permitiendo que el profesional ajuste su atención y mejore la transparencia del proceso de comercialización. El Titular reconoce que al interactuar con un aviso de un tercero profesional, se habilita el flujo de esta información de carácter transaccional para el éxito del servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">5. Seguridad y Conservación</h2>
          <p>
            Implementamos medidas técnicas y organizativas de vanguardia, incluyendo cifrado de datos y protocolos de acceso restringido, para prevenir la pérdida, alteración o acceso no autorizado. Los datos se conservarán durante el periodo que subsista la relación comercial y, posteriormente, durante los plazos de prescripción legal para la defensa ante eventuales reclamaciones.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">6. Derechos del Titular</h2>
          <p>
            Usted conserva en todo momento la propiedad sobre su información. Puede solicitar el acceso, rectificación de inexactitudes, la portabilidad de sus datos o la supresión definitiva de su perfil (derecho al olvido), siempre que no contravenga obligaciones legales de retención. 
          </p>
          <p className="mt-3">
            Cualquier solicitud será procesada en un plazo máximo según lo estipulado por la ley de protección de datos personales aplicable en su jurisdicción.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">7. Transferencias Internacionales</h2>
          <p>
            Para la correcta prestación técnica del servicio, los datos podrán ser alojados en infraestructuras de nube de terceros proveedores (sub-encargados) que cumplen con marcos de transferencia segura y certificaciones de protección de privacidad reconocidas internacionalmente.
          </p>
        </section>

        <section className="pt-6 border-t border-border">
          <p className="italic text-xs text-center">
            Esta Política de Privacidad fue actualizada por última vez en marzo de 2026. {appBrandName} se reserva el derecho de modificar estos términos para adaptarlos a novedades legislativas o prácticas del mercado.
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
};

export default LegalPrivacy;
