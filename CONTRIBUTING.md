# 🤝 Contribuir — RemHomeFinder

Guía para quien va a tocar código: estilo, tests, y a quién acudir. Pensada para el dev del mañana y para mantener consistencia en futuros movimientos.

---

## 1. Antes de empezar

- **Revisar la documentación:** [docs/README.md](docs/README.md) (índice), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (flujos) y [docs/CHANGELOG.md](docs/CHANGELOG.md) (decisiones y mapa de archivos).
- **Setup local:** seguir [docs/SETUP.md](docs/SETUP.md) para clonar, instalar y configurar `.env`.
- **Reglas del proyecto:** si existen reglas en `.cursor/rules` o en el README (ej. uso de pnpm, estructura de componentes en `components/ui/` y por caso de uso), respetarlas.

---

## 2. Estilo de código

- **TypeScript:** tipado estricto. Evitar `any`; usar tipos definidos en `src/types/` o generados en `integrations/supabase/types.ts`.
- **Componentes:** componentes base reutilizables en `src/components/ui/`. Componentes por caso de uso en `src/components/<caso>/` (ej. `auth/`, `admin/`, `agent/`).
- **Comentarios:** comentar lo no obvio y el “por qué”. Pensar en el dev del mañana. JSDoc en hooks y funciones públicas con `@param`, `@returns` y una breve descripción cuando aporte.
- **Idioma:** comentarios y documentación en español; nombres de variables/funciones y código en inglés (convención estándar).

---

## 3. Linter y tests

- **Lint:** antes de commitear, ejecutar `pnpm run lint`. Corregir los errores que marque ESLint.
- **Tests:** el proyecto usa Vitest. Ejecutar `pnpm run test` (una corrida) o `pnpm run test:watch` (modo watch). Si agregás lógica crítica (auth, propiedades, mutations), idealmente sumar o actualizar tests y documentar en el CHANGELOG si cambia comportamiento.

---

## 4. Commits y cambios grandes

- **Commits:** mensajes claros y en español o inglés (según convención del equipo). Ejemplo: “fix: redirección por rol cuando user_roles está vacío”.
- **Cambios de schema (Supabase):** documentar en [docs/CHANGELOG.md](docs/CHANGELOG.md) en la sección de Base de datos, e indicar si hay migraciones o scripts SQL que haya que ejecutar.
- **Nuevas variables de entorno:** actualizar [.env.example](.env.example) con el nombre de la variable y un comentario breve; mencionar en [docs/SETUP.md](docs/SETUP.md) si afectan el setup local.

---

## 5. A quién preguntar o revisar

- **Dueño del repo / mantenedor:** para decisiones de producto, prioridades y aprobación de PRs grandes.
- **Documentación:** si algo no está documentado y lo descubrís al implementar, agregar una nota en el CHANGELOG o en el doc correspondiente (SETUP, ARCHITECTURE) para el siguiente que pase por ahí.

---

## 6. Resumen rápido

| Acción | Dónde / Cómo |
|--------|----------------|
| Estilo y tipos | TypeScript estricto, componentes en `ui/` vs por caso de uso, comentarios en español. |
| Lint | `pnpm run lint` antes de commit. |
| Tests | `pnpm run test` o `pnpm run test:watch`; cubrir lógica crítica. |
| Schema / env | Documentar en CHANGELOG y .env.example; SETUP si afecta instalación. |
| Dudas | Revisar docs/ y mantenedor del repo. |

Con esto el proyecto mantiene calidad y el dev del mañana tiene un camino claro para contribuir y para futuros movimientos.
