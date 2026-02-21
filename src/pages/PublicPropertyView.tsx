import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, BedDouble, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { currencySymbol } from "@/lib/currency";

/**
 * Vista pública de una propiedad individual.
 * Accesible sin autenticación vía /p/:id
 * Muestra: galería, barrio, ambientes, m² y desglose de precio.
 * NO muestra: resumen IA ni comentarios.
 */

interface PublicProperty {
  id: string;
  title: string;
  neighborhood: string;
  rooms: number;
  sq_meters: number;
  price_rent: number;
  price_expenses: number;
  total_cost: number;
  currency: string;
  images: string[];
}

export default function PublicPropertyView() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setLoading(true);
      // Consulta pública: solo los campos necesarios para la vista simplificada
      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("id, title, neighborhood, rooms, sq_meters, price_rent, price_expenses, total_cost, currency, images")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("No se encontró la propiedad.");
      } else {
        setProperty(data);
      }
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando propiedad...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">Propiedad no encontrada</p>
          <p className="text-sm text-muted-foreground">Es posible que el link sea incorrecto o la propiedad fue eliminada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
        {/* Galería de fotos */}
        <div className="relative h-72 sm:h-80 bg-muted">
          {property.images.length > 0 ? (
            <img
              src={property.images[activeImg]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imágenes
            </div>
          )}
          {property.images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg((p) => (p - 1 + property.images.length) % property.images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveImg((p) => (p + 1) % property.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Indicadores de imagen */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {property.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeImg ? "bg-card scale-125" : "bg-card/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Título y barrio */}
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{property.title}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{property.neighborhood}</span>
            </div>
          </div>

          {/* Stats: m², ambientes, moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{property.sq_meters}</div>
              <div className="text-xs text-muted-foreground">m²</div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{property.rooms}</div>
              <div className="text-xs text-muted-foreground">
                {property.rooms === 1 ? "Ambiente" : "Ambientes"}
              </div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{currencySymbol(property.currency)}</div>
              <div className="text-xs text-muted-foreground">Moneda</div>
            </div>
          </div>

          {/* Desglose de precio */}
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alquiler mensual</span>
              <span className="font-medium text-foreground">
                {currencySymbol(property.currency)} {property.price_rent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">G/C</span>
              <span className="font-medium text-foreground">
                {currencySymbol(property.currency)} {property.price_expenses.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-foreground">Costo mensual total</span>
              <span className="font-bold text-foreground text-lg">
                {currencySymbol(property.currency)} {property.total_cost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
