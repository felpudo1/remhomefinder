
## Filtros para HFMarket

Se agregaran filtros por **barrio**, **precio** y **ambientes** directamente en la vista del Marketplace, sin afectar los filtros existentes de "Mi Listado".

### Diseno

Los filtros se mostrarán como una fila horizontal de controles debajo del buscador existente, manteniendo el estilo visual del proyecto (rounded-xl, bg-muted, etc.):

- **Barrio**: Select/dropdown con los barrios disponibles (extraidos dinamicamente de las propiedades cargadas)
- **Precio maximo (total)**: Input numerico o slider para filtrar por costo total maximo
- **Ambientes**: Botones/chips para seleccionar cantidad de ambientes (1, 2, 3, 4+)
- **Boton "Limpiar filtros"**: visible solo cuando hay filtros activos

### Cambios tecnicos

**Archivo: `src/components/MarketplaceView.tsx`**

1. Agregar estados para los tres filtros: `selectedNeighborhood`, `maxPrice`, `selectedRooms`
2. Calcular lista de barrios unicos desde `marketplaceProperties` con `useMemo`
3. Extender el `useMemo` de `filtered` para aplicar los tres filtros ademas de la busqueda por texto
4. Renderizar una fila de filtros entre el buscador y la grilla de resultados, usando:
   - `Select` de radix para barrio
   - `Input` numerico para precio maximo
   - Chips/botones toggle para ambientes (1, 2, 3, 4+)
   - Boton "Limpiar" condicional

No se crean archivos nuevos ni se modifican otros componentes. Los filtros de "Mi Listado" (FilterSidebar) quedan intactos.
