import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePropertyExtractor } from "@/hooks/usePropertyExtractor";

const mockToast = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn((msg) => mockToast(msg, { type: "success" })),
    error: vi.fn((msg) => mockToast(msg, { type: "error" })),
    info: vi.fn((msg, opts) => mockToast(msg, { type: "info", ...opts })),
  },
}));

vi.mock("@/contexts/AuthProvider", () => ({
  useCurrentUser: () => ({ user: { id: "user-123", email: "test@test.com" } }),
}));

vi.mock("@/lib/duplicateCheck", () => ({
  checkUrlStatus: vi.fn(),
}));

vi.mock("@/lib/resolveGeoIds", () => ({
  resolveGeoIds: vi.fn().mockResolvedValue({
    department: "Montevideo",
    department_id: "dept-1",
    city: "Montevideo",
    city_id: "city-1",
    neighborhood: "Centro",
    neighborhood_id: "neigh-1",
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ publicUrl: "https://example.com/image.jpg" }),
      })),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { checkUrlStatus } from "@/lib/duplicateCheck";
const mockedSupabase = supabase as any;
const mockedCheckUrlStatus = checkUrlStatus as any;

describe("usePropertyExtractor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  describe("handleScrape", () => {
    it("should return duplicate result when URL is duplicate", async () => {
      mockedCheckUrlStatus.mockResolvedValue({
        case: "duplicate",
        listingId: "listing-123",
      });

      const { result } = renderHook(() => usePropertyExtractor());

      const response = await result.current.handleScrape("https://example.com/property", null);

      expect(response?.duplicateResult).toBeDefined();
      expect(response?.duplicateResult.case).toBe("duplicate");
    });

    it("should return property data on successful scrape", async () => {
      mockedCheckUrlStatus.mockResolvedValue({ case: "none" });
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            title: "Casa de prueba",
            priceRent: 1000,
            priceExpenses: 200,
            currency: "USD",
            neighborhood: "Centro",
            city: "Montevideo",
            department: "Montevideo",
            sqMeters: 80,
            rooms: 2,
            aiSummary: "Resumen de prueba",
            ref: "REF-001",
            details: "Detalles de prueba",
            listingType: "rent",
            images: [],
          },
        },
        error: null,
      });

      const { result } = renderHook(() => usePropertyExtractor());

      const response = await result.current.handleScrape("https://example.com/property", null);

      expect(response?.data).toBeDefined();
      expect(response?.data?.title).toBe("Casa de prueba");
      expect(response?.data?.currency).toBe("USD");
    });

    it("should handle scrape errors gracefully", async () => {
      mockedCheckUrlStatus.mockResolvedValue({ case: "none" });
      mockedSupabase.functions.invoke.mockResolvedValue({
        data: { success: false, error: "MARKETPLACE_MANUAL", message: "URL de marketplace detectada" },
        error: null,
      });

      const { result } = renderHook(() => usePropertyExtractor());

      const response = await result.current.handleScrape("https://facebook.com/marketplace", null);

      expect(response?.error).toBeDefined();
    });
  });

  describe("handleImagesExtractor", () => {
    it("should require authenticated user", async () => {
      // Override the mock temporarily
      vi.doMock("@/contexts/AuthProvider", () => ({
        useCurrentUser: () => ({ user: null }),
      }));

      const { result } = renderHook(() => usePropertyExtractor());

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const response = await result.current.handleImagesExtractor([mockFile]);

      expect(response).toBeNull();
    });

    it("should handle empty file list", async () => {
      const { result } = renderHook(() => usePropertyExtractor());

      const response = await result.current.handleImagesExtractor(null);

      expect(response).toBeNull();
    });
  });

  describe("loading states", () => {
    it("should track loading state during scrape", async () => {
      mockedCheckUrlStatus.mockResolvedValue({ case: "none" });
      mockedSupabase.functions.invoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: {
            success: true,
            data: {
              title: "Casa",
              priceRent: 500,
              priceExpenses: 0,
              currency: "USD",
            },
          },
          error: null,
        }), 50))
      );

      const { result } = renderHook(() => usePropertyExtractor());

      const scrapePromise = result.current.handleScrape("https://example.com", null);

      expect(result.current.isLoading).toBe(true);

      await scrapePromise;

      expect(result.current.isLoading).toBe(false);
    });
  });
});
