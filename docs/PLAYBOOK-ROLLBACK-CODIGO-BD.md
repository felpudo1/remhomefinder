# Playbook de 10 pasos: Deploy y rollback (Codigo + BD)

Este playbook esta pensado para `remhomefinder` con `Supabase` y frontend en `pnpm`.
Objetivo: que puedas desplegar cambios con red de seguridad y volver rapido atras si algo sale mal.

---

## Cuando usar este playbook

- Antes de aplicar migraciones SQL en entornos reales.
- Antes de cambios que tocan auth, roles, RLS, hooks de datos o tablas clave.
- Cuando hay riesgo de romper datos/productivo.

---

## Paso 1) Congelar punto de partida

Antes de mover nada:

1. Confirmar rama y commit actual.
2. Dejar anotado:
   - hash del commit estable,
   - fecha/hora,
   - objetivo del deploy.

Comandos utiles:

```bash
git status
git rev-parse --short HEAD
git log -1 --oneline
```

Checklist:
- [ ] Tenes identificado el commit "vuelta atras segura".

---

## Paso 2) Verificar migraciones pendientes

Revisar que el cambio de BD este en archivos de migracion y no "solo en SQL editor".

Checklist:
- [ ] Toda modificacion de schema/funciones/policies esta en `supabase/migrations/*.sql`.
- [ ] No hay cambios "manuales" sin registrar.

Tip:
- Si ya aplicaste algo manualmente, crear migracion de trazabilidad (aunque no cambie nada funcional).

---

## Paso 3) Backup previo (estructura + datos)

Antes de deploy a entorno importante:

1. Generar backup/snapshot del proyecto en Supabase.
2. Guardar referencia del backup (timestamp, entorno, razon).

Minimo recomendado:
- Backup logico completo (o snapshot/PITR habilitado).

Checklist:
- [ ] Hay backup recuperable previo al deploy.
- [ ] Sabes exactamente como restaurarlo.

---

## Paso 4) Prueba en entorno espejo (staging)

Aplicar primero en un entorno lo mas parecido posible a produccion:

1. Correr migraciones.
2. Correr app.
3. Ejecutar prueba funcional minima.

Comandos comunes:

```bash
pnpm install
pnpm run dev
# migraciones segun flujo de tu equipo/supabase
```

Checklist:
- [ ] Login/roles funcionan.
- [ ] Panel user/admin/agent levanta datos.
- [ ] Sin errores de RLS en consola.

---

## Paso 5) Deploy controlado

En produccion:

1. Deploy de codigo.
2. Aplicar migraciones (idealmente en ventana controlada).
3. Validacion inmediata post deploy.

Regla simple:
- Si falla algo critico de negocio, frenar y ejecutar rollback.

Checklist:
- [ ] Deploy completo sin errores de pipeline.
- [ ] Migraciones aplicadas sin errores.

---

## Paso 6) Smoke test de 5 minutos

Hacer una bateria corta y siempre igual:

1. Login por rol (`user`, `agencymember`, `agency`, `admin`).
2. Alta/edicion basica de aviso.
3. Guardado desde marketplace.
4. Vistas/estadisticas base.
5. Acceso a paneles y tabs principales.

Checklist:
- [ ] Sin errores bloqueantes en UI.
- [ ] Sin errores SQL/RLS en logs.

---

## Paso 7) Rollback rapido de codigo (si rompe UI/flujo)

Si el problema es de frontend/backend app y la BD esta sana:

```bash
git log --oneline -n 10
# elegir commit sano
git revert <commit_malo>
# o volver a tag estable segun estrategia del equipo
```

Checklist:
- [ ] Codigo vuelve a estado estable.
- [ ] Smoke test pasa de nuevo.

---

## Paso 8) Rollback de BD por migracion fallida

Tenes dos caminos:

1. **Forward-fix** (preferido): nueva migracion que corrige.
2. **Restore** desde backup/PITR (si el daño es fuerte o datos corruptos).

Elegi restore cuando:
- se alteraron datos en masa mal,
- se rompieron policies criticas,
- no hay fix rapido seguro.

Checklist:
- [ ] Decidiste estrategia (fix vs restore) en menos de 15 min.

---

## Paso 9) Restauracion de datos (cuando aplica)

Si hay que restaurar:

1. Restaurar snapshot/PITR al punto anterior al deploy.
2. Reaplicar solo cambios seguros de codigo.
3. Revalidar flujo completo.

Importante:
- Restaurar datos puede perder escrituras recientes post-deploy. Avisar impacto.

Checklist:
- [ ] Datos coherentes.
- [ ] Integridad referencial OK.
- [ ] App utilizable.

---

## Paso 10) Cierre post-incidente (obligatorio)

Dejar registro para no repetir:

1. Que se desplego.
2. Que fallo.
3. Como se recupero.
4. Que alerta/prueba faltaba.
5. Accion preventiva concreta.

Agregar en docs internos:
- referencia de commit,
- referencia de migracion,
- timestamp de backup usado.

Checklist:
- [ ] Quedo documentado y accionable.

---

## Mini checklist "Antes de apretar Enter"

- [ ] Tengo commit de vuelta atras identificado.
- [ ] Tengo backup/snapshot previo.
- [ ] Tengo migraciones versionadas.
- [ ] Probe en staging.
- [ ] Tengo plan de rollback en 1 hoja.

---

## Matriz rapida de decision

- **Falla solo UI** -> rollback de codigo.
- **Falla RLS/schema sin dano de datos** -> forward-fix por migracion.
- **Dano de datos / inconsistencia grave** -> restore de BD + redeploy estable.

---

## Notas para este repo

- Tabla critica de marketplace: `agent_publications`.
- Tabla critica de listados user: `user_listings`.
- Cambios de RLS en `organization_members` impactan gestion de equipos.
- Cambios de funciones (`increment_property_views`, etc.) impactan estadisticas y paneles.

Mantener trazabilidad SIEMPRE:
- cada cambio de BD en `supabase/migrations/`,
- cada cambio de codigo ligado a commit claro.
