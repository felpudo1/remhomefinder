import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Loader2 } from "lucide-react";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import type {
  DuplicateCase1,
  DuplicateCase2a,
  DuplicateCase2b,
  DuplicateCase3,
  DuplicateCase4,
  DuplicateCase5,
} from "@/types/duplicate-cases";
import { DUPLICATE_MESSAGES } from "@/types/duplicate-cases";

/** Props base para todos los casos */
interface BaseDuplicateAlertProps {
  /** Callback para cerrar el modal de duplicado */
  onClose: () => void;
  /** Callback para cerrar el modal padre (AddPropertyModal) */
  onCloseParent?: () => void;
  /** Callback para abrir el detalle de un listing existente */
  onOpenListing?: (userListingId: string) => void;
  /** Callback para abrir una publicación de agente existente */
  onOpenAgentPublication?: (agentPublicationId: string) => void;
}

/** Props específicas por caso */
type DuplicateAlertProps = BaseDuplicateAlertProps &
  (
    | DuplicateCase1
    | DuplicateCase2a
    | DuplicateCase2b
    | DuplicateCase3
    | DuplicateCase4
    | DuplicateCase5
  );

/**
 * Formatea una fecha ISO a formato local DD/MM/YYYY
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Genera el enlace de WhatsApp con mensaje prellenado
 */
function buildWhatsAppUrl(digits: string | null, listingUrl: string): string | null {
  if (!digits) return null;
  const message = encodeURIComponent(
    `Hola! Vi tu publicación en RemHomeFinder y me interesa:\n${listingUrl}`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

/**
 * ============================================================================
 * DUPLICATE ALERT DIALOG
 * ============================================================================
 * 
 * Modal unificado para mostrar alertas de duplicado según el caso.
 * 
 * Muestra etiqueta "C1", "C2", etc. en la esquina superior derecha
 * para debugging visual del flujo.
 * ============================================================================
 */
export function DuplicateAlertDialog({
  onClose,
  onCloseParent,
  onOpenListing,
  onOpenAgentPublication,
  ...props
}: DuplicateAlertProps) {
  const { case: caseId } = props;

  /** Renderiza el contenido según el caso */
  function renderContent() {
    switch (caseId) {
      /** ── CASO 1: Agente repite su propia publicación ── */
      case "C1": {
        const { publishedByName, createdAt, agentPublicationId } = props as DuplicateCase1;
        const msgs = DUPLICATE_MESSAGES.C1;

        return {
          title: msgs.title,
          description: msgs.subtitle(publishedByName, formatDate(createdAt)),
          actions: (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  if (agentPublicationId && onOpenAgentPublication) {
                    onOpenAgentPublication(agentPublicationId);
                  }
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {msgs.actionLabel}
              </Button>
            </>
          ),
        };
      }

      /** ── CASO 2A: Usuario ya tiene el aviso en su listado + está en marketplace ── */
      case "C2a": {
        const { agencyName, agentName, whatsappDigits, listingUrl } =
          props as DuplicateCase2a;
        const msgs = DUPLICATE_MESSAGES.C2a;
        const whatsappUrl = buildWhatsAppUrl(whatsappDigits, listingUrl);

        return {
          title: msgs.title,
          description: (
            <div className="space-y-2">
              <p className="font-semibold">{msgs.subtitle}</p>
              <p>{msgs.agencyMsg(agencyName)}</p>
              <p className="text-sm text-muted-foreground">
                <strong>{agentName}</strong> es tu agente de contacto
              </p>
            </div>
          ),
          actions: (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("C2a Cerrar clicked");
                  onClose();
                  if (onCloseParent) {
                    console.log("C2a Cerrar: cerrando modal padre");
                    onCloseParent();
                  }
                }}
              >
                Cerrar
              </Button>
              {whatsappUrl && (
                <Button
                  onClick={() => {
                    console.log("C2a WhatsApp clicked");
                    window.open(whatsappUrl, "_blank");
                    onClose();
                    if (onCloseParent) {
                      onCloseParent();
                    }
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  {msgs.actionLabel}
                </Button>
              )}
            </>
          ),
        };
      }

      /** ── CASO 2B: Usuario NO tiene el aviso en su listado + está en marketplace ── */
      case "C2b": {
        const { agencyName, agentName, whatsappDigits, listingUrl, onSaveToListing, isSaving } =
          props as DuplicateCase2b;
        const msgs = DUPLICATE_MESSAGES.C2b;
        const whatsappUrl = buildWhatsAppUrl(whatsappDigits, listingUrl);

        return {
          title: msgs.title,
          description: (
            <div className="space-y-2">
              <p>{msgs.agencyMsg(agencyName)}</p>
              <p className="text-sm text-muted-foreground">
                <strong>{agentName}</strong> es su agente de contacto
              </p>
            </div>
          ),
          actions: (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
              >
                Cancelar
              </Button>
              {onSaveToListing && (
                <Button
                  onClick={() => {
                    onSaveToListing();
                    // Después de guardar, abrir WhatsApp si hay número
                    if (whatsappUrl) {
                      window.open(whatsappUrl, "_blank");
                    }
                    onClose();
                    if (onCloseParent) {
                      onCloseParent();
                    }
                  }}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                    </>
                  )}
                  {msgs.actionLabel}
                </Button>
              )}
              {!onSaveToListing && whatsappUrl && (
                <Button
                  onClick={() => {
                    window.open(whatsappUrl, "_blank");
                    onClose();
                    if (onCloseParent) {
                      onCloseParent();
                    }
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contactar por WhatsApp
                </Button>
              )}
            </>
          ),
        };
      }

      /** ── CASO 3: Usuario repite en su listado familiar ── */
      case "C3": {
        const { addedByName, addedAt, status, userListingId, appName = "HomeFinder" } = props as DuplicateCase3;
        const msgs = DUPLICATE_MESSAGES.C3;

        return {
          title: msgs.title,
          description: (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ingresada por <strong>{addedByName}</strong> el{" "}
                <strong>{formatDate(addedAt)}</strong>
              </p>
              <p className="text-base">{msgs.subtitle(appName)}</p>
              <p className="text-sm text-muted-foreground">
                Estado: <strong>{status}</strong>
              </p>
            </div>
          ),
          actions: (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  if (onOpenListing) {
                    onOpenListing(userListingId);
                  }
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {msgs.actionLabel}
              </Button>
            </>
          ),
        };
      }

      /** ── CASO 4: Agente intenta ingresar aviso que ya está en listado de usuarios ── */
      case "C4": {
        const { usersCount, users, onAddExisting, isAdding } = props as DuplicateCase4;
        const msgs = DUPLICATE_MESSAGES.C4;

        return {
          title: msgs.title(usersCount),
          description: (
            <div className="space-y-3">
              <p className="text-sm font-medium">{msgs.subtitle}</p>
              {/* Lista de usuarios */}
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/50">
                {users.map((user) => (
                  <div key={user.userListingId} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Estado: {user.status} · Ingresado el {formatDate(user.addedAt)}
                      </p>
                      {user.phone && (
                        <p className="text-xs text-muted-foreground">📞 {user.phone}</p>
                      )}
                    </div>
                    {user.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 px-2"
                        onClick={() => {
                          const digits = normalizeWhatsAppPhone(user.phone!);
                          if (digits) {
                            window.open(`https://wa.me/${digits}?text=${encodeURIComponent("Hola! Te contacto desde HomeFinder respecto a una propiedad.")}`, "_blank");
                          }
                        }}
                        title="Contactar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ),
          actions: (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onAddExisting();
                  onClose();
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
                disabled={isAdding}
                className="gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                {msgs.actionLabelAdd}
              </Button>
            </>
          ),
        };
      }

      /** ── CASO 5: Usuario B intenta ingresar aviso de Usuario A ── */
      case "C5": {
        const {
          addedByName,
          familyName,
          addedAt,
          userListingId,
          onAddAnyway,
          isAdding,
        } = props as DuplicateCase5;
        const msgs = DUPLICATE_MESSAGES.C5;

        return {
          title: msgs.title,
          description: msgs.subtitle(addedByName, familyName, formatDate(addedAt)),
          actions: (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  // TODO: Navegar al listing existente
                  console.log("Ver listing existente:", userListingId);
                  if (onCloseParent) {
                    onCloseParent();
                  }
                }}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {msgs.actionLabel}
              </Button>
              {onAddAnyway && (
                <Button
                  onClick={() => {
                    onAddAnyway();
                    onClose();
                    if (onCloseParent) {
                      onCloseParent();
                    }
                  }}
                  disabled={isAdding}
                  className="gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {msgs.addAnywayLabel}
                </Button>
              )}
            </>
          ),
        };
      }

      default:
        return {
          title: "Error",
          description: "Caso de duplicado no reconocido.",
          actions: (
            <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
          ),
        };
    }
  }

  const { title, description, actions } = renderContent();

  return (
    <AlertDialog open onOpenChange={(open) => {
      // Solo cerrar si open es false (usuario hizo click fuera o presionó Escape)
      if (!open) {
        onClose();
      }
    }}>
      <AlertDialogContent className="sm:max-w-[425px]">
        {/* Etiqueta de caso para debugging (visible solo en dev) */}
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow">
          {caseId}
        </div>

        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-center">⚠️ {title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:justify-center gap-2 sm:gap-0">
          {actions}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
