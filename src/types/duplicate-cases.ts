/**
 * ============================================================================
 * 📋 DOCUMENTACIÓN DE CASOS DE DUPLICADO
 * ============================================================================
 * 
 * Este archivo documenta TODOS los casos posibles cuando un usuario intenta
 * ingresar una publicación que ya existe en el sistema.
 * 
 * Cada caso tiene:
 * - Descripción clara del escenario
 * - Props necesarias
 * - Mensajes específicos
 * - Acciones disponibles
 * 
 * Si aparece un nuevo caso, documentar acá primero antes de implementar.
 * ============================================================================
 */

/**
 * ────────────────────────────────────────────────────────────────────────────
 * CASO 1 (C1): Agente repite su propia publicación
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Escenario:
 *   - Agente de Agencia X publica un aviso en el marketplace
 *   - El MISMO agente (o de la misma agencia) intenta ingresar el mismo aviso
 * 
 * Contexto: agent_publications duplicadas dentro de la misma org
 * 
 * Mensaje:
 *   "ESTA PUBLICACIÓN YA FUE INGRESADA"
 *   "Ingresada por [Nombre Agente] el día [Fecha]"
 * 
 * Acciones:
 *   - "Ver publicación" → Abre la publicación existente del marketplace
 * 
 * Componente actual: AgentOwnPublicationNotice
 */
export type DuplicateCase1 = {
  case: "C1";
  /** Nombre del agente que publicó originalmente */
  publishedByName: string;
  /** Fecha de creación ISO */
  createdAt: string;
  /** ID de la publicación existente para abrirla */
  agentPublicationId?: string;
};

/**
 * ────────────────────────────────────────────────────────────────────────────
 * CASO 2A (C2a): Usuario intenta ingresar aviso que ya está en marketplace 
 *                de agencia Y ADEMÁS ya lo tiene en su listado personal
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Escenario:
 *   - Agencia X tiene un aviso publicado en el marketplace
 *   - Usuario ya guardó ese aviso en su listado personal (urlInFamily)
 *   - Usuario intenta ingresar el mismo aviso de nuevo
 * 
 * Contexto: user_listings (propia org) + agent_publications (marketplace)
 * 
 * Mensaje:
 *   "ESTA PUBLICACIÓN YA FUE INGRESADA"
 *   "Está en tu listado personal"
 *   "Esta propiedad forma parte de la cartera de [Agencia]"
 *   "[Nombre Agente] es tu agente de contacto"
 * 
 * Acciones:
 *   - "Hacé click para mandar un mensaje" → WhatsApp al agente
 * 
 * Componente actual: DuplicateAlertDialog (C2a)
 */
export type DuplicateCase2a = {
  case: "C2a";
  /** Nombre de la agencia que publicó en marketplace */
  agencyName: string;
  /** Nombre del agente de contacto */
  agentName: string;
  /** Dígitos de WhatsApp para wa.me (sin +) */
  whatsappDigits: string | null;
  /** URL del listing para compartir */
  listingUrl: string;
  /** ID del user_listing existente del usuario */
  userListingId: string;
  /** ID de la publicación del marketplace */
  agentPublicationId?: string;
};

/**
 * ────────────────────────────────────────────────────────────────────────────
 * CASO 2B (C2b): Usuario intenta ingresar aviso que ya está en marketplace 
 *                de agencia pero NO está en su listado personal
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Escenario:
 *   - Agencia X tiene un aviso publicado en el marketplace
 *   - Usuario NO tiene ese aviso en su listado personal (primera vez)
 *   - Usuario intenta ingresar el aviso
 * 
 * Contexto: agent_publications (marketplace) sin user_listings propia
 * 
 * Mensaje:
 *   "ESTA PUBLICACIÓN YA FUE INGRESADA"
 *   "Esta propiedad forma parte de la cartera de [Agencia]"
 *   "[Nombre Agente] es su agente de contacto"
 * 
 * Acciones:
 *   - "Guardar en mi listado y contactar" → Agrega al listado + abre WhatsApp
 * 
 * Componente actual: DuplicateAlertDialog (C2b)
 */
export type DuplicateCase2b = {
  case: "C2b";
  /** Nombre de la agencia que publicó en marketplace */
  agencyName: string;
  /** Nombre del agente de contacto */
  agentName: string;
  /** Dígitos de WhatsApp para wa.me (sin +) */
  whatsappDigits: string | null;
  /** URL del listing para compartir */
  listingUrl: string;
  /** ID de la publicación del marketplace */
  agentPublicationId?: string;
  /** Callback para guardar en el listado del usuario */
  onSaveToListing?: () => void;
  /** Si está procesando el guardado */
  isSaving?: boolean;
};

/**
 * ────────────────────────────────────────────────────────────────────────────
 * CASO 3 (C3): Usuario repite aviso en su propio listado familiar
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Escenario:
 *   - Usuario de Familia X ingresa un aviso
 *   - El MISMO usuario (o alguien de la misma familia) intenta ingresar el mismo aviso
 * 
 * Contexto: user_listings duplicadas dentro de la misma org
 * 
 * Mensaje:
 *   "ESTA PUBLICACIÓN YA FUE INGRESADA"
 *   "Está en tu listado personal, pero no forma parte de ninguna agencia
 *    oficial partner de [NombreApp]"
 * 
 * Acciones:
 *   - "Para verlo hacé click acá" → Abre el listing existente del usuario
 * 
 * Componente actual: DuplicateAlertDialog (C3)
 */
export type DuplicateCase3 = {
  case: "C3";
  /** Nombre de quien ingresó el aviso */
  addedByName: string;
  /** Fecha de creación ISO */
  addedAt: string;
  /** Estado actual del listing (ingresado, contactado, etc.) */
  status: string;
  /** ID del user_listing existente */
  userListingId: string;
  /** Nombre de la app (desde system_config) */
  appName?: string;
};

/**
 * Información de un usuario que ya tiene el aviso en su listado
 */
export type UserWithListing = {
  /** ID del user_listing */
  userListingId: string;
  /** Nombre display o email del usuario */
  name: string;
  /** Teléfono si está disponible */
  phone?: string | null;
  /** Estado actual del listing */
  status: string;
  /** Fecha de ingreso */
  addedAt: string;
};

/**
 * ────────────────────────────────────────────────────────────────────────────
 * CASO 4 (C4): Agente intenta ingresar aviso que ya está en listado de usuarios
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Escenario:
 *   - Usuario(s) ya ingresaron un aviso en su listado familiar
 *   - Un agente intenta ingresar el mismo aviso para publicarlo en marketplace
 *
 * Contexto: user_listings existe, agent_publications no
 *
 * Mensaje:
 *   "ESTA PUBLICACIÓN YA FUE INGRESADA EN EL LISTADO PERSONAL DE X USUARIO(S)"
 *   Lista de usuarios con datos de contacto para que el agente pueda comunicarse
 *
 * Acciones:
 *   - "Contactar usuarios" → Abre WhatsApp/email con cada usuario
 *   - "Agregar a mi listado" → Crea el listing para el agente también
 *
 * Componente actual: DuplicateAlertDialog (C4)
 */
export type DuplicateCase4 = {
  case: "C4";
  /** Cantidad de usuarios que ya tienen este aviso */
  usersCount: number;
  /** Datos de los usuarios para contactar */
  users: UserWithListing[];
  /** Callback para agregar el listing al agente */
  onAddExisting: () => void;
  /** Si está procesando el agregado */
  isAdding: boolean;
};

/**
 * ────────────────────────────────────────────────────────────────────────────
 * CASO 5 (C5): Usuario B intenta ingresar aviso que Usuario A ya ingresó
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Escenario:
 *   - Usuario A de Familia A ingresa un aviso
 *   - Usuario B de Familia B (diferente) intenta ingresar el mismo aviso
 * 
 * Contexto: user_listings en distintas orgs
 * 
 * Mensaje:
 *   "ESTA PUBLICACIÓN YA FUE INGRESADA POR OTRO USUARIO"
 *   "Ingresada por [Nombre Usuario] de [Nombre Familia]"
 *   "Fecha: [Fecha]"
 * 
 * Acciones:
 *   - "Ver publicación" → Abre el listing existente (si hay permisos)
 *   - "Agregar de todas formas" → Crea un nuevo listing independiente
 * 
 * Componente actual: NO IMPLEMENTADO AÚN (nuevo caso)
 */
export type DuplicateCase5 = {
  case: "C5";
  /** Nombre del usuario que ingresó primero */
  addedByName: string;
  /** Nombre de la familia/org del usuario */
  familyName: string;
  /** Fecha de creación ISO */
  addedAt: string;
  /** ID del user_listing existente */
  userListingId: string;
  /** Callback para agregar de todas formas */
  onAddAnyway?: () => void;
  /** Si está procesando el agregado */
  isAdding?: boolean;
};

/**
 * ============================================================================
 * TIPO UNIFICADO
 * ============================================================================
 */
export type DuplicateCase =
  | DuplicateCase1
  | DuplicateCase2a
  | DuplicateCase2b
  | DuplicateCase3
  | DuplicateCase4
  | DuplicateCase5;

/**
 * ============================================================================
 * MENSAJES POR CASO
 * ============================================================================
 * 
 * Centraliza los textos para mantener consistencia y facilitar cambios futuros.
 */
export const DUPLICATE_MESSAGES = {
  C1: {
    title: "ESTA PUBLICACIÓN YA FUE INGRESADA",
    subtitle: (name: string, date: string) =>
      `Ingresada por ${name} el día ${date}`,
    actionLabel: "Hacé click para ver el aviso",
  },
  C2a: {
    title: "ESTA PUBLICACIÓN YA FUE INGRESADA",
    subtitle: "Está en tu listado personal",
    agencyMsg: (agency: string) => `Esta propiedad forma parte de la cartera de ${agency}`,
    agentMsg: (agent: string) => `${agent} es tu agente de contacto`,
    actionLabel: "Hacé click para mandar un mensaje",
  },
  C2b: {
    title: "ESTA PUBLICACIÓN YA FUE INGRESADA",
    agencyMsg: (agency: string) => `Esta propiedad forma parte de la cartera de ${agency}`,
    agentMsg: (agent: string) => `${agent} es su agente de contacto`,
    actionLabel: "Guardar en mi listado y contactar",
  },
  C3: {
    title: "ESTA PUBLICACIÓN YA FUE INGRESADA",
    subtitle: (appName: string) =>
      `Está en tu listado personal, pero no forma parte de ninguna agencia oficial partner de ${appName}`,
    actionLabel: "Para verlo hacé click acá",
  },
  C4: {
    title: (count: number) =>
      count === 1
        ? "ESTA PUBLICACIÓN YA FUE INGRESADA"
        : `ESTA PUBLICACIÓN YA FUE INGRESADA POR ${count} USUARIOS`,
    subtitle: "Usuarios que ya tienen este aviso en su listado personal:",
    actionLabelContact: "Contactar usuarios",
    actionLabelAdd: "Agregar a mi listado",
  },
  C5: {
    title: "ESTA PUBLICACIÓN YA FUE INGRESADA POR OTRO USUARIO",
    subtitle: (name: string, family: string, date: string) =>
      `Ingresada por ${name} de ${family} el ${date}`,
    actionLabel: "Ver publicación",
    addAnywayLabel: "Agregar de todas formas",
  },
} as const;
