# 🚀 Guía de Deploy para Vercel

Esta guía te llevará paso a paso para desplegar **HomeFinder** en Vercel.

---

## ✅ Checklist previo al deploy

Antes de desplegar, verificá que:

- [ ] Tenés una cuenta de [Vercel](https://vercel.com) creada
- [ ] Tu proyecto de Supabase está en producción (no en modo development)
- [ ] Tenés las URLs y claves de Supabase a mano
- [ ] El bucket `avatars` está creado en Supabase Storage
- [ ] Las migraciones están aplicadas en la base de datos

---

## 📋 Paso 1: Preparar variables de entorno

### 1.1 Obtener credenciales de Supabase

1. Andá a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Seleccioná tu proyecto
3. Andá a **Project Settings** → **API**
4. Copiá:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Project reference** → `VITE_SUPABASE_PROJECT_ID`

### 1.2 Configurar en Vercel

Las variables de entorno se configuran directamente en Vercel (ver Paso 3).

---

## 🚀 Paso 2: Conectar repositorio a Vercel

### Opción A: Desde Vercel Dashboard (Recomendada)

1. Iniciá sesión en [Vercel](https://vercel.com/dashboard)
2. Hacé clic en **"Add New Project"**
3. Seleccioná **"Import Git Repository"**
4. Elegí el repositorio `remhomefinder` de GitHub
5. Hacé clic en **"Import"**

### Opción B: Desde CLI de Vercel

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Iniciar sesión
vercel login

# Deploy (en el directorio del proyecto)
cd e:\github\remhomefinder
vercel
```

---

## ⚙️ Paso 3: Configurar proyecto en Vercel

### 3.1 Framework Preset

Vercel detectará automáticamente que es un proyecto **Vite**. Si no:

- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `pnpm install --no-frozen-lockfile`

### 3.2 Variables de Entorno

En Vercel Dashboard → Project Settings → Environment Variables, agregá:

| Nombre | Valor | Entornos |
|--------|-------|----------|
| `VITE_SUPABASE_URL` | `https://TU_PROJECT_REF.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `VITE_SUPABASE_PROJECT_ID` | `TU_PROJECT_REF` | Production, Preview, Development |

> ⚠️ **Importante:** No uses el prefijo `VITE_` en los nombres de las variables en Vercel. Vercel automáticamente las inyecta como variables de entorno de build.

---

## 🎨 Paso 4: Configuración adicional (opcional pero recomendada)

### 4.1 Dominio personalizado

1. En Vercel Dashboard → Project Settings → Domains
2. Agregá tu dominio (ej: `homefinder.com`)
3. Seguí las instrucciones para configurar DNS

### 4.2 Redirects y Rewrites

El archivo `vercel.json` ya está configurado correctamente para SPA:

```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esto permite que React Router funcione correctamente en producción.

---

## 🧪 Paso 5: Verificar deploy

### 5.1 Deploy de prueba

```bash
# Deploy a preview (sin hacer merge a main)
vercel --preview

# Deploy a production
vercel --prod
```

### 5.2 Verificar en el navegador

1. Abrí la URL que te da Vercel (ej: `https://remhomefinder.vercel.app`)
2. Probá:
   - [ ] Carga la página de inicio
   - [ ] Podés iniciar sesión
   - [ ] Podés registrarte
   - [ ] El formulario de registro valida teléfonos correctamente
   - [ ] Podés subir una foto de perfil
   - [ ] Podés tomar una selfie con la cámara
   - [ ] El dashboard carga correctamente

---

## 🔧 Troubleshooting

### Error: "Faltan variables de entorno para Supabase"

**Solución:** Verificá que las variables de entorno estén configuradas en Vercel:
- Project Settings → Environment Variables
- Asegurate de que los nombres sean exactos (`VITE_SUPABASE_URL`, etc.)
- Hacé un nuevo deploy después de agregar las variables

### Error: "Bucket 'avatars' no existe"

**Solución:** Ejecutá la migración en Supabase:

```bash
# Desde la carpeta del proyecto
npx supabase db push

# O desde el Dashboard de Supabase:
# SQL Editor → pegá el contenido de supabase/migrations/20260324160000_create_avatars_bucket.sql
```

### Error: "No se puede acceder a la cámara"

**Causa:** La cámara requiere HTTPS (excepto en localhost).

**Solución:** Vercel usa HTTPS automáticamente, así que esto solo puede pasar en desarrollo local. En producción debería funcionar sin problemas.

### Error: Build falla por "Some chunks are larger than 500 kB"

Esto es solo una advertencia, no un error. El build se completa correctamente. Si querés optimizar:

1. Implementá code splitting con `React.lazy()`
2. Usá `build.rollupOptions.output.manualChunks` en `vite.config.ts`

---

## 📊 Monitoreo y actualizaciones

### Ver logs del deploy

```bash
vercel logs
```

### Deploy automático

Vercel hace deploy automático cada vez que hagas push a la rama `main`.

### Rollback a versión anterior

1. Vercel Dashboard → Project → Deployments
2. Encontrá el deployment anterior
3. Tres puntos → **"Promote to Production"**

---

## 🔐 Seguridad

### Reglas de seguridad recomendadas

1. **Nunca** commitear `.env` al repositorio
2. Usar RLS (Row Level Security) en Supabase
3. Configurar CORS correctamente en Supabase
4. Revisar permisos del bucket `avatars` en Supabase Storage

### Verificar RLS

En Supabase Dashboard → Authentication → Policies, verificá que:

- `profiles` tenga políticas de lectura/escritura para usuarios autenticados
- `storage.objects` tenga políticas para el bucket `avatars`

---

## 📈 Optimización para producción

### 1. Habilitar compresión Brotli

Vercel ya lo hace automáticamente.

### 2. Usar ISR (Incremental Static Regeneration)

Si querés mejorar el performance, podés usar ISR en páginas estáticas:

```ts
// En tus páginas
export const revalidate = 3600; // Revalidar cada hora
```

### 3. Optimizar imágenes

Usá el componente `Image` de `next/image` si migrás a Next.js, o implementá lazy loading:

```tsx
<img loading="lazy" src={...} alt="..." />
```

---

## 🎉 ¡Listo!

Tu aplicación está en producción. Para futuras actualizaciones:

```bash
# Hacer cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Vercel hará deploy automáticamente en ~1-2 minutos
```

---

## 📞 Soporte

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vite Docs:** https://vitejs.dev/guide/

---

**Última actualización:** Marzo 2026  
**Versión del proyecto:** 1.0.0
