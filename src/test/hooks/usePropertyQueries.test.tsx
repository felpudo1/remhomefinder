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

  it("should return empty list when RPC returns empty", async () => {
    mockedSupabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderWithClient(() => usePropertyQueries());
    await triggerAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.properties).toEqual([]);
  });

  it("should return mapped properties from RPC response", async () => {
    const now = new Date().toISOString();
    const mockRpcResponse = [
      {
        id: "listing-1",
        property_id: "prop-1",
        org_id: "org-1",
        current_status: "ingresado",
        listing_type: "rent",
        added_by: "user-123",
        created_at: now,
        updated_at: now,
        source_publication_id: null,
        contact_name: null,
        contact_phone: null,
        contact_source: null,
        property: {
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
          updated_at: now,
        },
        organization: { type: "family", is_personal: true },
        agent_publication: null,
        _reads: {},
        _profiles: { "user-123": "Test User" },
        _status_history: [],
        _changer_profiles: {},
        _comments: [],
        _attachments: [],
        _contacts: {},
        _org_names: {},
      },
    ];

    mockedSupabase.rpc.mockResolvedValue({ data: mockRpcResponse, error: null });

    const { result } = renderWithClient(() => usePropertyQueries());
    await triggerAuth();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.properties.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    expect(result.current.properties[0].title).toBe("Casa de prueba");
    expect(result.current.properties[0].priceRent).toBe(1000);
    expect(result.current.properties[0].createdByEmail).toBe("Test User");

    // Verify RPC was called with correct params
    expect(mockedSupabase.rpc).toHaveBeenCalledWith("get_user_listings_page", {
      _cursor: null,
      _page_size: 30,
    });
  });

  it("should not fire query without authenticated user", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderWithClient(() => usePropertyQueries());

    // Don't trigger auth — query should stay disabled
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.properties).toEqual([]);
    expect(mockedSupabase.rpc).not.toHaveBeenCalledWith("get_user_listings_page", expect.anything());
  });
});
