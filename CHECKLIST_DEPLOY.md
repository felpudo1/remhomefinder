# ✅ Checklist Pre-Deploy

Verificá esto antes de hacer deploy a Vercel.

---

## 🔧 Configuración requerida

### 1. Variables de entorno en Vercel

Configurar en **Project Settings → Environment Variables**:

```
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=TU_PROJECT_REF
```

### 2. Migraciones de Supabase

Ejecutar en orden:

```bash
# Aplicar todas las migraciones pendientes
npx supabase db push
```

**Importante:** Verificar que exista la migración del bucket de avatares:
- `supabase/migrations/20260324160000_create_avatars_bucket.sql`

Si no se aplicó, ejecutar manualmente desde Supabase Dashboard → SQL Editor.

### 3. Storage de Supabase

Verificar en Supabase Dashboard → Storage:

- [ ] Bucket `avatars` existe
- [ ] Bucket es **público**
- [ ] Políticas RLS están configuradas (ver migración)

### 4. Authentication en Supabase

Verificar en Supabase Dashboard → Authentication:

- [ ] Email provider habilitado
- [ ] Confirmación de email configurada (opcional pero recomendado)
- [ ] Site URL configurada a tu dominio de Vercel

### 5. Archivos del proyecto

- [ ] `.env` **NO** está commiteado (verificar `.gitignore`)
- [ ] `vercel.json` está presente
- [ ] `package.json` tiene scripts correctos

---

## 🚀 Deploy paso a paso

### Opción 1: Vercel Dashboard (Recomendada)

1. Ir a https://vercel.com/new
2. Click en "Import Git Repository"
3. Seleccionar repositorio `remhomefinder`
4. Configurar variables de entorno
5. Click en "Deploy"

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd e:\github\remhomefinder
vercel
```

---

## 🧪 Tests post-deploy

Una vez desplegado, verificar:

### Funcionalidades críticas

- [ ] La página carga sin errores
- [ ] El favicon se muestra correctamente
- [ ] Registro de usuario funciona
- [ ] Validación de teléfono con formato internacional (+598) funciona
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Subida de avatar funciona
- [ ] Cámara/selfie funciona (solo en HTTPS)
- [ ] Cerrar sesión funciona

### Consola del navegador

- [ ] No hay errores de CORS
- [ ] No hay errores de variables de entorno
- [ ] No hay errores de conexión a Supabase

---

## ⚠️ Problemas comunes

### Error: "Faltan variables de entorno"

**Solución:** Agregar variables en Vercel Dashboard → Settings → Environment Variables

### Error: "Bucket avatars no existe"

**Solución:** Ejecutar migración `20260324160000_create_avatars_bucket.sql`

### Error: "No se puede acceder a la cámara"

**Causa:** La cámara requiere HTTPS. Vercel provee HTTPS automáticamente, pero en local no funciona.

### Error: 404 en rutas de la SPA

**Solución:** Verificar que `vercel.json` tenga los rewrites configurados (ya está incluido).

---

## 📊 Monitoreo

### Ver logs en Vercel

```bash
vercel logs
```

### Ver analytics

Vercel Dashboard → Project → Analytics

---

## 🔐 Seguridad

### Verificar RLS en Supabase

Dashboard → Database → Replication → Row Level Security:

- [ ] `profiles` tiene RLS activado
- [ ] `storage.objects` tiene RLS activado
- [ ] Políticas correctas para usuarios autenticados

### Verificar CORS

Dashboard → API Settings → CORS:

- [ ] Dominio de Vercel está permitido (o usar `*` para desarrollo)

---

## 📝 Notas importantes

1. **Build time:** El build tarda ~1-2 minutos en Vercel
2. **Cache:** Vercel cachea `node_modules` automáticamente
3. **Deploy automático:** Cada push a `main` hace deploy automático
4. **Preview deployments:** Cada PR tiene su propio deploy de prueba

---

## 🆘 Soporte

Si tenés problemas:

1. Revisar logs en Vercel Dashboard
2. Verificar variables de entorno
3. Chequear conexión a Supabase
4. Revisar consola del navegador (F12)

---

**Última verificación:** Marzo 2026  
**Estado:** ✅ Listo para deploy
