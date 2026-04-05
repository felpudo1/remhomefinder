import { Database, Table2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableInfo {
  name: string;
  description: string;
  category: string;
}

const DB_TABLES: TableInfo[] = [
  // --- Core / Auth ---
  { name: "profiles", description: "Datos del usuario: nombre, email, teléfono, avatar, estado (active/pending/suspended/rejected), plan_type, referred_by_id.", category: "Core" },
  { name: "user_roles", description: "Roles de la app por usuario (admin, agency, agencymember, user, sysadmin). Determina redirección y permisos.", category: "Core" },

  // --- Organizaciones ---
  { name: "organizations", description: "Familias y equipos de agencia. Contiene plan_type, invite_code, logo, datos de contacto. Cada usuario tiene al menos una org.", category: "Organizaciones" },
  { name: "organization_members", description: "Membresía de usuarios en organizaciones. Roles: owner, agent, member, system_admin_delegate. Flag is_system_delegate.", category: "Organizaciones" },

  // --- Propiedades ---
  { name: "properties", description: "Propiedades inmobiliarias: título, precio, moneda, m², habitaciones, dirección, imágenes, coordenadas, datos IA (raw_ai_data).", category: "Propiedades" },
  { name: "user_listings", description: "Listado personal del usuario vinculado a una propiedad y organización. Estado (ingresado → descartado), tipo (rent/sale), contacto, source_publication_id.", category: "Propiedades" },
  { name: "user_listing_attachments", description: "Fotos adjuntas subidas por usuarios a un user_listing (ej. fotos de visita).", category: "Propiedades" },
  { name: "property_reviews", description: "Calificaciones numéricas (1-5) de propiedades por usuario y organización.", category: "Propiedades" },
  { name: "property_views_log", description: "Log de vistas de propiedades (anónimas). Se usa para conteo de visualizaciones.", category: "Propiedades" },

  // --- Marketplace / Agentes ---
  { name: "agent_publications", description: "Publicaciones del marketplace por agentes. Estado: disponible, reservado, vendido, alquilado, eliminado, pausado. Contador de vistas.", category: "Marketplace" },
  { name: "agency_comments", description: "Comentarios internos de miembros de la organización en publicaciones de agentes.", category: "Marketplace" },
  { name: "agent_deserter_insights", description: "Vista materializada: insights de descarte por publicación (metadata de feedback, conteo de descartes).", category: "Marketplace" },

  // --- Comentarios & Feedback ---
  { name: "family_comments", description: "Comentarios colaborativos de miembros de una familia/org sobre un user_listing.", category: "Feedback" },
  { name: "user_listing_comment_reads", description: "Tracking de última lectura de comentarios por usuario, para indicar comentarios nuevos/no leídos.", category: "Feedback" },
  { name: "status_history_log", description: "Historial de cambios de estado de user_listings. Guarda old_status, new_status, event_metadata (feedback dinámico), changed_by.", category: "Feedback" },
  { name: "status_feedback_configs", description: "Configuración dinámica de campos de feedback por estado (field_id, field_type: rating/boolean/text/date/info, is_required, sort_order).", category: "Feedback" },

  // --- Geografía ---
  { name: "departments", description: "Departamentos/estados del país (ej. Montevideo, Canelones). Clave: country='UY'.", category: "Geografía" },
  { name: "cities", description: "Ciudades vinculadas a un departamento.", category: "Geografía" },
  { name: "neighborhoods", description: "Barrios vinculados a una ciudad.", category: "Geografía" },

  // --- Configuración & Sistema ---
  { name: "app_settings", description: "Configuración de UI global (key/value): mantenimiento, soporte, botones, tips, video, branding, límites de plan.", category: "Sistema" },
  { name: "system_config", description: "Configuración de sistema (key/value): maintenance_mode, auto_maintenance_protection, thresholds.", category: "Sistema" },
  { name: "system_metrics_history", description: "Historial de métricas de infraestructura: disk_io_budget, rest/auth/realtime/storage requests. Polling periódico.", category: "Sistema" },

  // --- Anuncios ---
  { name: "announcements", description: "Anuncios del admin para usuarios: título, body, audiencia (all/agents/users/specific), prioridad, expiración, imagen.", category: "Anuncios" },
  { name: "announcement_reads", description: "Registro de qué anuncios fueron leídos/descartados por cada usuario.", category: "Anuncios" },

  // --- Auditoría ---
  { name: "deletion_audit_log", description: "Log de borrado físico de usuarios: quién borró, email/nombre del borrado, motivo.", category: "Auditoría" },
  { name: "publication_deletion_audit_log", description: "Log de borrado de publicaciones del marketplace: pub_id, título, org, motivo, quién borró.", category: "Auditoría" },
  { name: "admin_keys", description: "Claves/datos internos del admin: texto, descripción, cuenta, estado (válido/vencido), fecha, trazabilidad.", category: "Auditoría" },
  { name: "details_description", description: "Tabla de contenido manual gestionada por el admin desde la BD para mostrar información personalizada en la UI.", category: "Auditoría" },

  // --- Scraping ---
  { name: "scrape_usage_log", description: "Log de uso del scraper: usuario, URL, canal (url/image), éxito/fallo, mensaje de error, si se cobró token.", category: "Scraping" },

  // --- Búsqueda & Matching ---
  { name: "user_search_profiles", description: "Perfil de búsqueda del usuario: operación (rent/sale), presupuesto min/max, moneda, dormitorios, zona, privacidad.", category: "Búsqueda" },

  // --- Partners ---
  { name: "partners", description: "Socios/aliados del sistema: nombre, tipo, contacto (JSON), estado activo.", category: "Partners" },
  { name: "partner_leads", description: "Leads generados hacia un partner desde un user_listing. Estado: pending.", category: "Partners" },

  // --- Vistas (Views) ---
  { name: "family_private_rating", description: "Vista: rating promedio privado por organización y propiedad (avg, total_votes, detalle).", category: "Vistas" },
  { name: "public_global_rating", description: "Vista: rating promedio global público por propiedad.", category: "Vistas" },
  { name: "admin_scrape_usage_by_user", description: "Vista: resumen de uso del scraper agrupado por usuario (totales, último uso).", category: "Vistas" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Core: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Organizaciones: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Propiedades: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Marketplace: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Feedback: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Geografía: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Sistema: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Anuncios: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Auditoría: "bg-red-500/20 text-red-300 border-red-500/30",
  Scraping: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Búsqueda: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Partners: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  Vistas: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export function DbSchemaTab() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Database className="w-4 h-4 text-emerald-400" />
        <span>{DB_TABLES.length} tablas/vistas documentadas</span>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-white font-extrabold w-[180px] uppercase text-[10px] tracking-wider">Tabla</TableHead>
              <TableHead className="text-white font-extrabold w-[120px] uppercase text-[10px] tracking-wider">Categoría</TableHead>
              <TableHead className="text-white font-extrabold uppercase text-[10px] tracking-wider">Descripción Técnica</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DB_TABLES.map((t) => (
              <TableRow key={t.name} className="border-slate-800/60 hover:bg-slate-800/40">
                <TableCell className="font-mono text-[11px] text-emerald-400 py-3 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 shrink-0 text-emerald-500/50" />
                    {t.name}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border shadow-sm font-bold uppercase tracking-tighter ${CATEGORY_COLORS[t.category] ?? "bg-slate-700 text-slate-100"}`}>
                    {t.category}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-white leading-relaxed py-3 font-medium">
                  {t.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
