/**
 * Wrapper tipado para el cliente Supabase.
 * 
 * MOTIVO: Cuando types.ts está desincronizado con el esquema real de la BD
 * (ej. tras migraciones a un proyecto nuevo), el SDK genera SelectQueryError
 * en lugar de los tipos correctos. Este helper castea las llamadas para
 * evitar errores de compilación sin perder la funcionalidad.
 * 
 * IMPORTANTE: Eliminar este archivo y sus imports una vez que types.ts
 * sea regenerado automáticamente por el sistema.
 * 
 * @see docs/OPTIMIZACION-PERFORMANCE-2026-03-25.md — Punto 5 (tipos)
 */
import { supabase } from "./client";

/**
 * Versión tipada de supabase.from() que bypasea el tipado estricto
 * cuando types.ts está desincronizado con el esquema real.
 */
export function typedFrom(table: string) {
  return (supabase.from as any)(table);
}

/**
 * Wrapper para supabase.rpc() con cast de seguridad.
 */
export function typedRpc(fn: string, args?: Record<string, unknown>) {
  return (supabase.rpc as any)(fn, args);
}

// Re-export supabase for convenience
export { supabase };
