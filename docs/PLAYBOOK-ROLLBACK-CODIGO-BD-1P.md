# Playbook 1 pagina: Deploy/rollback (Codigo + BD)

Uso rapido para `remhomefinder` (Supabase + app).  
Objetivo: desplegar sin panico y volver atras en minutos.

---

## 0) Regla de oro

Si no hay backup + commit estable identificado, **no desplegar**.

---

## 1) Antes del deploy (5 minutos)

1. Confirmar commit estable:
   ```bash
   git status
   git rev-parse --short HEAD
   git log -1 --oneline
   ```
2. Confirmar migraciones SQL versionadas en `supabase/migrations/`.
3. Generar backup/snapshot (o validar PITR activo).
4. Probar en staging (minimo login + flujo principal).

Checklist rapido:
- [ ] Commit estable identificado.
- [ ] Backup/snapshot listo.
- [ ] Migraciones en repo.
- [ ] Staging ok.

---

## 2) Deploy (orden recomendado)

1. Deploy de codigo.
2. Aplicar migraciones.
3. Smoke test inmediato (3-5 minutos):
   - login por rol,
   - crear/editar aviso,
   - guardar desde marketplace,
   - abrir panel admin/agente,
   - validar sin errores RLS.

Si falla algo critico -> rollback inmediato.

---

## 3) Si rompe: decision en 60 segundos

- **Solo UI/app rota, BD sana** -> rollback de codigo.
- **Schema/RLS roto, datos sanos** -> migracion correctiva (forward-fix).
- **Datos corruptos/inconsistentes** -> restore de backup/PITR.

---

## 4) Rollback de codigo (rapido)

```bash
git log --oneline -n 10
git revert <commit_malo>
```

Revalidar smoke test.

---

## 5) Rollback de BD (si hace falta)

### Opcion A - Forward-fix (preferida)
- Crear nueva migracion correctiva.
- Aplicar y revalidar.

### Opcion B - Restore (si dano serio)
- Restaurar snapshot/PITR al punto pre-deploy.
- Redeploy del commit estable.
- Revalidar flujo completo.

---

## 6) Cierre obligatorio (5 minutos)

Registrar:
1. que se desplego,
2. que fallo,
3. como se recupero,
4. accion preventiva.

Guardar referencia de:
- commit,
- migracion,
- backup/timestamp.

---

## Cheatsheet de este repo

- Marketplace: `agent_publications`
- Listados user: `user_listings`
- Equipos/permisos: `organization_members` (RLS sensible)
- Vistas/metricas: `increment_property_views`, `property_views_log`

---

## Antipanico (frase corta)

1) Frenar cambios nuevos.  
2) Volver a estado estable (codigo o BD).  
3) Validar login + flujo principal.  
4) Recien despues, investigar fino.
