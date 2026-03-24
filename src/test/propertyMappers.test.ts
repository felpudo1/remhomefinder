import { describe, it, expect } from "vitest";
import { resolveImages, mapListingToProperty } from "@/lib/mappers/propertyMappers";

describe("propertyMappers", () => {
  describe("resolveImages", () => {
    it("should return empty array when dbImages is null or empty", () => {
      expect(resolveImages(null)).toEqual([]);
      expect(resolveImages([])).toEqual([]);
    });

    it("should resolve external URLs correctly", () => {
      const images = ["https://example.com/image.jpg", "http://test.com/photo.png"];
      expect(resolveImages(images)).toEqual(images);
    });

    it("should drop legacy default-house filenames (no generic stock photos)", () => {
      expect(resolveImages(["default-house-1.jpg", "default-house-2.jpg"])).toEqual([]);
      expect(resolveImages(["https://a.com/a.jpg", "default-house-1.jpg"])).toEqual(["https://a.com/a.jpg"]);
    });
  });

  describe("mapListingToProperty", () => {
    it("should map a complete listing and property object correctly", () => {
      const mockListing = {
        id: "listing-123",
        property_id: "prop-456",
        current_status: "contactado",
        created_at: "2024-03-21T10:00:00Z",
        org_id: "org-789",
        listing_type: "sale"
      };

      const mockProperty = {
        id: "prop-456",
        title: "Casa de Lujo",
        price_amount: 500000,
        currency: "USD",
        neighborhood: "Carrasco",
        images: ["https://site.com/h.jpg"]
      };

      const result = mapListingToProperty(mockListing, mockProperty);

      expect(result.id).toBe(mockListing.id);
      expect(result.title).toBe(mockProperty.title);
      expect(result.priceRent).toBe(mockProperty.price_amount);
      expect(result.status).toBe("contactado");
      expect(result.listingType).toBe("sale");
      expect(result.neighborhood).toBe("Carrasco");
    });

    it("should handle missing property data gracefully", () => {
      const mockListing = {
          id: "listing-123",
          current_status: "ingresado",
          created_at: "2024-03-21T10:00:00Z"
      };
      
      const result = mapListingToProperty(mockListing, null);
      
      expect(result.title).toBe("Sin datos");
      expect(result.priceRent).toBe(0);
      expect(result.status).toBe("ingresado");
    });
  });
});
