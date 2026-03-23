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
 * Términos y condiciones públicos. El email de soporte sale de system_config (misma clave que el footer).
 */
const LegalTerms = () => {
  const { value: supportEmail } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  const mail = supportEmail?.trim();

  return (
    <LegalPageShell title="Términos y condiciones" updatedLabel="Última actualización: documento informativo — consultá con asesor legal para tu jurisdicción.">
      <p>
        Al usar <strong>{appBrandName}</strong> aceptás estos términos. Si no estás de acuerdo, no utilices el servicio.
      </p>

      <h2>1. Objeto del servicio</h2>
      <p>
        La plataforma ofrece herramientas para organizar búsquedas de propiedades, guardar avisos, trabajar en grupo
        familiar o de equipo y, según tu rol, publicar u operar con información inmobiliaria. No somos corredores ni
        garantizamos la existencia, precio o estado de los avisos de terceros.
      </p>

      <h2>2. Cuenta y datos</h2>
      <p>
        Debés proporcionar datos veraces. Podés suspender o restringir cuentas ante uso indebido, fraude o incumplimiento.
        El tratamiento de datos personales se describe en la{" "}
        <Link to={ROUTES.PRIVACY} className="text-primary font-medium hover:underline">
          Política de privacidad
        </Link>
        .
      </p>

      <h2>3. Contenido del usuario</h2>
      <p>
        Sos responsable del contenido que cargás (textos, enlaces, comentarios). No debés publicar material ilícito,
        ofensivo o que infrinja derechos de terceros.
      </p>

      <h2>4. Uso aceptable</h2>
      <ul>
        <li>Prohibido intentar vulnerar la seguridad, saturar el servicio o extraer datos de forma abusiva.</li>
        <li>Respetá la normativa aplicable en tu país respecto de datos y publicidad.</li>
      </ul>

      <h2>5. Disponibilidad y cambios</h2>
      <p>
        El servicio se ofrece según disponibilidad técnica. Podemos modificar funciones o estos términos; el uso continuado
        implica aceptación de cambios razonables publicados en esta página.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley aplicable, no nos responsabilizamos por decisiones de compra, alquiler o
        inversión basadas en la información de la app, ni por daños indirectos o pérdida de datos ajenos a nuestro control
        razonable.
      </p>

      <p>
        Para consultas sobre estos términos{mail ? ":" : " configurá el correo de soporte en el panel de administración."}
        {mail && (
          <>
            {" "}
            <a href={`mailto:${mail}`} className="text-primary font-medium hover:underline">
              {mail}
            </a>
          </>
        )}
      </p>

      <div className="pt-8 border-t border-border/50 mt-8">
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          Estos términos y condiciones fueron actualizados por última vez en marzo de 2026. 
          <strong>{appBrandName}</strong> se reserva el derecho de modificarlos para adaptarlos a novedades legislativas o prácticas del mercado.
        </p>
      </div>
    </LegalPageShell>
  );
};

export default LegalTerms;
