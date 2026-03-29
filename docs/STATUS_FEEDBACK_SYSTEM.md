# Sistema de Feedback Dinámico - Documentación Técnica

## 📋 Descripción

Sistema de configuración dinámica para formularios de feedback de propiedades. Permite administrar campos (estrellas, texto, fecha, info) desde el panel de admin sin modificar código.

---

## 🗄️ Esquema de Base de Datos

### Tabla: `status_feedback_configs`

```sql
CREATE TABLE status_feedback_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL,           -- Estado: "contactado", "visita_coordinada", etc.
    field_id TEXT NOT NULL,         -- Identificador del campo: "contacted_interest"
    field_label TEXT NOT NULL,      -- Label visible: "Interés inicial"
    field_type feedback_field_type, -- Tipo: rating, text, date, info, boolean
    is_required BOOLEAN,            -- ¿Es obligatorio?
    placeholder TEXT,               -- Placeholder para text/date
    sort_order INTEGER,             -- Orden de visualización
    is_active BOOLEAN,              -- Soft delete: true = activo, false = eliminado
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    
    -- Índice parcial único (NO constraint tradicional)
    -- Permite reusar field_id de campos inactivos
    UNIQUE NULLS NOT DISTINCT (status, field_id) -- Ver índice: idx_unique_active_field
);
```

### Tipo Enum: `feedback_field_type`

```sql
CREATE TYPE feedback_field_type AS ENUM (
    'rating',   -- Estrellas 1-5
    'text',     -- Texto corto (input)
    'date',     -- Fecha/hora (datetime-local)
    'info',     -- Texto informativo (solo lectura, sin input)
    'boolean'   -- Booleano (checkbox) - pendiente de implementar
);
```

### Índice Parcial Único

```sql
-- Clave para entender el soft delete
CREATE UNIQUE INDEX idx_unique_active_field 
ON status_feedback_configs (status, field_id) 
WHERE is_active = true;
```

**¿Qué hace?**
- ✅ Previene duplicados de campos **activos** con mismo `(status, field_id)`
- ✅ Permite reusar `field_id` si el registro anterior está **inactivo** (`is_active = false`)
- ✅ Mantiene integridad de datos históricos

---

## 🔗 Relaciones con Otras Tablas

### Diagrama de Flujo

```
┌─────────────────────────┐
│ status_feedback_configs │  ← Configuración (admin)
│ - status: "contactado"  │
│ - field_id: "interest"  │
│ - field_type: "rating"  │
│ - is_active: true       │
└───────────┬─────────────┘
            │ configura
            ↓
┌─────────────────────────┐
│ status_history_log      │  ← Datos históricos (usuarios)
│ - user_listing_id       │
│ - new_status: "contact" │
│ - event_metadata: {     │
│     "interest": 4,      │
│     "urgency": 3        │
│   }                     │
└───────────┬─────────────┘
            │ se lee en
            ↓
┌─────────────────────────┐
│ AgentPropertyListing    │  ← Dashboard del agente
│ - Muestra ratings       │
│ - Lee de event_metadata │
└─────────────────────────┘
```

### Tabla: `status_history_log`

```sql
-- Los datos de feedback se guardan aquí
INSERT INTO status_history_log (
    user_listing_id,
    new_status,
    changed_by,
    event_metadata  -- JSONB con datos dinámicos
) VALUES (
    'uuid-del-listing',
    'contactado',
    'uuid-del-usuario',
    {
      "contacted_interest": 4,
      "contacted_urgency": 3,
      "contact_name": "Juan Pérez"
    }
);
```

**Las keys del JSONB** coinciden con los `field_id` de `status_feedback_configs`.

---

## 🎯 Por Qué Usamos Soft Delete

### ❌ Problema con Hard Delete

```
1. Admin crea campo "contacted_interest" (rating)
2. 100 usuarios completan feedback → se guarda en event_metadata
3. Admin elimina campo (hard delete)
4. Dashboard del agente intenta leer:
   const interest = event_metadata.contacted_interest;
   // ¿Qué mostramos? ¿El campo ya no existe!
   // → Datos huérfanos, UI rota
```

### ✅ Solución con Soft Delete

```
1. Admin crea campo "contacted_interest" (rating)
2. 100 usuarios completan feedback → se guarda en event_metadata
3. Admin elimina campo (is_active = false)
4. Modal YA NO muestra el campo (filtro WHERE is_active = true)
5. Dashboard DEL AGENTE puede seguir leyendo datos históricos
6. Admin puede crear NUEVO campo con mismo field_id
```

---

## 📚 Funciones de Base de Datos

### `get_status_feedback_config(p_status TEXT)`

```sql
-- Retorna campos activos para un status específico
SELECT * FROM get_status_feedback_config('contactado');

-- Resultado:
-- id | field_id | field_label | field_type | is_required | sort_order
```

**Código de uso (TypeScript):**
```typescript
const { data: fields } = await supabase
  .rpc("get_status_feedback_config", { p_status: "contactado" });
```

---

## 🔧 Operaciones CRUD

### Crear Campo

```typescript
await supabase.from("status_feedback_configs").insert({
  status: "contactado",
  field_id: "contacted_interest",
  field_label: "📞 Interés inicial",
  field_type: "rating",
  is_required: true,
  sort_order: 2,
  is_active: true,
});
```

### Leer Campos Activos

```typescript
const { data } = await supabase
  .from("status_feedback_configs")
  .select("*")
  .eq("status", "contactado")
  .eq("is_active", true)
  .order("sort_order");
```

### Actualizar Campo

```typescript
await supabase.from("status_feedback_configs")
  .update({ field_label: "Nuevo Label", sort_order: 3 })
  .eq("id", "uuid-del-campo");
```

### Eliminar Campo (Soft Delete)

```typescript
await supabase.from("status_feedback_configs")
  .update({ is_active: false })  // ← NO usar .delete()
  .eq("id", "uuid-del-campo");
```

### Reusar Field ID de Campo Eliminado

```typescript
// Esto AHORA funciona gracias al índice parcial:

// 1. Campo original existe
{ field_id: "contacted_interest", is_active: true }

// 2. Admin lo elimina
{ field_id: "contacted_interest", is_active: false }

// 3. Admin crea nuevo campo con mismo field_id → ✅ FUNCIONA
{ field_id: "contacted_interest", is_active: true }  // ← Válido!
```

---

## 📊 Consultas Útiles

### Ver Campos Activos por Status

```sql
SELECT status, field_id, field_label, field_type, is_required, sort_order
FROM status_feedback_configs
WHERE is_active = true
ORDER BY status, sort_order;
```

### Ver Campos Eliminados (Soft Delete)

```sql
SELECT status, field_id, field_label, deleted_at
FROM status_feedback_configs
WHERE is_active = false
ORDER BY updated_at DESC;
```

### Ver Históricos que Usan un Campo Eliminado

```sql
-- Cuántos registros tienen datos para un campo específico
SELECT COUNT(*) 
FROM status_history_log
WHERE event_metadata->>'contacted_interest' IS NOT NULL;
```

### Auditoría: ¿Quién Eliminó Qué Campo?

```sql
-- Nota: Requiere agregar columna deleted_by si se quiere trackear
SELECT 
    field_label,
    updated_at as deleted_at
FROM status_feedback_configs
WHERE is_active = false
ORDER BY updated_at DESC;
```

---

## ⚠️ Advertencias y Buenas Prácticas

### ✅ DOs

- ✅ **Siempre** usar soft delete (`is_active = false`)
- ✅ **Siempre** verificar `is_active = true` al leer campos para el modal
- ✅ **Siempre** mantener datos históricos para el dashboard del agente
- ✅ Usar `idx_unique_active_field` para validar unicidad

### ❌ DON'Ts

- ❌ **NUNCA** hacer `DELETE FROM status_feedback_configs WHERE id = ...`
- ❌ **NUNCA** cambiar el `field_type` de un campo con datos históricos
- ❌ **NUNCA** renombrar `field_id` si ya hay datos en `status_history_log`

### 🔄 Migración de Campos

Si necesitás cambiar un campo existente:

```sql
-- MAL: Cambiar tipo de campo existente
UPDATE status_feedback_configs 
SET field_type = 'text' 
WHERE field_id = 'contacted_interest';  -- ❌ Rompe datos históricos!

-- BIEN: Crear campo nuevo, mantener viejo inactivo
-- 1. Marcar viejo como inactivo
UPDATE status_feedback_configs 
SET is_active = false 
WHERE field_id = 'contacted_interest';

-- 2. Crear nuevo campo con diferente field_id
INSERT INTO status_feedback_configs (
    status, field_id, field_label, field_type, is_active
) VALUES (
    'contactado', 'contacted_interest_v2', 'Interés (nuevo)', 'text', true
);
```

---

## 🧩 Componentes del Frontend

### Hooks

| Hook | Descripción |
|------|-------------|
| `useStatusFeedbackConfig(status)` | Lee campos activos para un status |
| `useAllStatusFeedbackConfigs()` | Lee TODOS los campos (para admin) |
| `useStatusFeedbackConfigMutation()` | CRUD de campos (create/update/delete) |

### Componentes

| Componente | Descripción |
|------------|-------------|
| `GenericStatusFeedbackDialog` | Modal dinámico (lee config de BD) |
| `AdminStatusFeedbackConfig` | Panel de administración |
| `RatingField` | Componente de estrellas (soporta modo inline) |

---

## 📝 Ejemplo de Uso Completo

### 1. Admin Configura Campos

```typescript
// URL: /admin/feedback
// Admin agrega campos para "contactado":
- 📞 Nombre del contacto (text, required)
- ⭐ Interés inicial (rating, required)
- ⭐ Urgencia de mudanza (rating, required)
```

### 2. Usuario Completa Feedback

```typescript
// URL: /dashboard
// Usuario cambia estado a "contactado":
<GenericStatusFeedbackDialog
  status="contactado"
  onConfirm={(metadata) => {
    // metadata = {
    //   contact_name: "Juan Pérez",
    //   contacted_interest: 4,
    //   contacted_urgency: 3
    // }
    
    updateStatus(propertyId, "contactado", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, metadata);
  }}
/>
```

### 3. Datos se Guardan

```typescript
// status_history_log
{
  user_listing_id: "uuid-123",
  new_status: "contactado",
  event_metadata: {
    contact_name: "Juan Pérez",
    contacted_interest: 4,
    contacted_urgency: 3
  }
}
```

### 4. Dashboard del Agente Lee Datos

```typescript
// URL: /agente
const { data: insights } = useAgentPropertyInsights(agencyId);

// insights[0].users[0].ratingsByStatus.contacted
// = {
//     contact_name: "Juan Pérez",
//     contacted_interest: 4,
//     contacted_urgency: 3
//   }
```

---

## 🚨 Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Causa:** Intentás crear un campo con `field_id` que ya existe activo.

**Solución:**
```sql
-- Verificar si existe campo activo
SELECT * FROM status_feedback_configs
WHERE status = 'contactado' 
AND field_id = 'contacted_interest'
AND is_active = true;

-- Si existe y querés reusar el ID, eliminálo primero (soft delete)
UPDATE status_feedback_configs
SET is_active = false
WHERE status = 'contactado' 
AND field_id = 'contacted_interest';

-- Ahora podés crear el nuevo campo
```

### Error: "Campo no se muestra en el modal"

**Causa:** El campo tiene `is_active = false`.

**Solución:**
```sql
UPDATE status_feedback_configs
SET is_active = true
WHERE field_id = 'tu_campo';
```

### Error: "Dashboard muestra datos undefined"

**Causa:** El campo fue eliminado pero el histórico tiene datos.

**Solución:**
- No eliminar campos con datos históricos
- O: Mantener el campo inactivo pero no reusar el `field_id`

---

## 📞 Soporte

Para dudas o problemas con este sistema:

1. Revisar esta documentación
2. Ver migraciones en `/supabase/migrations/`
3. Consultar con el mantenedor del repo

---

**Última actualización:** 2026-03-29  
**Autor:** JP  
**Versión:** 1.0
