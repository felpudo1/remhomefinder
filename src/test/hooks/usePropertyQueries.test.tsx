import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyQueries } from "@/hooks/usePropertyQueries";
import { renderWithClient } from "../utils/test-utils";
import { waitFor } from "@testing-library/react";

// Mock del cliente de Supabase (definido localmente para evitar ReferenceError en el hoist de Vitest)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
const mockedSupabase = supabase as any;

describe("usePropertyQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuración por defecto para el usuario autenticado
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null
    });
  });

  it("should return empty list when no listings are found", async () => {
    // Mock de user_listings vacío
    mockedSupabase.from.mockImplementation((table: string) => {
      if (table === "user_listings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      }
      return mockedSupabase;
    });

    const { result } = renderWithClient(() => usePropertyQueries());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.properties).toEqual([]);
  });

  it("should return mapped properties when listings are found", async () => {
    const mockListing = {
        id: "listing-1",
        created_at: new Date().toISOString(),
        current_status: "ingresado",
        properties: {
            id: "prop-1",
            title: "Casa de prueba",
            price_amount: 1000,
            currency: "USD",
            neighborhood: "Centro",
            m2_total: 50,
            rooms: 2
        }
    };

    // Configurar mocks secuenciales para las múltiples llamadas de usePropertyQueries
    mockedSupabase.from.mockImplementation((table: string) => {
      switch (table) {
        case "user_listings":
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [mockListing], error: null })
          };
        case "profiles":
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null })
          };
        default:
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            mockResolvedValue: vi.fn().mockResolvedValue({ data: [], error: null })
          } as any;
      }
    });

    const { result } = renderWithClient(() => usePropertyQueries());

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.properties).toHaveLength(1);
    expect(result.current.properties[0].title).toBe("Casa de prueba");
    expect(result.current.properties[0].priceRent).toBe(1000);
  });
});
