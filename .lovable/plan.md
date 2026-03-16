

## Plan: Diferenciación Link de Oficina vs Link de Referidos

### Resumen

Separar claramente dos sistemas de invitación:
- **Link de Oficina** (`/join/:inviteCode`): Solo el **owner** de la agencia puede ver/copiar. Sirve para que agentes se unan al equipo de trabajo.
- **Link de Referidos** (`/ref/:userId`): **Cualquier usuario** (agente o user) puede copiar y compartir. Sirve para ganar créditos/beneficios.

---

### Cambios a realizar

#### 1. Nuevas páginas

**`src/pages/JoinTeam.tsx`** — Ruta `/join/:inviteCode`
- Busca la org con `find_org_by_invite_code`
- Modal de bienvenida: "¡Bienvenido al equipo de [Nombre Agencia]!"
- Si no está logueado → redirige a `/auth?returnTo=/join/[code]`
- Al aceptar → inserta en `organization_members` como `member` y redirige a `/agente`

**`src/pages/Referral.tsx`** — Ruta `/ref/:userId`
- Modal atractivo con icono Gift, colores verdes
- Persiste el userId en `sessionStorage` (como ya hace `ReferralTracker`)
- Redirige a `/auth` para registro

#### 2. Rutas en `App.tsx` y `constants.ts`
- Agregar `JOIN_TEAM: "/join/:inviteCode"` y `REFERRAL: "/ref/:userId"`

#### 3. Restricción del link de oficina (solo owner)

En `GroupsModal.tsx`, el botón de copiar código de invitación de la org `agency_team` solo se muestra si `currentUserId === agencyOrg.created_by`. Los agentes no-owner ven la org pero **no** pueden copiar/compartir el código.

En la vista de detalle de la org `agency_team`, el bloque de "Código de invitación" también se oculta para no-owners.

#### 4. Componente `AgentTeamLinks.tsx` (nuevo)

Dos tarjetas diferenciadas en el dashboard del agente:

| Tarjeta | Visual | Contenido | Quién la ve |
|---------|--------|-----------|-------------|
| Oficina | Azul, Building2 | Link `/join/[invite_code]` + "Compartí solo con tus agentes" | Solo owner |
| Referidos | Verde, Gift | Link `/ref/[user_id]` + "Invitá clientes y ganá beneficios" | Todos |

Se integra en `AgentDashboard.tsx` reemplazando/complementando `UserReferralSection`.

#### 5. Migración SQL: columna `is_active` en `organization_members`

```sql
ALTER TABLE public.organization_members 
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
```

Actualizar `is_org_member` para filtrar solo activos:
```sql
CREATE OR REPLACE FUNCTION public.is_org_member(...)
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id AND is_active = true
  );
```

#### 6. Gestión de equipo para owners en `GroupsModal.tsx`

En el detalle de la org `agency_team`, si es owner:
- Toggle pausar/activar miembros (actualiza `is_active`)
- Eliminar miembros (ya existe)
- Indicador visual de miembros pausados (badge gris "Pausado")

Requiere política RLS UPDATE en `organization_members` para owners (ya cubierta por "Admins can manage all members" y se agrega una para owners):

```sql
CREATE POLICY "Owners can update members" ON public.organization_members
FOR UPDATE TO authenticated
USING (is_org_owner(auth.uid(), org_id));
```

#### 7. Fix de `useAuthRedirect` para `returnTo`

Asegurar que después del login, si hay `returnTo` en query params, se redirige ahí (para el flujo `/join/:inviteCode`).

---

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/JoinTeam.tsx` | Crear |
| `src/pages/Referral.tsx` | Crear |
| `src/components/agent/AgentTeamLinks.tsx` | Crear |
| `src/App.tsx` | Agregar 2 rutas |
| `src/lib/constants.ts` | Agregar constantes de rutas |
| `src/components/GroupsModal.tsx` | Restringir invite code a owners, agregar toggle is_active |
| `src/hooks/useAuthRedirect.tsx` | Soportar `returnTo` |
| Migración SQL | `is_active` + update `is_org_member` + policy UPDATE para owners |

