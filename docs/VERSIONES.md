# 📋 Sistema de Versiones - HomeFinder

Sistema profesional para trackear versiones de la aplicación en producción.

---

## 🎯 ¿Qué información tenemos?

Cada build genera automáticamente un `version.json` con:

### Información de Versión
- **Versión semántica**: `v1.2.3` (desde package.json)
- **Commit hash**: `abc1234` (commit exacto del código)
- **Branch**: `main`, `develop`, etc.
- **Fecha del commit**: Cuándo se hizo el último commit

### Información del Build
- **Timestamp**: Fecha y hora exacta del build
- **Ambiente**: `production`, `preview`, o `development`
- **Node version**: Versión de Node.js usada para build

### Metadata
- **Nombre de la app**
- **Deployed at**: Cuándo se deployó

---

## 🚀 ¿Cómo funciona?

### 1. Generación automática

El script `scripts/generate-version.js` se ejecuta **automáticamente** antes de cada build:

```bash
npm run build
# Ejecuta: prebuild → generate-version.js → build
```

### 2. Archivos generados

- `public/version.json` - Información completa (se incluye en el build)
- `src/hooks/useAppVersion.ts` - Hook para consumir en React

### 3. UI en producción

El Footer muestra:
```
🌿 v1.2.3 • abc1234 [PROD]
```

**Click para ver detalles** → Modal con toda la información.

---

## 📊 ¿Cómo saber qué versión está en producción?

### Opción 1: Desde la UI (Recomendada)

1. Abrí la aplicación en producción
2. Scrolleá hasta el Footer
3. Verás: `v{versión} • {commitHash} [PROD]`
4. Hacé click para ver detalles completos

### Opción 2: Desde el archivo version.json

```bash
# Producción
curl https://tu-dominio.com/version.json

# Preview
curl https://tu-branch.tu-dominio.com/version.json
```

### Opción 3: Desde la consola del navegador

```javascript
// En la consola de DevTools
fetch('/version.json').then(r => r.json()).then(console.log)
```

---

## 🔍 Casos de uso

### 1. Reportar un bug

Cuando un usuario reporta un bug, preguntá:

> "¿Podés decirme qué versión dice en el Footer?"

Con esa información, sabés exactamente qué código está corriendo.

### 2. Verificar deploy

Después de hacer deploy:

1. Entrá a producción
2. Verificá que el commit hash coincida con el último commit
3. Si no coincide → el deploy falló o hay cache

### 3. Debuggear en producción

Si hay un error en producción:

```bash
# 1. Ver qué versión está deployada
curl https://tu-dominio.com/version.json

# 2. Ver el código exacto de ese commit
git checkout abc1234

# 3. Reproducir el error localmente
```

### 4. Comparar ambientes

```bash
# Producción
curl https://app.homefinder.com/version.json

# Preview de un PR
curl https://my-feature.homefinder.com/version.json

# Comparar commits y timestamps
```

---

## 🛠️ Comandos útiles

### Ver versión localmente

```bash
# Generar version.json (se hace automático en el build)
npm run version

# Ver el archivo
cat public/version.json
```

### Actualizar versión semántica

```bash
# Editar package.json manualmente
# O usar npm version:
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0

# Luego hacer build y deploy
npm run build
git push
```

### Ver historial de versiones

```bash
# Ver commits
git log --oneline -10

# Ver tags de versiones
git tag -l
```

---

## 📈 Flujo de trabajo recomendado

### 1. Antes de deploy

```bash
# 1. Actualizar versión en package.json
npm version patch

# 2. Hacer commit del cambio
git add package.json
git commit -m "chore: bump version to 1.0.1"
git push
```

### 2. Deploy

```bash
# Vercel hace deploy automático al hacer push a main
# El version.json se genera automáticamente
```

### 3. Post-deploy

```bash
# 1. Entrar a producción
# 2. Verificar versión en el Footer
# 3. Verificar que el commit hash coincida
```

---

## 🔧 Configuración en Vercel

El sistema funciona automáticamente en Vercel porque:

1. `prebuild` script se ejecuta antes del build
2. `public/version.json` se incluye en el build
3. Vercel detecta variables de entorno automáticamente

### Variables que detecta el script

```bash
VERCEL_ENV=production|preview|undefined
VERCEL_GIT_COMMIT_REF=nombre-de-branch
NODE_ENV=production|development
```

---

## 🎨 Personalización

### Cambiar formato de versión

Editar `scripts/generate-version.js`:

```javascript
const versionInfo = {
  version: packageJson.version,
  // Agregar campos personalizados
  customField: 'valor',
};
```

### Cambiar UI del Footer

Editar `src/components/Footer.tsx`:

```tsx
// Modificar el badge de versión
<span>v{version}</span>
```

### Agregar más información

El hook `useAppVersion` ya expone toda la información:

```tsx
const { fullInfo } = useAppVersion();
console.log(fullInfo?.git.commitHashFull);
```

---

## ⚠️ Consideraciones importantes

### 1. No commitear `public/version.json`

Este archivo se genera en cada build. Agregar a `.gitignore`:

```gitignore
public/version.json
```

### 2. Cache del navegador

El hook agrega un timestamp para evitar cache:

```typescript
fetch(`/version.json?t=${Date.now()}`)
```

### 3. Builds locales

En desarrollo, el version.json muestra:
- Ambiente: `Desarrollo`
- Commit: Puede ser `dirty` si hay cambios sin commitear

---

## 📊 Ejemplo de output

### version.json en producción

```json
{
  "version": "1.2.3",
  "git": {
    "commitHash": "abc1234",
    "commitHashFull": "abc1234567890abcdef",
    "branch": "main",
    "commitDate": "2026-03-24 10:30:00 -0300",
    "isDirty": false
  },
  "build": {
    "timestamp": "2026-03-24T13:30:15.000Z",
    "timestampUnix": 1774389015000,
    "environment": "production",
    "environmentLabel": "Producción",
    "nodeVersion": "v20.11.0"
  },
  "meta": {
    "name": "homefinder",
    "deployedAt": "2026-03-24T13:30:15.000Z"
  }
}
```

### UI en el Footer

```
🌿 v1.2.3 • abc1234 [PROD]
```

---

## 🆘 Troubleshooting

### Error: "No se pudo cargar version.json"

**Causa:** El archivo no existe o hay error de CORS.

**Solución:**
1. Verificar que `public/version.json` existe en el build
2. Verificar que el servidor sirve archivos estáticos
3. En Vercel, verificar que `public/` se incluye en el deploy

### Error: "Commit hash unknown"

**Causa:** No hay git disponible o no es un repo git.

**Solución:**
1. Asegurarse de hacer `git init`
2. Hacer al menos un commit
3. En CI/CD, asegurar que se hace checkout del repo completo

### Versión no se actualiza después de deploy

**Causa:** Cache del navegador o del CDN.

**Solución:**
1. Hard refresh (Ctrl+F5)
2. El hook ya agrega `?t=${timestamp}` para evitar cache
3. En Vercel, los deploys nuevos tienen URL única

---

## 📚 Recursos adicionales

- [Semantic Versioning](https://semver.org/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Git Tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

---

**Última actualización:** Marzo 2026  
**Versión del sistema:** 1.0.0
