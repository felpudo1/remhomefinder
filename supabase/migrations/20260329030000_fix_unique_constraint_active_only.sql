-- ============================================================================
-- FIX: Unique constraint para campos activos solamente
-- ============================================================================
-- Problema: La constraint UNIQUE (status, field_id) impedía reusar field_id
-- de campos eliminados (soft delete), causando error al crear campos nuevos
-- con el mismo ID.
--
-- Solución: Reemplazar UNIQUE constraint con índice parcial único que solo
-- aplica a registros activos (is_active = true).
--
-- Esto permite:
-- ✅ Reusar field_id de campos eliminados (soft delete)
-- ✅ Mantener integridad de datos históricos en status_history_log
-- ✅ Evitar duplicados accidentales de campos activos
--
-- Fecha: 2026-03-29
-- Autor: JP
-- ============================================================================

-- 1. Eliminar la constraint UNIQUE original (si existe)
ALTER TABLE status_feedback_configs 
DROP CONSTRAINT IF EXISTS status_feedback_configs_status_field_id_key;

-- 2. Eliminar índice único anterior (si existe por si se creó manualmente)
DROP INDEX IF EXISTS status_feedback_configs_status_field_id_idx;

-- 3. Crear índice parcial único que SOLO aplica a registros activos
-- Esto permite múltiples registros con mismo (status, field_id) si están inactivos,
-- pero previene duplicados mientras estén activos
CREATE UNIQUE INDEX idx_unique_active_field 
ON status_feedback_configs (status, field_id) 
WHERE is_active = true;

-- 4. Documentar el índice
COMMENT ON INDEX idx_unique_active_field IS 
'Prevents duplicate active fields per status. Allows reusing field_id from soft-deleted (is_active=false) records. Critical for allowing admins to delete and recreate fields with same ID while preserving historical data in status_history_log.event_metadata JSONB.';

-- ============================================================================
-- NOTAS DE DISEÑO IMPORTANTES (PARA EL DEV DEL MAÑANA)
-- ============================================================================
--
-- ¿POR QUÉ SOFT DELETE EN LUGAR DE HARD DELETE?
-- ----------------------------------------------
-- La tabla status_feedback_configs configura los campos que se guardan en
-- status_history_log.event_metadata (JSONB). Si eliminamos físicamente un
-- campo (hard delete), los datos históricos quedan huérfanos:
--
-- Ejemplo del problema:
-- ---------------------
-- 1. Admin crea campo "contacted_interest" (rating) para status "contactado"
-- 2. Usuarios completan feedback → se guarda en event_metadata:
--    { "contacted_interest": 4, "contacted_urgency": 3 }
-- 3. Admin elimina el campo (hard delete)
-- 4. Dashboard del agente intenta leer event_metadata.contacted_interest
--    → ¿Qué mostramos? ¿El campo ya no existe!
--
-- Con soft delete:
-- ----------------
-- - El campo se marca como is_active = false
-- - El modal YA NO lo muestra (filtro WHERE is_active = true)
-- - El dashboard DEL AGENTE puede seguir leyendo datos históricos
-- - Se puede crear un NUEVO campo con el mismo field_id (gracias al índice parcial)
--
-- FLUJO DE DATOS:
-- ---------------
-- status_feedback_configs          status_history_log
-- ─────────────────────           ─────────────────────
-- status: "contactado"      →→→→→  event_metadata: {
-- field_id: "contacted_interest"       "contacted_interest": 4,
-- field_label: "Interés inicial"       "contacted_urgency": 3
-- is_active: true/false                }
--                                    ↑
--                                    Los datos persisten aunque el campo
--                                    se elimine (is_active = false)
--
-- CONSULTAS ÚTILES:
-- -----------------
-- -- Ver campos activos de un status
-- SELECT * FROM status_feedback_configs 
-- WHERE status = 'contactado' AND is_active = true 
-- ORDER BY sort_order;
--
-- -- Ver campos inactivos (eliminados)
-- SELECT * FROM status_feedback_configs 
-- WHERE status = 'contactado' AND is_active = false 
-- ORDER BY sort_order;
--
-- -- Ver históricos que usan un campo eliminado
-- SELECT COUNT(*) FROM status_history_log shl
-- WHERE shl.event_metadata->>'contacted_interest' IS NOT NULL;
--
-- ADVERTENCIAS:
-- -------------
-- ⚠️ NO hacer hard delete de campos que ya tienen datos en status_history_log
-- ⚠️ Si se necesita cambiar el tipo de un campo (ej: rating → text), crear
--    uno nuevo con diferente field_id y migrar los datos manualmente
-- ⚠️ El índice parcial solo funciona en PostgreSQL 9.1+ (ya lo soportamos)
--
-- ============================================================================
