#!/usr/bin/env bash
# =============================================================================
# pg_dump_backup.sh
# Backup completo (estructura + datos) de la BD Supabase de HomeFinder.
# Genera archivos con timestamp listos para restaurar/duplicar la BD.
#
# REQUISITOS:
#   - pg_dump >= 15 instalado localmente (misma major version que Supabase).
#   - Connection string de Supabase (Settings -> Database -> Connection string
#     -> URI, modo "Session" en puerto 5432, NO el pooler 6543 para dumps).
#
# USO:
#   1) Exportar la URL de conexión (recomendado, no queda en historial):
#        export SUPABASE_DB_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres"
#   2) Ejecutar:
#        bash supabase/scripts/pg_dump_backup.sh
#   3) (opcional) pasar carpeta destino:
#        bash supabase/scripts/pg_dump_backup.sh ./backups
#
# QUE GENERA (en ./backups/ por defecto):
#   - homefinder_<TS>_schema.sql        -> solo estructura (DDL)
#   - homefinder_<TS>_data.sql          -> solo datos (INSERTs schema public)
#   - homefinder_<TS>_full.dump         -> backup completo formato custom (-Fc)
#   - homefinder_<TS>_full.sql          -> backup completo formato plain SQL
#
# RESTAURAR EN UN PROYECTO NUEVO:
#   # opcion A (recomendada, formato custom):
#   pg_restore --no-owner --no-privileges -d "$NEW_DB_URL" homefinder_<TS>_full.dump
#
#   # opcion B (SQL plano):
#   psql "$NEW_DB_URL" -f homefinder_<TS>_full.sql
#
# NOTA: pg_dump NO incluye:
#   - Usuarios de auth.users (exportar aparte si hace falta).
#   - Archivos fisicos de Storage buckets.
#   - Secrets de Edge Functions.
# =============================================================================

set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "❌ Falta variable SUPABASE_DB_URL."
  echo "   Ejemplo:"
  echo "   export SUPABASE_DB_URL=\"postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres\""
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "❌ pg_dump no esta instalado o no esta en PATH."
  exit 1
fi

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

TS="$(date +%Y%m%d_%H%M%S)"
PREFIX="$OUT_DIR/homefinder_${TS}"

echo "📦 Iniciando backup HomeFinder -> $OUT_DIR"
echo "   Timestamp: $TS"
echo

# 1) Solo estructura (schema public)
echo "→ [1/4] Dump de estructura (schema)..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f "${PREFIX}_schema.sql"

# 2) Solo datos (schema public, INSERTs explicitos)
echo "→ [2/4] Dump de datos (data only, INSERTs)..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-privileges \
  --column-inserts \
  -f "${PREFIX}_data.sql"

# 3) Backup completo formato custom (recomendado para pg_restore)
echo "→ [3/4] Dump completo formato custom (.dump)..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-owner \
  --no-privileges \
  -Fc \
  -f "${PREFIX}_full.dump"

# 4) Backup completo formato plain SQL (legible y restaurable con psql)
echo "→ [4/4] Dump completo formato plain SQL..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-owner \
  --no-privileges \
  -f "${PREFIX}_full.sql"

echo
echo "✅ Backup completo:"
ls -lh "${PREFIX}"_*

echo
echo "💡 Restaurar en proyecto nuevo:"
echo "   pg_restore --no-owner --no-privileges -d \"\$NEW_DB_URL\" ${PREFIX}_full.dump"
