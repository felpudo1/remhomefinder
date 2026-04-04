import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";

// Mocks
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
}));

import { supabase } from "@/integrations/supabase/client";
const mockedSupabase = supabase as any;

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    it("should return success when credentials are valid", async () => {
      mockedSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@test.com" } },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      const response = await result.current.signIn("test@test.com", "password123");

      expect(response.success).toBe(true);
      expect(response.user).toBeDefined();
    });

    it("should return error with invalid email format", async () => {
      const { result } = renderHook(() => useAuth());

      const response = await result.current.signIn("invalid-email", "password123");

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(mockToast).toHaveBeenCalled();
    });

    it("should return error when Supabase auth fails", async () => {
      mockedSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      });

      const { result } = renderHook(() => useAuth());

      const response = await result.current.signIn("test@test.com", "wrong-password");

      expect(response.success).toBe(false);
      expect(mockToast).toHaveBeenCalled();
    });
  });

  describe("signUp", () => {
    it("should return success for user registration", async () => {
      mockedSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: "new-user-123" } },
        error: null,
      });
      mockedSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
      mockedSupabase.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => useAuth());

      const response = await result.current.signUp({
        email: "new@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        accountType: "user",
        displayName: "Test User",
        phone: "+59899123456",
      });

      expect(response.success).toBe(true);
    });

    it("should validate password match", async () => {
      const { result } = renderHook(() => useAuth());

      const response = await result.current.signUp({
        email: "new@test.com",
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!",
        accountType: "user",
        displayName: "Test User",
        phone: "+59899123456",
      });

      expect(response.success).toBe(false);
    });
  });

  describe("requestPasswordReset", () => {
    it("should send reset email for valid email", async () => {
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      const response = await result.current.requestPasswordReset("user@test.com");

      expect(response.success).toBe(true);
      expect(mockedSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@test.com",
        expect.any(Object)
      );
    });

    it("should fail with invalid email", async () => {
      const { result } = renderHook(() => useAuth());

      const response = await result.current.requestPasswordReset("not-an-email");

      expect(response.success).toBe(false);
    });
  });

  describe("loading states", () => {
    it("should set loading to true during signIn", async () => {
      mockedSupabase.auth.signInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: {} }, error: null }), 50))
      );

      const { result } = renderHook(() => useAuth());

      const signInPromise = result.current.signIn("test@test.com", "password123");

      // Immediately check loading state
      expect(result.current.loading).toBe(true);

      await signInPromise;

      expect(result.current.loading).toBe(false);
    });
  });
});
