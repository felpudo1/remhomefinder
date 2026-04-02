

## Tooltip explicativo en contador de avisos guardados

### Qué se va a hacer
Agregar un tooltip al lado del contador `(1/15+5)` en "Tus Avisos Guardados" que explique qué significa cada número. El texto será condicional según el plan del usuario.

### Cambios

**1. `src/components/MiListadoTabPanel.tsx`**

- Agregar prop `isPremium: boolean` a la interfaz.
- Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` y el ícono `HelpCircle` de lucide.
- Al lado del texto del contador, agregar un ícono `HelpCircle` pequeño envuelto en un Tooltip con texto condicional:
  - **Free**: `"{filteredCount} guardado(s) de {maxSaves} disponibles (versión gratuita). {referralBonus > 0 ? '+X bonus por referido de agente.' : ''}"`
  - **Premium**: `"{filteredCount} guardado(s) de {maxSaves} disponibles (versión premium)."`

**2. `src/pages/Index.tsx`**

- Pasar `isPremium` (ya disponible desde `useSubscription`) como prop a `MiListadoTabPanel`.

