# 🏡 HomeFinder — Herramienta Inteligente de Gestión Inmobiliaria

![HomeFinder Banner](https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920)

**HomeFinder** es una plataforma diseñada para digitalizar y potenciar la búsqueda y gestión de propiedades inmobiliarias. Pensada originalmente para el mercado uruguayo.

---

## 🚀 Misión y Visión

Nuestra misión es simplificar la toma de decisiones inmobiliarias mediante el uso de inteligencia de datos y una interfaz de usuario excepcional.

- **UY (Uruguay):** Mercado de lanzamiento y consolidación.
- 

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

---

## 🔒 Arquitectura Responsable

- **Configuración Centralizada:** Todas las claves del sistema viven en `src/lib/config-keys.ts`, permitiendo un mantenimiento simple y escalable.
- **Seguridad:** Validación de esquemas con **ZOD** y reglas de RLS en Supabase.
- **Rendimiento:** Carga diferida (Lazy Loading) y optimización de re-renders mediante Zustand y Query Selectors.

---

## 👨‍💻 Desarrollo

```bash
# Instalar dependencias
pnpm install

# Correr en modo desarrollo (Puerto 3000)
pnpm run dev
```

---

<div align="center">
  <p><i>Desarrollado con ❤️ para transformar el mercado inmobiliario regional.</i></p>
  <p><b>HomeFinder Resilience System v1.0</b></p>
</div>
