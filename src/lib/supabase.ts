import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Custom fetch con retry para manejar timeouts y errores transitorios de Supabase
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Si es 504, reintentar
    if (response.status === 504 && retries > 0) {
      console.warn(`Supabase 504 timeout, reintentando... (${retries} intentos restantes)`);
      clearTimeout(timeoutId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s antes de retry
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError' && retries > 0) {
      console.warn(`Request timeout, reintentando... (${retries} intentos restantes)`);
      clearTimeout(timeoutId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Crear cliente base
const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  fetch: fetchWithRetry,
});

// Exportar cliente con retry
export const supabase = baseClient;

// Helper para verificar conexión
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?select=1`, {
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
