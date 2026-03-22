# 🔍 Evaluación Técnica Integral — HomeFinder
**Fecha:** 22 de marzo de 2026  
**Auditor:** Lovable AI — Revisión exhaustiva de arquitectura, seguridad, rendimiento, UX y calidad de código  
**Versión de revisión:** v3.0  
**Build status:** ✅ EXITOSO (8.69s)  
**Tests:** ✅ 16/16 passed (5 suites)

---

## 📊 Métricas Generales del Proyecto

| Métrica | Valor |
|---|---|
| Archivos fuente (`.ts` / `.tsx`) | 185 |
| Líneas de código fuente (sin `types.ts` generado) | ~25,923 |
| Migraciones SQL | 33 |
| Tablas de base de datos | 23 + 5 vistas |
| Funciones de base de datos (SECURITY DEFINER) | 21 |
| Políticas RLS activas | ~45 |
| Edge Functions | 3 (`scrape-property`, `extract-from-image`, `find-user-by-email`) |
| Suites de test | 5 |
| Tests unitarios | 16 |
| Bundles principales | 9 chunks (lazy-loaded) |
| Bundle más grande | `index-CM1xPCCo.js` — 512.57 kB (154.64 kB gzip) ⚠️ |

---

## 1. ARQUITECTURA (Puntuación: 8.5/10)

### 1.1 Patrón de diseño
- **Facade Pattern** consistente: `useProperties` → `usePropertyQueries` + `usePropertyMutations`.
- **Separación de responsabilidades**: hooks para lógica de negocio, componentes para presentación.
- **Lazy loading con reintentos** (`lazyWithRetry.ts`) para todas las páginas principales.
- **Estado global mínimo** via Zustand (`useUIStore.ts`) — solo para UI transversal.
- **TanStack Query v5** para server state con `queryKey` semánticas y optimistic updates.

### 1.2 Deuda técnica identificada

| Archivo | Líneas | Problema | Severidad |
|---|---|---|---|
| `Index.tsx` | 657 | God component: 30+ useState, lógica de modales, filtros, búsqueda, tips. | 🔴 Alta |
| `AgentProperties.tsx` | 412 | Lógica de matchmaking inline (60+ líneas de matching dentro del queryFn). | 🟡 Media |
| `usePropertyQueries.ts` | 407 | QueryFn monolítica con 11 consultas paralelas y 12 mapas de datos. | 🟡 Media |
| `usePropertyMutations.ts` | 363 | `updateStatus` acepta 12+ parámetros opcionales (code smell). | 🟡 Media |
| `BuyerProfileModal.tsx` | 303 | Modal monolítico con fetch de ciudades/barrios inline. | 🟢 Baja |
| `Auth.tsx` | 480 | Formulario de login/registro en un solo archivo. | 🟡 Media |

### 1.3 Fortalezas arquitectónicas
- ✅ Constantes centralizadas (`constants.ts`, `config-keys.ts`).
- ✅ Tipos Supabase auto-generados + type aliases semánticos (`types/supabase.ts`).
- ✅ Configuración del sistema via tabla `system_config` (branding dinámico, feature flags).
- ✅ Realtime subscriptions para `user_listings`, `properties`, `family_comments`, `attachments`, `comment_reads`.
- ✅ Zod validation en auth (`loginSchema`, `registerSchema`, `passwordResetSchema`).

### 1.4 Recomendaciones
1. Extraer lógica de matchmaking de `AgentProperties.tsx` a un hook `useAIMatchmaker`.
2. Refactorizar `Index.tsx` en sub-componentes: `PropertyListView`, `FloatingActions`, `WelcomeOverlays`.
3. Crear un tipo `UpdateStatusParams` para reemplazar los 12 parámetros posicionales de `updateStatus`.

---

## 2. SEGURIDAD (Puntuación: 9.0/10)

### 2.1 Row-Level Security (RLS)

| Tabla | RLS | Calidad de Políticas |
|---|---|---|
| `profiles` | ✅ | 6 políticas: own, org-members, agents-for-pubs, admins. Email/phone protegidos. |
| `user_roles` | ✅ | Solo `SELECT` own + admin `ALL`. Correcto. |
| `organization_members` | ✅ | INSERT restringido: solo `role=member`, `is_system_delegate=false`. |
| `user_listings` | ✅ | Aislamiento por org_id. Agents ven solo listings vinculados a sus publicaciones. |
| `agent_publications` | ✅ | Org members + admins. Non-deleted visible para todos los authenticated. |
| `status_history_log` | ✅ | Insert: own + org_member. Select: org_member + agents-for-pubs + admin. |
| `properties` | ✅ | Lectura pública (anon + auth). Insert: created_by = auth.uid(). |
| `user_search_profiles` | ✅ | Own CRUD + SELECT para agents/agencymembers/admins. |
| `cities`, `neighborhoods` | ✅ | Solo SELECT público. Sin INSERT/UPDATE/DELETE. |
| `deletion_audit_log` | ✅ | Solo SELECT para admins. Sin INSERT/DELETE client-side. |
| `scrape_usage_log` | ✅ | Solo SELECT para admins. Insert via Edge Function. |

### 2.2 Funciones SECURITY DEFINER

| Función | Propósito | Bypass RLS | Validación |
|---|---|---|---|
| `has_role(_user_id, _role)` | Verificar rol de app | Sí | Parámetros tipados (`app_role`) |
| `is_org_member(_user_id, _org_id)` | Verificar membresía org | Sí | Parámetros tipados |
| `is_org_owner(_user_id, _org_id)` | Verificar ownership | Sí | Parámetros tipados |
| `is_system_delegate(_user_id)` | Verificar delegate flag | Sí | UUID tipado |
| `admin_physical_delete_user` | Borrado físico (audit) | Sí | `has_role(admin)` check interno |
| `admin_update_profile_status` | Cambiar status de perfil | Sí | `has_role(admin)` check interno |
| `get_search_profile_contacts` | Contactos de leads AI | Sí | Filtra `is_private = false` |
| `get_marketplace_publication_contacts` | Contactos de agentes | Sí | Filtra `status <> eliminado` |
| `get_marketplace_org_names` | Nombres de orgs marketplace | Sí | Filtra por publicaciones activas |
| `get_publications_save_counts` | Conteo de guardados | Sí | Solo conteo agregado |
| `count_property_listing_users` | Conteo de usuarios por propiedad | Sí | Solo conteo agregado |
| `increment_property_views` | Incrementar vistas | Sí | Sin datos sensibles |
| `find_org_by_invite_code` | Buscar org por código | Sí | Solo campos públicos (id, name, type) |
| `trg_validate_listing_quota` | Validar cupo plan free | Sí (trigger) | Lógica de negocio validada |
| `trg_validate_sub_teams` | Limitar sub-equipos a 5 | Sí (trigger) | Count-based validation |
| `trg_sync_listing_status` | Sincronizar status de listing | Sí (trigger) | Automático tras insert en history |

### 2.3 Hallazgos de seguridad

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| S-1 | Roles almacenados en tabla separada `user_roles` (no en profiles). | ✅ Correcto | — |
| S-2 | No se usan localStorage/sessionStorage para verificar roles admin. | ✅ Correcto | — |
| S-3 | `ProtectedRoute` verifica roles server-side via `user_roles` table. | ✅ Correcto | — |
| S-4 | `organization_members` INSERT restringe a `role=member` y bloquea `is_system_delegate`. | ✅ Correcto | — |
| S-5 | `profiles` email/phone accesible solo a org-members compartidos o admins. | ✅ Correcto | — |
| S-6 | `get_search_profile_contacts` filtra perfiles privados (`is_private`). | ✅ Correcto | — |
| S-7 | `BuyerProfileModal` usa `localStorage` para flag de completado — solo UX, no seguridad. | ✅ Aceptable | — |
| S-8 | `signUp` envía `account_type` via `raw_user_meta_data` — trigger server-side decide el rol. | ✅ Correcto | — |
| S-9 | `admin_physical_delete_user` incluye auditoría previa al borrado. | ✅ Correcto | — |
| S-10 | `user_search_profiles` no tiene policy DELETE — los perfiles de búsqueda no se pueden borrar. | ⚠️ Intencional | Verificar si es deseado |
| S-11 | `agent_publications` visible para todos los `authenticated` si `status <> eliminado`. | ⚠️ Bajo riesgo | Marketplace público |
| S-12 | Secretos Edge Function (`ZENROWS_API_KEY`, `FIRECRAWL_API_KEY`) almacenados en Supabase Vault. | ✅ Correcto | — |

### 2.4 Puntuación de seguridad por capa

| Capa | Puntuación |
|---|---|
| Autenticación (Supabase Auth) | 9.5/10 |
| Autorización (RLS + funciones) | 9.0/10 |
| Privacidad de datos | 9.0/10 |
| Protección de secretos | 9.5/10 |
| Validación de entrada | 8.5/10 |

---

## 3. BASE DE DATOS (Puntuación: 9.0/10)

### 3.1 Esquema

| Tabla | FK a profiles | Cascade Delete | Propósito |
|---|---|---|---|
| `user_roles` | `user_id` | CASCADE | Roles de aplicación |
| `organization_members` | `user_id` | CASCADE | Membresías de organización |
| `properties` | `created_by` | CASCADE | Propiedades inmobiliarias |
| `user_listings` | `added_by` | CASCADE | Listados personales por org |
| `agent_publications` | `published_by` | CASCADE | Publicaciones de marketplace |
| `family_comments` | `user_id` | CASCADE | Comentarios familiares |
| `agency_comments` | `user_id` | CASCADE | Comentarios de agencia |
| `status_history_log` | `changed_by` | CASCADE | Historial de transiciones |
| `attribute_scores` | via `history_log_id` | CASCADE (indirecto) | Puntuaciones de feedback |
| `property_reviews` | `user_id` | CASCADE | Calificaciones de propiedades |
| `partner_leads` | `user_id` | CASCADE | Leads de partners |
| `user_search_profiles` | `user_id` (sin FK explícita ⚠️) | — | Perfiles de búsqueda IA |
| `app_settings` | `updated_by` | SET NULL | Configuración del sistema |

### 3.2 Hallazgos de base de datos

| # | Hallazgo | Severidad |
|---|---|---|
| DB-1 | `user_search_profiles.user_id` no tiene FK explícita a `profiles.user_id`. | 🟡 Media |
| DB-2 | `user_search_profiles` no soporta DELETE — usuarios no pueden eliminar su perfil de búsqueda. | 🟡 Media |
| DB-3 | Trigger `trg_sync_listing_status` actualiza `user_listings.current_status` automáticamente tras insert en `status_history_log`. | ✅ Correcto |
| DB-4 | Trigger `trg_validate_listing_quota` limita plan free a 5 propiedades por org. | ✅ Correcto |
| DB-5 | Trigger `trg_validate_sub_teams` limita a 5 sub-equipos por organización. | ✅ Correcto |
| DB-6 | Vista `agent_deserter_insights` agrega datos de descarte por publicación. | ✅ Correcto |
| DB-7 | Vista `property_insights_summary` agrega scores de atributos por propiedad. | ✅ Correcto |
| DB-8 | `properties.source_url` tiene constraint UNIQUE implícito (23505 handled en código). | ✅ Correcto |
| DB-9 | `event_metadata` en `status_history_log` es JSONB flexible — schema-less. | ⚠️ Aceptable (tradeoff flexibilidad vs validación) |
| DB-10 | 33 migraciones en 8 días (15-22 marzo) — ritmo de desarrollo alto. | ℹ️ Informativo |

---

## 4. RENDIMIENTO (Puntuación: 7.5/10)

### 4.1 Bundle analysis

| Chunk | Tamaño | Gzip | Evaluación |
|---|---|---|---|
| `index` (vendor) | 512.57 kB | 154.64 kB | 🔴 Excede 500kB — tree-shaking de Recharts/lucide pendiente |
| `Index` (dashboard) | 132.91 kB | 38.70 kB | 🟡 Grande — extraer componentes |
| `Admin` | 172.17 kB | 41.70 kB | 🟡 Grande — lazy loading de tabs internas |
| `AgentDashboard` | 74.63 kB | 21.18 kB | ✅ Aceptable |
| `es` (locale) | 394.06 kB | 108.79 kB | 🟡 date-fns locale completo |

### 4.2 Consultas de red

| Operación | Queries simultáneas | Evaluación |
|---|---|---|
| Carga de dashboard usuario | 11 queries en paralelo (`Promise.all`) | ✅ Optimizado |
| Carga de panel agente | 2 queries secuenciales (search_profiles → publications) | 🟡 Aceptable |
| Matchmaking IA | Client-side filtering (O(n*m) perfiles × propiedades) | ⚠️ Escalabilidad limitada |
| Realtime | 2 canales (listings + comments) | ✅ Correcto |

### 4.3 Hallazgos de rendimiento

| # | Hallazgo | Severidad |
|---|---|---|
| P-1 | Matchmaking IA se ejecuta en el cliente (O(n*m)). Con 1000 perfiles × 50 propiedades = 50,000 comparaciones por render. | 🟡 Media |
| P-2 | `console.log` de debug activos en matchmaker (logs extensos en producción). | 🟡 Media |
| P-3 | `usePropertyQueries` hace 11 queries pero las agrupa en `Promise.all`. | ✅ Bien optimizado |
| P-4 | Debounce de 300ms en búsqueda de texto. | ✅ Correcto |
| P-5 | Images lazy loading vía `PropertyCardBase`. | ✅ Correcto |
| P-6 | Chunk `index` excede 500kB — considerar `manualChunks` en Vite config. | 🟡 Media |
| P-7 | Locale `es` de date-fns carga completo (394kB). | 🟡 Media |

---

## 5. LÓGICA DE NEGOCIO (Puntuación: 9.0/10)

### 5.1 Flujo de estados (user_listings)

```
ingresado → contactado → visita_coordinada → visitado
                ↓                                  ↓
          firme_candidato ←←←←←←←←←←←←←←←← a_analizar
                ↓                                  ↓
          posible_interes                    descartado
                ↓
         meta_conseguida
```

Cada transición captura feedback obligatorio en `event_metadata`:
- **Contactado**: `contacted_name`, `interest` (1-5), `urgency` (1-5)
- **Visita coordinada**: `coordinated_date`, `agent_response_speed`, `attention_quality`
- **Descartado**: `reason` + `attribute_scores` + encuesta (5 dimensiones)
- **Firme candidato / Posible interés**: Pros & contras via `attribute_scores` (score 5=pro, 1=con)
- **Meta conseguida**: 5 valoraciones de agente + app + precio + celebración modal
- **Firme candidato**: 5 scores de cierre (precio, condición, seguridad, garantía, mudanza)

### 5.2 AI Matchmaker

| Criterio | Implementación | Evaluación |
|---|---|---|
| Operación (Comprar/Alquilar) | Normalización case-insensitive | ✅ |
| Moneda | Mapeo U$S↔USD, $↔ARS/UYU | ✅ |
| Rango de presupuesto | min_budget ≤ total_cost ≤ max_budget | ✅ |
| Dormitorios | propRooms ≥ userDorms | ✅ |
| Geografía | city_id + neighborhood_ids intersection | ✅ |
| Privacidad | `is_private = true` → excluido | ✅ |
| Contacto de leads | `get_search_profile_contacts` (SECURITY DEFINER) | ✅ |
| Reactividad | Signature hash de perfiles → queryKey dependency | ✅ |

### 5.3 Suscripciones / Planes

| Feature | Free | Premium |
|---|---|---|
| Propiedades por org | 5 (trigger DB) | Ilimitado |
| Publicaciones de agente | Limitado (configurable) | Ilimitado |
| Welcome modal | — | Modal de bienvenida una vez |

### 5.4 Sistema de referidos
- `profiles.referred_by_id` → FK a `profiles.user_id`.
- Ruta pública `/ref/:userId` persiste `hf_referral_id` en `sessionStorage`.
- Se captura en `signUp` y se envía en el upsert de `profiles`.

---

## 6. UX / INTERFAZ (Puntuación: 8.0/10)

### 6.1 Accesibilidad
- ✅ Componentes shadcn/ui con roles ARIA correctos (Dialog, Popover, Select).
- ✅ `aria-expanded` en combobox de barrios (BuyerProfileModal).
- ⚠️ Falta `aria-label` en botones de icono (RefreshCw, Plus flotante).
- ⚠️ Sin skip-to-content link.

### 6.2 Responsive
- ✅ Grids responsivos (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- ✅ Filtros móviles con overlay (`isMobileFiltersOpen`).
- ✅ Botones flotantes solo en mobile (`lg:hidden`).
- ✅ Dialog maxWidth controlado (`sm:max-w-xl`).

### 6.3 Feedback al usuario
- ✅ Toast notifications para todas las operaciones (éxito, error, permisos).
- ✅ Loading states con `Loader2 animate-spin` en todas las operaciones async.
- ✅ Optimistic updates en cambio de status (`onMutate` en `usePropertyMutations`).
- ✅ Rollback en error (`onError` restaura `previousProperties`).
- ✅ Modal obligatorio para perfil de búsqueda (`BuyerProfileModal` no-dismiss).

### 6.4 Hallazgos UX

| # | Hallazgo | Severidad |
|---|---|---|
| UX-1 | `BuyerProfileModal` bloquea interacción (no-dismiss). Podría frustrar usuarios que quieren explorar primero. | 🟡 Decisión de diseño |
| UX-2 | Toast sarcástico "¡Vivimos en el S. XXI!" puede percibirse como agresivo. | 🟡 Tono |
| UX-3 | 30+ hooks `useState` en `Index.tsx` indica complejidad de UI. | 🟡 Mantenibilidad |

---

## 7. CALIDAD DE CÓDIGO (Puntuación: 8.0/10)

### 7.1 TypeScript
- ✅ Tipos Supabase auto-generados + aliases semánticos.
- ✅ `as const` en constantes.
- ⚠️ `noImplicitAny: false` y `strictNullChecks: false` en tsconfig.json — reduce seguridad de tipos.
- ⚠️ Uso de `any` en 15+ lugares (ej: `propertyToEdit: any`, `pub: any`, `listing.properties as any`).

### 7.2 Testing
- 5 suites, 16 tests — cobertura limitada a utilidades y un hook.
- Sin tests de integración para flujos críticos (auth, matchmaking, status transitions).
- Sin tests para Edge Functions.

### 7.3 Documentación
- ✅ JSDoc en hooks principales (`useAuth`, `useProperties`, `usePropertyQueries`).
- ✅ `ARCHITECTURE.md`, `SETUP.md`, `CONTRIBUTING.md`.
- ✅ Evaluación técnica previa documentada (`docs/EVALUACION-TECNICA-2026-03-19.md`).
- ✅ Playbooks de rollback (`PLAYBOOK-ROLLBACK-CODIGO-BD.md`).

---

## 8. RESUMEN EJECUTIVO

### Puntuación Global: 8.4/10

| Dimensión | Puntuación | Tendencia vs v2.0 |
|---|---|---|
| Arquitectura | 8.5/10 | ↗️ (+0.5) |
| Seguridad | 9.0/10 | → (estable) |
| Base de datos | 9.0/10 | ↗️ (+0.5) |
| Rendimiento | 7.5/10 | → (estable) |
| Lógica de negocio | 9.0/10 | ↗️ (+1.0) |
| UX/Interfaz | 8.0/10 | → (estable) |
| Calidad de código | 8.0/10 | → (estable) |

### Top 5 acciones prioritarias

1. **🔴 Refactorizar `Index.tsx`** (657 líneas): Extraer a 3-4 componentes enfocados.
2. **🟡 Extraer matchmaking a hook**: Mover lógica de matching de `AgentProperties` a `useAIMatchmaker`.
3. **🟡 Eliminar console.log de producción**: 4 console.log extensos en matchmaker.
4. **🟡 Habilitar `strictNullChecks`**: Detectará bugs sutiles en toda la codebase.
5. **🟡 Agregar FK a `user_search_profiles.user_id`**: Asegurar integridad referencial con CASCADE delete.

### Últimos cambios auditados (22/03/2026)
- ✅ Migración `get_search_profile_contacts` — función SECURITY DEFINER correctamente implementada.
- ✅ Enriquecimiento de leads en `AgentProperties.tsx` via RPC — bypass de RLS seguro.
- ✅ `MatchLeadsList.tsx` muestra nombre, teléfono y botón WhatsApp con fallbacks correctos.
- ✅ Datos de contacto verificados en logs de consola: `display_name` y `phone` se resuelven correctamente.

---

*Documento generado automáticamente por Lovable AI. Revisión basada en análisis estático del código fuente, esquema de base de datos, políticas RLS, funciones SECURITY DEFINER, configuración de build y ejecución de tests.*
