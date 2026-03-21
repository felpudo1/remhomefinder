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
      title="Política de privacidad"
      updatedLabel={`Información sobre tratamiento de datos en ${appBrandName}.`}
    >
      <p>
        En <strong>{appBrandName}</strong> tratamos datos personales según esta política, complementaria de los{" "}
        <Link to={ROUTES.TERMS} className="text-primary font-medium hover:underline">
          Términos y condiciones
        </Link>
        .
      </p>

      <h2>1. Responsable</h2>
      <p>
        El responsable del tratamiento es quien opera la plataforma <strong>{appBrandName}</strong>. Para ejercer derechos
        o consultas,{" "}
        {mail ? (
          <>
            podés escribir a{" "}
            <a href={`mailto:${mail}`} className="text-primary font-medium hover:underline">
              {mail}
            </a>
            .
          </>
        ) : (
          <>configurá un correo de soporte en el panel de administración.</>
        )}
      </p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>Datos de registro e identificación (por ejemplo email, nombre, teléfono si los indicás).</li>
        <li>Datos de uso de la aplicación e interacción con funciones (páginas vistas, acciones, errores técnicos).</li>
        <li>Contenido que cargás (propiedades, comentarios, archivos permitidos por el producto).</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Prestar el servicio, autenticar usuarios y mantener tu cuenta.</li>
        <li>
          <strong>Estadísticas y mejora del producto:</strong> utilizamos datos de uso de forma agregada o analítica para
          entender cómo se usa la app, medir rendimiento, priorizar mejoras y reforzar la seguridad. Cuando sea posible
          empleamos agregación o pseudonimización.
        </li>
        <li>Cumplir obligaciones legales y responder a requerimientos válidos.</li>
      </ul>

      <h2>4. Base legal</h2>
      <p>
        Ejecución del contrato (uso del servicio), interés legítimo en analítica y seguridad, y consentimiento cuando la ley
        lo exija (por ejemplo comunicaciones opcionales).
      </p>

      <h2>5. Conservación</h2>
      <p>
        Conservamos los datos el tiempo necesario para las finalidades indicadas y los plazos legales. Podés solicitar
        supresión cuando corresponda según tu jurisdicción.
      </p>

      <h2>6. Terceros y encargados</h2>
      <p>
        Podemos utilizar proveedores de infraestructura, autenticación o analítica (por ejemplo alojamiento y base de datos).
        Operan bajo acuerdos que exigen protección adecuada de datos.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Según la ley aplicable podés acceder, rectificar, oponerte, limitar u solicitar la portabilidad o supresión.{" "}
        {mail ? (
          <>
            Contactá a{" "}
            <a href={`mailto:${mail}`} className="text-primary font-medium hover:underline">
              {mail}
            </a>
            .
          </>
        ) : (
          <>Contactá al correo configurado en soporte cuando esté disponible en el panel de administración.</>
        )}
      </p>

      <h2>8. Cambios</h2>
      <p>Podemos actualizar esta política; publicaremos la versión vigente en esta página con la fecha de actualización.</p>
    </LegalPageShell>
  );
};

export default LegalPrivacy;
