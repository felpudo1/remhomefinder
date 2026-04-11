

## Plan: Restaurar overlay obligatorio de teléfono para login con Google

### Problema detectado

En `PhoneRequirementOverlay.tsx` (línea 30-31), hay una condición que **evita mostrar el overlay si existe un guardado pendiente** (`pending_property_save` en sessionStorage):

```typescript
const hasPendingSave = !!sessionStorage.getItem("pending_property_save");
if (... && !hasPendingSave) { setIsOpen(true); }
```

Esto significa que cuando un usuario entra por primera vez desde una vista pública (flujo QR), el overlay de teléfono se omite y nunca se le pide el número.

### Cambio propuesto

**Archivo:** `src/components/PhoneRequirementOverlay.tsx`

Eliminar la condición `!hasPendingSave` de la línea 31. El overlay se mostrará siempre que:
- El usuario esté autenticado con Google
- Su perfil no tenga teléfono cargado

El guardado pendiente puede esperar a que el usuario complete el teléfono; de hecho, esto le da tiempo al trigger de base de datos para crear la organización, lo cual también ayuda al problema del guardado en "Mi listado".

### Detalle técnico

Solo se modifica una línea: quitar la variable `hasPendingSave` y su uso en el `if`. El resto del componente queda intacto.

