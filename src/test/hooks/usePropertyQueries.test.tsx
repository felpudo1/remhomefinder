import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyQueries } from "@/hooks/usePropertyQueries";
import { renderWithClient } from "../utils/test-utils";
import { waitFor, act } from "@testing-library/react";

// Mock del cliente de Supabase
let authChangeCallback: any = null;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
      onAuthStateChange: vi.fn((cb: any) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
const mockedSupabase = supabase as any;

/** Helper: trigger auth state to enable the query */
async function triggerAuth() {
  await act(async () => {
    authChangeCallback?.("SIGNED_IN", { user: { id: "user-123" } });
  });
}

describe("usePropertyQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockedSupabase.rpc.mockResolvedValue({ data: [], error: null });
  });

  it("should return empty list when no listings are found", async () => {
    mockedSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }));

    const { result } = renderWithClient(() => usePropertyQueries());

    // With enabled: !!currentUserId, query starts disabled (not loading)
    // Trigger auth to enable it
    await triggerAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.properties).toEqual([]);
  });

  it("should return mapped properties when listings are found", async () => {
    const mockListing = {
      id: "listing-1",
      property_id: "prop-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_status: "ingresado",
      listing_type: "rent",
      added_by: "user-123",
      org_id: "org-1",
      source_publication_id: null,
      admin_hidden: false,
      contact_name: null,
      contact_phone: null,
      contact_source: null,
      organizations: { type: "family", is_personal: true },
      agent_publications: null,
      properties: {
        id: "prop-1",
        title: "Casa de prueba",
        source_url: "https://example.com",
        price_amount: 1000,
        price_expenses: 200,
        total_cost: 1200,
        currency: "USD",
        neighborhood: "Centro",
        city: "Montevideo",
        m2_total: 50,
        rooms: 2,
        images: [],
        details: "Nice place",
        ref: "REF-1",
        updated_at: new Date().toISOString(),
      },
    };

    mockedSupabase.from.mockImplementation((table: string) => {
      if (table === "user_listings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [mockListing], error: null }),
              }),
            }),
          }),
        };
      }
      // All other tables (profiles, status_history_log, family_comments, etc.)
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    const { result } = renderWithClient(() => usePropertyQueries());
    await triggerAuth();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.properties.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    expect(result.current.properties[0].title).toBe("Casa de prueba");
    expect(result.current.properties[0].priceRent).toBe(1000);
  });
});
