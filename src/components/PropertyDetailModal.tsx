import { useState, useEffect } from "react";
import { Property, PropertyStatus, STATUS_CONFIG, PropertyComment } from "@/types/property";
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
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { useGroups } from "@/hooks/useGroups";

interface PropertyDetailModalProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: PropertyStatus, deletedReason?: string, coordinatedDate?: string | null, groupId?: string | null) => void;
  onAddComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => void;
  currentUserEmail?: string | null;
}



export function PropertyDetailModal({
  property,
  open,
  onClose,
  onStatusChange,
  onAddComment,
  currentUserEmail,
}: PropertyDetailModalProps) {
  const { groups } = useGroups();
  const [activeImg, setActiveImg] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(currentUserEmail || "Me");

  useEffect(() => {
    if (open && currentUserEmail) {
      setCommentAuthor(currentUserEmail);
    }
  }, [open, currentUserEmail]);

  if (!property) return null;

  const config = STATUS_CONFIG[property.status];

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(property.id, {
      author: commentAuthor,
      avatar: commentAuthor[0],
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
        <div className="relative h-64 bg-muted rounded-t-2xl overflow-hidden">
          <img
            src={property.images[activeImg]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {property.images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg((p) => (p - 1 + property.images.length) % property.images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveImg((p) => (p + 1) % property.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {property.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? "bg-card scale-125" : "bg-card/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-xl font-bold leading-tight text-foreground">{property.title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {/* Botón para copiar link público al portapapeles */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const publicUrl = `${window.location.origin}/p/${property.id}`;
                    navigator.clipboard.writeText(publicUrl);
                    toast({ title: "Link copiado", description: "El link público fue copiado al portapapeles." });
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copiar link público"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <a
                  href={property.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{property.neighborhood}</span>
            </div>
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
              <span className="text-muted-foreground">Expensas</span>
              <span className="font-medium">{currencySymbol(property.currency)} {property.priceExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-foreground">Costo mensual total</span>
              <span className="font-bold text-foreground text-lg">
                {currencySymbol(property.currency)} {property.totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* AI Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Resumen IA
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-xl p-4">
              {property.aiSummary}
            </p>
          </div>

          {/* Status and Group Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <span className="text-xs font-semibold text-foreground">Estado</span>
              <Select
                value={property.status}
                onValueChange={(val) => onStatusChange(property.id, val as PropertyStatus)}
              >
                <SelectTrigger
                  className={`w-full h-9 text-sm border-0 ${config.bg} ${config.color} font-medium rounded-lg px-3`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(
                    ([key, cfg]) => (
                      <SelectItem key={key} value={key} className="text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
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
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground">Comentar como:</span>
                <Input
                  className="h-7 text-xs w-[180px] border-border bg-muted text-muted-foreground"
                  value={commentAuthor}
                  readOnly
                  placeholder="Tu email"
                />
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
