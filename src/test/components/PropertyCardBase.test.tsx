import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import React from "react";

describe("PropertyCardBase", () => {
  const defaultProps = {
    title: "Apartamento en el Puerto",
    neighborhood: "Buceo",
    priceRent: 1200,
    priceExpenses: 300,
    currency: "USD",
    totalCost: 1500,
    sqMeters: 60,
    rooms: 2,
    images: ["/test-img.jpg"],
    listingType: "rent" as const,
  };

  it("should render mandatory information correctly", () => {
    render(<PropertyCardBase {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeDefined();
    expect(screen.getByText(defaultProps.neighborhood)).toBeDefined();
    // Currency symbol for USD is U$S
    // Buscamos el precio de forma flexible (puede ser 1500, 1.500 o 1,500 según el locale)
    expect(screen.getByText((content) => content.includes("1") && content.includes("500"))).toBeDefined();
    expect(screen.getAllByText((content) => content.includes("U$S")).length).toBeGreaterThan(0);
  });

  it("should show expenses when listingType is rent", () => {
    render(<PropertyCardBase {...defaultProps} />);
    expect(screen.getByText(/Gastos comunes U\$S 300/)).toBeDefined();
  });

  it("should not show expenses when listingType is sale", () => {
    render(<PropertyCardBase {...defaultProps} listingType="sale" />);
    expect(screen.queryByText(/Gastos comunes/)).toBeNull();
    expect(screen.getByText(/Precio de venta/)).toBeDefined();
  });

  it("should show reference text when provided", () => {
    const ref = "REF-2024";
    render(<PropertyCardBase {...defaultProps} refText={ref} />);
    expect(screen.getByText(ref)).toBeDefined();
  });
  
  it("should handle empty images without loading a generic photo", () => {
    render(<PropertyCardBase {...defaultProps} images={[]} />);
    expect(screen.getByText("Sin fotos")).toBeDefined();
    expect(screen.queryByAltText(defaultProps.title)).toBeNull();
  });
});
