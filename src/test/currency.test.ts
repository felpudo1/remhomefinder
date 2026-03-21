import { describe, it, expect } from "vitest";
import { currencySymbol } from "@/lib/currency";

describe("currencySymbol", () => {
    it("should return U$S for USD", () => {
        expect(currencySymbol("USD")).toBe("U$S");
        expect(currencySymbol("usd")).toBe("U$S");
    });

    it("should return $U for UYU and ARS", () => {
        expect(currencySymbol("UYU")).toBe("$U");
        expect(currencySymbol("ARS")).toBe("$U");
    });

    it("should return the input string for unknown currencies", () => {
        expect(currencySymbol("EUR")).toBe("EUR");
        expect(currencySymbol("BRL")).toBe("BRL");
    });
});
