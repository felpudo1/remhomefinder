import { PropertyStatus, STATUS_CONFIG } from "@/types/property";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PropertyStatusSelectorProps {
  currentStatus: PropertyStatus;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

/**
 * Componente para seleccionar y cambiar el estado de una propiedad.
 * Encapsula las reglas de transición permitidas y el diseño del selector.
 */
export function PropertyStatusSelector({ 
  currentStatus, 
  onStatusChange, 
  disabled 
}: PropertyStatusSelectorProps) {
  
  const statusOptions: PropertyStatus[] = [
    "ingresado", 
    "contactado", 
    "visita_coordinada", 
    "posible_interes", 
    "firme_candidato", 
    "meta_conseguida", 
    "descartado"
  ];

  // Reglas de negocio: transiciones permitidas según el estado actual
  const statusTransitionsByOrigin: Partial<Record<PropertyStatus, Set<PropertyStatus>>> = {
    ingresado: new Set<PropertyStatus>(["contactado", "descartado"]),
    contactado: new Set<PropertyStatus>(["visita_coordinada", "descartado"]),
    visita_coordinada: new Set<PropertyStatus>(["firme_candidato", "posible_interes", "descartado"]),
    posible_interes: new Set<PropertyStatus>(["firme_candidato", "meta_conseguida", "descartado"]),
    firme_candidato: new Set<PropertyStatus>(["meta_conseguida", "descartado"]),
  };

  const allowedNextStatuses = statusTransitionsByOrigin[currentStatus];

  return (
    <Select
      value={currentStatus}
      onValueChange={onStatusChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        "h-8 text-xs w-auto border-border bg-background px-2 gap-1 rounded-lg",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((key) => {
          const cfg = STATUS_CONFIG[key];
          return (
            <SelectItem
              key={key}
              value={key}
              className="text-xs data-[disabled]:text-muted-foreground/40"
              disabled={!!allowedNextStatuses && !allowedNextStatuses.has(key)}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
