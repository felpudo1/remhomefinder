

## Plan: "Otro motivo" con motivos rápidos administrables en el diálogo de descarte

### Resumen

Agregar un checkbox "Otro motivo" al final del formulario de descarte que, al activarse, muestra un dropdown con motivos predefinidos (administrables por el admin). Cuando se selecciona un motivo rápido, las estrellas dejan de ser obligatorias. Los datos se guardan en `event_metadata` como JSON igual que el resto del feedback.

### Cambios

#### 1. Base de datos — Nueva tabla `discard_quick_reasons`

Crear una tabla simple para los motivos rápidos administrables:

```sql
CREATE TABLE public.discard_quick_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discard_quick_reasons ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer, solo admins pueden gestionar
CREATE POLICY "Auth can read" ON public.discard_quick_reasons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage" ON public.discard_quick_reasons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Datos iniciales
INSERT INTO public.discard_quick_reasons (label, sort_order) VALUES
  ('Incompatible garantía', 1),
  ('No mascotas', 2),
  ('Sin lugar moto', 3),
  ('Sin lugar auto', 4);
```

#### 2. Hook nuevo — `useDiscardQuickReasons`

Hook simple que lee los motivos activos de la tabla `discard_quick_reasons` ordenados por `sort_order`. Se usa en el diálogo de descarte.

Archivo: `src/hooks/useDiscardQuickReasons.ts`

#### 3. Modificar `GenericStatusFeedbackDialog.tsx`

Solo para el estado `descartado`:

- Agregar al final del formulario un checkbox "Otro motivo" (con un icono tipo ⚡).
- Al activarlo, mostrar un `<Select>` con los motivos cargados del hook.
- **Lógica de validación**: si "Otro motivo" está activado y hay un motivo seleccionado del dropdown, los campos de rating dejan de ser requeridos (se pueden dejar en 0). El motivo de texto libre (`descppal`) también deja de ser obligatorio.
- Al confirmar, se agrega `quick_reason_id` y `quick_reason_label` al `formData` que se pasa a `onConfirm`.

#### 4. Almacenamiento en `event_metadata` (sin cambios en la estructura)

Los datos ya se guardan como JSONB en `status_history_log.event_metadata`. Se agregarán dos campos al JSON:
- `quick_reason_id`: UUID del motivo seleccionado
- `quick_reason_label`: texto del motivo (para referencia rápida sin join)

No requiere migración adicional porque `event_metadata` es JSONB libre.

#### 5. Panel Admin — CRUD de motivos rápidos

Agregar una sección en el admin (dentro de `AdminStatusFeedbackConfig` o como sub-sección) para que el admin pueda:
- Ver la lista de motivos rápidos
- Agregar nuevos motivos
- Editar/desactivar motivos existentes
- Reordenar

#### 6. Estadísticas del agente

En el panel de estadísticas del agente (`AgentPropertyListing` / insights), donde ya se muestra el `event_metadata` del descarte, se mostrará el `quick_reason_label` si existe, permitiendo al agente ver el motivo puntual de descarte.

### Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| Migración SQL | Crear tabla `discard_quick_reasons` + datos iniciales |
| `src/hooks/useDiscardQuickReasons.ts` | Crear — hook para leer motivos |
| `src/components/property-card/dialogs/GenericStatusFeedbackDialog.tsx` | Modificar — agregar checkbox + dropdown para descartado |
| `src/components/admin/status-feedback/AdminStatusFeedbackConfig.tsx` | Modificar — agregar sección CRUD de motivos rápidos |
| Panel agente (donde muestra insights de descarte) | Modificar — mostrar `quick_reason_label` |

### Flujo del usuario

```text
User descarta propiedad
  → Se abre GenericStatusFeedbackDialog (status=descartado)
  → Ve los campos de rating y texto como siempre
  → Al final ve un checkbox "⚡ Otro motivo"
  → Si lo activa:
      → Aparece dropdown con motivos del admin
      → Las estrellas y texto libre ya NO son obligatorios
      → Puede guardar solo con el motivo rápido seleccionado
  → Al confirmar: todo va a event_metadata como JSON
```

