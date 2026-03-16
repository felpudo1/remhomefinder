# 🛠️ Setup — RemHomeFinder

Guía paso a paso para dejar el proyecto corriendo en tu máquina. Pensada para el dev del mañana y para futuros movimientos (cambio de máquina, onboarding, CI).

---

## 1. Requisitos

- **Node.js** ≥ 18 (recomendado LTS). Verificar: `node -v`
- **pnpm** ≥ 8. Si no lo tenés: `npm install -g pnpm` y luego `pnpm -v`

---

## 2. Clonar e instalar

```bash
# Clonar el repositorio (ajustar URL si es fork o org)
git clone <url-del-repo> remhomefinder
cd remhomefinder

# Instalar dependencias (solo pnpm para mantener lockfile consistente)
pnpm install
```

Si ves errores de red o de resolución de paquetes, probar con red estable o `pnpm install --no-frozen-lockfile` solo si tenés buen motivo (mejor documentar el cambio).

---

## 3. Variables de entorno

El frontend y las Edge Functions usan variables de entorno. Para desarrollo local:

```bash
# Copiar plantilla (no commitear .env)
cp .env.example .env

# Editar .env con tus valores
```

**Qué poner en `.env`:**

- **VITE_SUPABASE_URL**: URL del proyecto en Supabase (Dashboard → Project Settings → API).
- **VITE_SUPABASE_PUBLISHABLE_KEY**: Clave pública “anon” (no la service_role).
- **VITE_SUPABASE_PROJECT_ID**: El “Reference ID” del proyecto (ej. `ktayllrmzoocgxhwyurv`).

Si el cliente de Supabase en `src/integrations/supabase/client.ts` viene generado por Lovable con valores fijos, en local podés igualmente tener `.env` listo para cuando hagas un build propio o cambies a usar `import.meta.env` en el client.

Descripción de todas las variables (incluidas las de Edge Functions): [.env.example](../.env.example) en la raíz.

---

## 4. Correr la aplicación

```bash
pnpm run dev
```

Se inicia el servidor de desarrollo de Vite. Abrí la URL que muestre en consola (ej. `http://localhost:5173`).  
Si el proyecto está configurado con otro puerto (ej. 3000), usá esa.

---

## 5. Verificar que todo esté bien

- **Login/registro:** Probá crear una cuenta o iniciar sesión. Si falla, revisar que las variables de Supabase en `.env` coincidan con el proyecto correcto y que Auth esté habilitado en Supabase.
- **Datos:** Si hay datos de prueba, deberías ver listados o dashboard según tu rol (usuario, agente, admin).
- **Consola del navegador:** Sin errores 401/403 en llamadas a Supabase (sugieren problema de clave o RLS).

---

## 6. Comandos útiles después del setup

| Comando | Uso |
|---------|-----|
| `pnpm run build` | Build de producción en `dist/`. |
| `pnpm run preview` | Servir `dist/` en local para probar el build. |
| `pnpm run lint` | Linter sobre el código. |
| `pnpm run test` | Tests una vez; `pnpm run test:watch` en modo watch. |

---

## 🔧 Troubleshooting

### "Cannot find module" o errores de path

- Asegurate de estar en la raíz del repo y de haber corrido `pnpm install`.
- Si usás alias `@/`, verificar que `vite.config` / `tsconfig` tengan el alias bien configurado (habitual en proyectos Vite + TypeScript).

### Supabase: 401 Unauthorized o 403 Forbidden

- Revisar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env` sean las del proyecto correcto y que la clave sea la **anon**, no la service_role.
- En Supabase Dashboard: Authentication → Providers y Policies (RLS) para las tablas que use la app.

### Puerto ya en uso

- Cambiar el puerto en la config de Vite o cerrar el proceso que esté usando ese puerto. En Windows: `netstat -ano | findstr :5173` (o el puerto que uses).

### Tests o lint fallan

- Ejecutar `pnpm run lint` y `pnpm run test` y leer el mensaje de error. Si fallan por dependencias, `pnpm install` de nuevo. Si es un test roto por un cambio reciente, ver [CONTRIBUTING.md](../CONTRIBUTING.md) para convenciones de tests.

---

Para diagramas de flujo y decisiones de arquitectura, ver [ARCHITECTURE.md](ARCHITECTURE.md). Para historial de cambios y mapa de archivos, [CHANGELOG.md](CHANGELOG.md).
