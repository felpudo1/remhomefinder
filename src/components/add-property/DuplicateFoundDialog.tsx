import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Home, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

interface DuplicateFoundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "family" | "marketplace" | null;
  data: {
    addedByName?: string;
    addedAt?: string;
    status?: string;
    url?: string;
    userListingId?: string;
  } | null;
}

/**
 * Dialog profesional para avisar sobre propiedades duplicadas.
 * Siguiendo la REGLA 2: Componente especializado pero con estructura UI base.
 */
export function DuplicateFoundDialog({ isOpen, onClose, type, data }: DuplicateFoundDialogProps) {
  const navigate = useNavigate();

  if (!type || !data) return null;

  const isFamily = type === "family";

  const handleGoToProperty = () => {
    if (isFamily && data.userListingId) {
      // Redirigir al detalle de la propiedad en el dashboard del usuario
      // Asumimos que hay una ruta para ver el detalle. Si no, cerramos.
      onClose();
    } else if (!isFamily && data.url) {
      // Redirigir al Marketplace con el filtro de búsqueda
      const searchUrl = `${ROUTES.MARKETPLACE}?search=${encodeURIComponent(data.url)}`;
      navigate(searchUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        {/* Banner superior de color según el tipo */}
        <div className={`h-2 w-full ${isFamily ? 'bg-amber-500' : 'bg-blue-600'}`} />
        
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 ${isFamily ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {isFamily ? <AlertTriangle className="w-8 h-8" /> : <Users className="w-8 h-8" />}
            </div>
            <DialogTitle className="text-center text-xl font-black leading-tight tracking-tight">
              {isFamily 
                ? "¡ESTE AVISO YA EXISTE EN TU LISTADO FAMILIAR!" 
                : "¡ESTA PUBLICACIÓN YA ESTÁ EN PUJA!"
              }
            </DialogTitle>
            <DialogDescription className="text-center text-sm font-medium text-muted-foreground leading-relaxed">
              {isFamily 
                ? `Este aviso fue ingresado por ${data.addedByName || 'un miembro'} de tu familia${data.addedAt ? ` hace poco` : ''}. No es necesario volver a cargarlo.`
                : "Esta propiedad ya fue ingresada por otro agente y está disponible en el Marketplace para que puedas verla e ingresarla en tu listado."
              }
            </DialogDescription>
          </DialogHeader>

          {isFamily && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                <Home className="w-3.5 h-3.5" /> Estado Actual
              </div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Estado: <span className="capitalize">{data.status || 'Ingresado'}</span>
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-col gap-3">
            <Button 
              onClick={handleGoToProperty}
              className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                isFamily 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
            >
              {isFamily ? "Ver publicación existente" : "Ver en el Marketplace"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full h-10 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Cerrar y descartar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
