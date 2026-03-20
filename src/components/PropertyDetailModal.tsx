/**
 * ARCHIVO: PropertyDetailModal.tsx
 * DESCRIPCIÓN: Este componente es el "corazón" de la visualización de una propiedad. 
 * Se encarga de mostrar las fotos, los detalles, los comentarios y también de 
 * "chismosear" a la base de datos cada vez que alguien entra a ver la propiedad.
 */
import { useState, useEffect } from "react";
import { Property, PropertyStatus, STATUS_CONFIG, PropertyComment } from "@/types/property";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Maximize2,
  BedDouble,
  ExternalLink,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Share2,
  Users,
  Building2,
  X,
} from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { useGroups } from "@/hooks/useGroups";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";

interface PropertyDetailModalProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: PropertyStatus,
    deletedReason?: string,
    coordinatedDate?: string | null,
    groupId?: string | null,
    contactedName?: string,
    discardedAttributeIds?: string[],
    prosAndCons?: { positiveIds: string[]; negativeIds: string[] },
    contactedFeedback?: { interest: number; urgency: number },
    coordinatedFeedback?: { agentResponseSpeed: number; attentionQuality: number; appHelpScore?: number },
    discardedSurvey?: {
      overallCondition: number;
      surroundings: number;
      houseSecurity: number;
      expectedSize: number;
      photosReality: number;
    }
  ) => void;
  onAddComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => void;
  currentUserEmail?: string | null;
  currentUserDisplayName?: string | null;
}



export function PropertyDetailModal({
  property,
  open,
  onClose,
  onStatusChange,
  onAddComment,
  currentUserEmail,
  currentUserDisplayName,
}: PropertyDetailModalProps) {
  const { groups } = useGroups();
  const [activeImg, setActiveImg] = useState(0);
  const allImages = property ? [...(property.images || []), ...(property.privateImages || [])] : [];
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  /**
   * EFECTO DE VISTAS: 
   * Cada vez que se abre el modal, este efecto intenta sumarle 1 al contador de la base de datos.
   * Tiene un "filtro de seguridad" usando localStorage para que una persona no sume 
   * 1000 visitas abriendo y cerrando el modal el mismo día.
   */
  useEffect(() => {
    if (open && property?.id) {
      const incrementViews = async () => {
        try {
          // Protección Anti-Spam: Anotamos en el navegador que ya vimos esta propiedad hoy.
          const today = new Date().toISOString().split('T')[0]; // Ejemplo: "2024-03-10"
          const storageKey = `viewed_${property.id}`;
          const lastViewed = localStorage.getItem(storageKey);

          if (lastViewed === today) {
            // Si ya la vimos hoy, no molestamos a la base de datos
            return;
          }

          // Usamos el UUID real de properties para el log de vistas.
          // Si este listing viene del marketplace, también mandamos publication_id
          // para incrementar el contador de agent_publications.
          const realPropertyId = property.propertyId || property.id;
          const publicationId = property.sourceMarketplaceId || null;

          // Llamamos a la función mágica de Supabase (RPC) que sabe sumar +1 salteándose bloqueos
          await supabase.rpc('increment_property_views', {
            p_property_id: realPropertyId,
            p_publication_id: publicationId
          });

          // Guardamos "Visto con éxito" para que no vuelva a sumar hasta mañana
          localStorage.setItem(storageKey, today);

        } catch (error) {
          console.error("Error al incrementar vistas:", error);
        }
      };
      incrementViews();
    }
  }, [open, property?.id, property?.propertyId, property?.sourceMarketplaceId]);

  /**
   * Marca comentarios como leídos al abrir el detalle.
   * Se guarda por usuario + listing para habilitar el badge de "Nuevo comentario".
   */
  useEffect(() => {
    if (!open || !property?.id || property.comments.length === 0) return;

    const markCommentsAsRead = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await (supabase as any)
          .from("user_listing_comment_reads")
          .upsert(
            {
              user_listing_id: property.id,
              user_id: user.id,
              last_read_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_listing_id,user_id" }
          );
      } catch (error) {
        console.warn("No se pudo marcar comentarios como leídos:", error);
      }
    };

    markCommentsAsRead();
  }, [open, property?.id, property?.comments.length]);

  // Manejo de teclado para la galería (AHORA GESTIONADO POR FullScreenGallery)

  if (!property) return null;

  const config = STATUS_CONFIG[property.status];

  /**
   * FUNCIÓN: handleAddComment
   * Sirve para que el usuario guarde su opinión o una nota sobre la casa/apartamento.
   */
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const author = currentUserDisplayName || currentUserEmail || "Me";
    onAddComment(property.id, {
      author,
      avatar: author[0],
      text: commentText.trim(),
    });
    setCommentText("");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Image Gallery */}
        <div className="relative h-64 bg-muted rounded-t-2xl overflow-hidden cursor-zoom-in" onClick={() => setIsGalleryOpen(true)}>
          <img
            src={allImages[activeImg] || "/placeholder.svg"}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p - 1 + allImages.length) % allImages.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors shadow-lg z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p + 1) % allImages.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors shadow-lg z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? "bg-card scale-125 shadow-md" : "bg-card/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Acciones Rápidas - Botones grandes para Mobile/Web */}
        <div className="px-6 pt-4 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl gap-2 font-medium border-border hover:bg-muted w-full"
            onClick={(e) => {
              e.stopPropagation();
              const publicUrl = `${window.location.origin}/p/${property.id}`;
              navigator.clipboard.writeText(publicUrl);
              toast({ title: "¡Copiado!", description: "Link listo para compartir." });
            }}
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
          <Button
            variant="secondary"
            className="h-11 rounded-xl gap-2 font-medium bg-secondary/50 hover:bg-secondary w-full"
            onClick={(e) => {
              e.stopPropagation();
              window.open(property.url, "_blank");
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Ver publicación original
          </Button>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-xl font-bold leading-tight text-foreground">{property.title}</h2>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{property.neighborhood}</span>
            </div>
            {property.sourceMarketplaceId && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <Building2 className="w-3 h-3" />
                  Guardada del marketplace
                </span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{property.sqMeters}</div>
              <div className="text-xs text-muted-foreground">m²</div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{property.rooms}</div>
              <div className="text-xs text-muted-foreground">{property.rooms === 1 ? "Ambiente" : "Ambientes"}</div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{currencySymbol(property.currency)}</div>
              <div className="text-xs text-muted-foreground">Moneda</div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alquiler mensual</span>
              <span className="font-medium">{currencySymbol(property.currency)} {property.priceRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gastos comunes</span>
              <span className="font-medium">{currencySymbol(property.currency)} {property.priceExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-foreground">Costo mensual total</span>
              <span className="font-bold text-foreground text-lg">
                {currencySymbol(property.currency)} {property.totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Ref */}
          {property.ref && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Ref:</span>
              <span className="text-sm text-muted-foreground">{property.ref}</span>
            </div>
          )}

          {/* Detalles y Resumen IA unificados */}
          {(property.aiSummary || property.details) && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground">Detalles de la propiedad</div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-4">
                {property.aiSummary && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Resumen IA
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      {property.aiSummary}
                    </p>
                  </div>
                )}

                {property.aiSummary && property.details && (
                  <div className="border-t border-border/50 pt-2" />
                )}

                {property.details && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {property.details}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status and Group Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Estado</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            </div>

            {groups.length > 0 && (
              <div className="space-y-1.5 text-left">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> Grupo Familiar
                </span>
                <Select
                  value={property.groupId || "none"}
                  onValueChange={(val) =>
                    onStatusChange(property.id, property.status, undefined, undefined, val === "none" ? null : val)
                  }
                >
                  <SelectTrigger className="w-full h-9 text-sm border-border bg-background rounded-lg px-3">
                    <SelectValue placeholder="Sin grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin grupo</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Comentarios ({property.comments.length})
              </span>
            </div>

            {property.comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin comentarios aún. ¡Sé el primero en compartir tu opinión!
              </p>
            )}

            <div className="space-y-3">
              {[...property.comments]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                      {comment.avatar}
                    </div>
                    <div className="flex-1 bg-muted rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Add comment */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Textarea
                placeholder="Compartí tu opinión sobre esta propiedad..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none text-sm min-h-[80px] rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">⌘+Enter para enviar</span>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="rounded-lg"
                >
                  Agregar comentario
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Full Screen Gallery Overlay (MODULARIZADO) */}
        <FullScreenGallery
          images={allImages}
          isOpen={isGalleryOpen}
          initialIndex={activeImg}
          onClose={() => setIsGalleryOpen(false)}
        />
      </DialogContent>
    </Dialog >
  );
}
