import { vi } from "vitest";

// Mock básico de Supabase que puede ser extendido por cada test
export const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};

// Mock para resolver datos
(mockSupabase as any).then = (fn: any) => Promise.resolve({ data: [], error: null }).then(fn);
