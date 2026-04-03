# 🏡 HomeFinder — Herramienta Inteligente de Gestión Inmobiliaria

![HomeFinder Banner](https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920)

**HomeFinder** es una plataforma diseñada para digitalizar y potenciar la búsqueda y gestión de propiedades inmobiliarias. Pensada originalmente para el mercado uruguayo.

---

## 🚀 Misión y Visión

Nuestra misión es simplificar la toma de decisiones inmobiliarias mediante el uso de inteligencia de datos y una interfaz de usuario excepcional.

- **UY (Uruguay):** Mercado de lanzamiento y consolidación.

---

## 📋 Requisitos previos

Para desarrollar o ejecutar el proyecto localmente necesitás:

| Requisito   | Versión recomendada | Notas                                                             |
| ----------- | ------------------- | ----------------------------------------------------------------- |
| **Node.js** | ≥ 18                | LTS recomendado. Verificar con `node -v`.                         |
| **pnpm**    | ≥ 8                 | Gestor de paquetes preferido. Instalación: `npm install -g pnpm`. |

---

## 🛠️ Stack Tecnológico (Senior Pro)

- **Core:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Alta velocidad de desarrollo).
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Seguridad y tipado estricto).
- **Capa de Datos:**
  - [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime).
  - [TanStack Query](https://tanstack.com/query) (Caché y Server State).
- **Estado Global:** [Zustand](https://zustand-demo.pmnd.rs/) (Client State ultra-ligero).
- **Estética:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (Componentes premium y minimalistas).
- **Resiliencia:** Error Boundaries globales para una UX sin interrupciones catastróficas.

---

## 🏗️ Estructura del Proyecto

```bash
src/
├── components/     # UI Base y componentes por caso de uso.
├── hooks/          # Lógica de negocio reutilizable (Auth, Subscription, etc).
├── lib/            # Utilidades y configuración centralizada (config-keys).
├── store/          # Estado global de la UI con Zustand.
├── integrations/   # Clientes de servicios externos (Supabase).
└── pages/          # Vistas principales de la aplicación.
```

Para un mapa detallado de archivos y responsabilidades, ver [docs/CHANGELOG.md — Mapa de archivos](docs/CHANGELOG.md#-mapa-de-archivos-principales).

---

## 🔒 Arquitectura Responsable

- **Configuración Centralizada:** Todas las claves del sistema viven en `src/lib/config-keys.ts`, permitiendo un mantenimiento simple y escalable.
- **Seguridad:** Validación de esquemas con **ZOD** y reglas de RLS en Supabase.
- **Rendimiento:** Carga diferida (Lazy Loading) y optimización de re-renders mediante Zustand y Query Selectors.

Diagramas de flujo (auth, datos, roles): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ⚙️ Variables de entorno

El frontend y las Edge Functions de Supabase usan variables de entorno. Para desarrollo local:

1. Copiá el archivo de ejemplo:  
   `cp .env.example .env`
2. Editá `.env` y completá los valores (URL y clave de Supabase en el Dashboard del proyecto).
3. **No commitear `.env`** — ya está en `.gitignore`.

Descripción de cada variable: [.env.example](.env.example).  
Guía paso a paso de setup: [docs/SETUP.md](docs/SETUP.md).

---

## 👨‍💻 Desarrollo

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno (ver sección anterior)
cp .env.example .env

# Correr en modo desarrollo (puerto por defecto de Vite, ej. 5173)
pnpm run dev
```

### Scripts disponibles

| Comando               | Descripción                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `pnpm run dev`        | Servidor de desarrollo con Vite (HMR).                               |
| `pnpm run build`      | Build de producción (`dist/`).                                       |
| `pnpm run build:dev`  | Build en modo development (para pruebas de deploy).                  |
| `pnpm run preview`    | Sirve el build de producción localmente para probar antes de deploy. |
| `pnpm run lint`       | Ejecuta ESLint sobre el código.                                      |
| `pnpm run test`       | Ejecuta tests con Vitest (una sola corrida).                         |
| `pnpm run test:watch` | Tests en modo watch (re-ejecuta al cambiar archivos).                |

---

## 📚 Documentación técnica

Toda la documentación para el desarrollador del mañana está en la carpeta **`docs/`**:

| Documento                                    | Contenido                                                        |
| -------------------------------------------- | ---------------------------------------------------------------- |
| [docs/README.md](docs/README.md)             | Índice de la documentación y guías.                              |
| [docs/CHANGELOG.md](docs/CHANGELOG.md)       | Changelog técnico, schema de BD, auth, UI, correcciones Lovable. |
| [docs/SETUP.md](docs/SETUP.md)               | Setup paso a paso, troubleshooting y verificación.               |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagramas de flujo (auth, datos, roles).                         |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Cómo contribuir, estilo de código y buenas prácticas.            |

---

<div align="center">
  <p><i>Desarrollado con ❤️ para transformar el mercado inmobiliario regional.</i></p>
  <p><b>HomeFinder Resilience System v1.0</b></p>
</div>
