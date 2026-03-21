import { describe, it, expect } from "vitest";
import { resolveImages, mapListingToProperty } from "@/lib/mappers/propertyMappers";

describe("propertyMappers", () => {
  describe("resolveImages", () => {
    it("should return a default image when dbImages is null or empty", () => {
      const result = resolveImages(null);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain("default-house");

      const resultEmpty = resolveImages([]);
      expect(resultEmpty).toHaveLength(1);
    });

    it("should resolve external URLs correctly", () => {
      const images = ["https://example.com/image.jpg", "http://test.com/photo.png"];
      const result = resolveImages(images);
      expect(result).toEqual(images);
    });

    it("should resolve local default paths to assets", () => {
      const images = ["default-house-1.jpg", "default-house-2.jpg"];
      const result = resolveImages(images);
      // As the mappers import the files, we check if it returns something that's not the string itself
      // in a real environment it would be the imported asset path/object
      expect(result[0]).not.toBe(images[0]);
      expect(result[1]).not.toBe(images[1]);
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
