-- ============================================================================
-- SCRIPT DE RESET COMPLETO - Sistema de Feedback y Estados
-- ============================================================================
-- PROPÓSITO: 
-- 1. Resetear TODOS los estados de user_listings a "ingresado"
-- 2. Borrar TODO el histórico de status_history_log
-- 3. Dejar el sistema como si recién se iniciara (sin interacciones de usuarios)
--
-- ⚠️ ADVERTENCIA: ESTE SCRIPT ELIMINA DATOS PERMANENTEMENTE
-- NO SE PUEDE DESHACER (a menos que tengas backup)
--
-- RESULTADO:
-- - user_listings: TODOS en estado "ingresado"
-- - status_history_log: 0 registros (VACÍO)
-- - Dashboard del agente: SIN DATOS (hasta nueva interacción)
-- - Feedback de usuarios: ELIMINADO (estrellas, comentarios, etc.)
--
-- Fecha: 2026-03-29
-- ============================================================================

-- ============================================================================
-- PASO 1: VER ESTADO ACTUAL (PARA REGISTRAR QUÉ SE BORRA)
-- ============================================================================
SELECT '=== ESTADO ANTES DEL RESET ===' as info;

SELECT 'user_listings por estado:' as contexto, current_status, COUNT(*) as cantidad
FROM user_listings
GROUP BY current_status
ORDER BY cantidad DESC;

SELECT 'status_history_log por estado:' as contexto, new_status, COUNT(*) as cantidad
FROM status_history_log
GROUP BY new_status
ORDER BY cantidad DESC;

SELECT 'TOTAL status_history_log a borrar:' as contexto, COUNT(*) as total_registros 
FROM status_history_log;

-- ============================================================================
-- PASO 2: BORRAR TODO EL HISTÓRICO DE CAMBIOS DE ESTADO
-- ============================================================================
-- ⚠️ ESTO ELIMINA PERMANENTEMENTE:
-- - Todos los cambios de estado históricos
-- - Todo el event_metadata (feedback, estrellas, comentarios, fechas, etc.)
-- - El historial que usa el dashboard del agente para mostrar insights

DELETE FROM status_history_log;

-- ============================================================================
-- PASO 3: RESETEAR TODOS LOS ESTADOS A "INGRESADO"
-- ============================================================================
-- Todas las propiedades vuelven al estado inicial
-- Los agentes las verán como "recién ingresadas"
-- No hay usuarios con cambios de estado

UPDATE user_listings 
SET current_status = 'ingresado',
    updated_at = NOW();

-- ============================================================================
-- PASO 4: RESETEAR CAMPOS RELACIONADOS (OPCIONAL)
-- ============================================================================
-- Si querés limpiar también campos adicionales de user_listings:

UPDATE user_listings 
SET 
    contact_name = NULL,
    contact_phone = NULL,
    contact_source = NULL,
    updated_at = NOW();

-- ============================================================================
-- PASO 5: VERIFICAR RESET COMPLETO
-- ============================================================================
SELECT '=== ESTADO POST-RESET ===' as info;

-- Debería mostrar TODO en "ingresado"
SELECT 'user_listings por estado:' as contexto, current_status, COUNT(*) as cantidad
FROM user_listings
GROUP BY current_status
ORDER BY cantidad DESC;

-- Debería mostrar 0 registros
SELECT 'status_history_log:' as contexto, COUNT(*) as total_registros 
FROM status_history_log;

-- ============================================================================
-- RESUMEN DEL RESET
-- ============================================================================
SELECT '=== RESUMEN ===' as info;

SELECT 
    'user_listings reseteados:' as accion, 
    COUNT(*) as cantidad 
FROM user_listings 
WHERE current_status = 'ingresado'
UNION ALL
SELECT 
    'status_history_log borrados:', 
    0;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- ✅ Lo que SÍ se mantiene:
-- - status_feedback_configs (configuración de campos del modal)
-- - properties (las propiedades en sí)
-- - profiles (los usuarios)
-- - organization_members (miembros de agencias)
-- - agent_publications (publicaciones de agentes en marketplace)
-- - AdminEstadisticas pestañas "Interés" y "Scraping"

-- ❌ Lo que NO se mantiene:
-- - status_history_log (histórico de cambios)
-- - event_metadata (feedback, estrellas, comentarios)
-- - Estados personalizados (contactado, visita_coordinada, etc.)
-- - contact_name, contact_phone, contact_source en user_listings
-- - feedback_attributes y attribute_scores (tablas eliminadas del esquema)

-- 📊 Impacto en el sistema:
-- - Dashboard del agente (AgentPropertyListing): SIN DATOS
-- - Modales de feedback: SIGUEN FUNCIONANDO (usan status_feedback_configs)
-- - Propiedades en dashboard: Todas aparecen como "ingresado"
-- - Usuarios: Pierden todo su historial de interacciones
-- - AdminEstadisticas: Pestaña "Propiedades" vacía (sin datos que mostrar)

-- ============================================================================
-- FIN DEL SCRIPT - RESET COMPLETADO
-- ============================================================================
