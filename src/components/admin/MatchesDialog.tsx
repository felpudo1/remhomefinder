import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Sparkles, Lock, Building2, MapPin, DollarSign, PhoneCall } from "lucide-react";
import { StatProperty } from "@/types/admin-publications";

interface MatchesDialogProps {
    open: boolean;
    onClose: () => void;
    property: StatProperty | null;
}

/**
 * Modal que muestra la lista de usuarios cuyos perfiles IA coinciden con una propiedad.
 * Solo visible para admins (puede mostrar usuarios privados).
 */
export function MatchesDialog({ open, onClose, property }: MatchesDialogProps) {
    if (!property) return null;

    const hasMatches = property.matches && property.matches.length > 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg rounded-2xl border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                    </div>
                    <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        Matches de IA
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium">
                        Usuarios cuyos perfiles coinciden con esta propiedad.
                    </DialogDescription>
                </DialogHeader>

                {/* Info de la propiedad */}
                <div className="flex-shrink-0 bg-muted/30 rounded-xl p-3 border border-border/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">{property.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {property.creator}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {property.neighborhood}, {property.city}
                                </span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                                <DollarSign className="w-3 h-3" />
                                {property.total_cost.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {property.rooms} amb.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lista de matches */}
                <div className="flex-1 overflow-y-auto space-y-2 py-2">
                    {!hasMatches ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No hay matches de IA</p>
                            <p className="text-xs mt-1">Ningún perfil de usuario coincide con esta propiedad.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {property.matches?.length} {property.matches?.length === 1 ? 'usuario' : 'usuarios'}
                                </span>
                                {property.matches?.some(m => m.is_private) && (
                                    <span className="text-[10px] text-purple-500 flex items-center gap-1 font-medium">
                                        <Lock className="w-2.5 h-2.5" />
                                        Incluye perfiles privados
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid gap-2">
                                {property.matches?.map((match, idx) => {
                                    const name = match.display_name?.trim() || `Usuario ${match.user_id.slice(0, 6)}`;
                                    const phone = match.phone?.trim() || "";
                                    const normalizedPhone = phone.replace(/\D/g, "");
                                    const canOpenWhatsapp = normalizedPhone.length > 0;
                                    const isPrivate = match.is_private;

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                                isPrivate 
                                                    ? 'bg-purple-500/5 border-purple-500/20' 
                                                    : 'bg-card border-border'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`p-2 rounded-lg shrink-0 ${
                                                    isPrivate ? 'bg-purple-500/10' : 'bg-muted'
                                                }`}>
                                                    <User className={`w-4 h-4 ${
                                                        isPrivate ? 'text-purple-500' : 'text-muted-foreground'
                                                    }`} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-foreground truncate">
                                                            {name}
                                                        </span>
                                                        {isPrivate && (
                                                            <Lock className="w-3 h-3 text-purple-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                        <Phone className="w-2.5 h-2.5" />
                                                        {phone || "Sin teléfono"}
                                                    </div>
                                                </div>
                                            </div>

                                            {canOpenWhatsapp ? (
                                                <a
                                                    href={`https://wa.me/${normalizedPhone}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 text-xs font-bold cursor-pointer shrink-0"
                                                    >
                                                        WhatsApp
                                                    </Badge>
                                                </a>
                                            ) : (
                                                <Badge 
                                                    variant="outline" 
                                                    className="text-xs font-bold shrink-0"
                                                >
                                                    Sin WhatsApp
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 pt-2 border-t border-border/50">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="w-full h-11 rounded-xl font-bold transition-all"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
