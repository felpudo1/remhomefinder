# Reglas de Negocio - RemHomeFinder

> Documentación rápida de las reglas de negocio más importantes del sistema.

## Autenticación y Roles

### Roles de Usuario
- **user**: Usuario común que busca propiedades
- **agency**: Agencia inmobiliaria (requiere aprobación admin)
- **agencymember**: Miembro de una agencia
- **admin**: Administrador del sistema
- **sysadmin**: Super admin con acceso a infraestructura

### Flujo de Registro
1. Usuario se registra con email/contraseña
2. Si es `agency`, queda en estado `pending` hasta aprobación
3. Triggers automáticos crean perfil y rol en BD
4. Usuarios normales quedan `active` inmediatamente

### Redirección Post-Login
```
returnTo param ? → returnTo
sysadmin ? → /admin/infra
admin ? → /admin
agency/agencymember ? → /agente
user ? → /dashboard
```

## Propiedades y Publicaciones

### Estados de una Publicación (Listing)
| Estado | Descripción | Transiciones permitidas |
|--------|-------------|------------------------|
| ingresado | Recién creado | → activo, descartado |
| activo | Visible para búsquedas | → pausado, vendido, alquilado, descartado |
| pausado | Temporalmente oculto | → activo, descartado |
| vendido | Operación cerrada (venta) | → archivado |
| alquilado | Operación cerrada (alquiler) | → archivado |
| descartado | Descartado por el usuario | → eliminado |
| archivado | Histórico | (sin transiciones) |

### Tipos de Operación
- **sale**: Venta
- **rent**: Alquiler mensual

### Duplicados
- URLs duplicadas se detectan antes de scrapear
- El sistema avisa si la propiedad ya existe en la org

## Extracción de Datos (IA)

### Fuentes Soportadas
1. **Scraping de URLs**: Firecrawl o Zenrows
2. **Imágenes**: Screenshots de redes sociales (Instagram, Facebook, etc.)

### Límite de Imágenes
- Máximo 3 imágenes por extracción
- Formatos: JPG, PNG, WebP

### Campos Extraíbles por IA
- Título, precio (venta/alquiler), expensas
- Moneda (USD, UYU, ARS)
- Ubicación: departamento, ciudad, barrio
- Superficie (m²), ambientes
- Resumen AI, referencia, detalles
- Contacto: nombre, teléfono

## Organizaciones (Groups)

### Tipos de Organización
- **family**: Grupo familiar/personal
- **agency**: Agencia inmobiliaria

### Propiedades Compartidas
- Las propiedades pertenecen a una organización
- Miembros de la org ven todas las propiedades de la org
- Usuarios comunes solo ven sus propiedades personales

## Sistema de Referidos

### Flujo
1. Usuario A comparte su link de referido
2. Usuario B se registra usando ese link
3. Se guarda `referred_by_id` en el perfil de B
4. El sistema rastrea conversiones

### Restricciones
- Auto-referencia bloqueada (no podés referirte a vos mismo)
- El referral se limpia del sessionStorage tras registro exitoso

## Límites y Planes

### Suscripción
- Usuarios gratuitos tienen límites de propiedades
- Planes premium aumentan los límites
- Controlado via tabla `subscriptions`

## Seguridad

### RLS (Row Level Security)
- Todas las tablas tienen políticas RLS activas
- Usuarios solo ven sus propiedades/org
- Admins pueden ver todo

### Validaciones
- Zod valida formularios en frontend
- Supabase valida en backend

---

*Última actualización: 2026-03-30*
