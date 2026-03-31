import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Bell,
  Clock,
  History,
} from "lucide-react";
import { useAnnouncements, useAnnouncementHistory } from "@/hooks/useAnnouncements";
import type { PendingAnnouncement, AnnouncementHistoryItem } from "@/hooks/useAnnouncements";
import { useCurrentUser } from "@/contexts/AuthProvider";

/**
 * Componente Overlay de Anuncios — COMPLETAMENTE DESACOPLADO.
 *
 * Se inyecta en el layout principal (App.tsx) y no ensucia la lógica
 * de ninguna página. Internamente verifica si hay usuario logueado y
 * si hay anuncios pendientes. Si no hay nada, retorna null.
 *
 * Características:
 * - Muestra anuncios pendientes uno a la vez en modal premium
 * - Prioridad "urgent" → estilo visual diferente (rojo/dorado)
 * - Soporte para imagen adjunta
 * - Botón de historial (campanita) para ver novedades pasadas
 */
export function AnnouncementOverlay() {
  const { user } = useCurrentUser();
  const {
    pendingAnnouncements,
    dismissAnnouncement,
    isDismissing,
    isLoading,
  } = useAnnouncements();

  // Estado del modal de anuncio activo
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Estado del modal de historial
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Abrir modal cuando hay anuncios pendientes (solo si el usuario está logueado)
  useEffect(() => {
    if (!isLoading && pendingAnnouncements.length > 0 && user) {
      setCurrentIndex(0);
      setIsOpen(true);
    }
  }, [isLoading, pendingAnnouncements.length, user]);

  /**
   * Maneja el dismiss del anuncio actual.
   * Si hay más anuncios pendientes, muestra el siguiente.
   * Si era el último, cierra el modal.
   */
  const handleDismiss = async () => {
    const current = pendingAnnouncements[currentIndex];
    if (!current) return;

    await dismissAnnouncement(current.id);

    if (currentIndex < pendingAnnouncements.length - 1) {
      // Hay más anuncios: avanzar al siguiente
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Era el último: cerrar modal
      setIsOpen(false);
    }
  };

  // Si no hay usuario logueado, no renderizar nada
  if (!user) return null;

  const currentAnnouncement = pendingAnnouncements[currentIndex] ?? null;
  const isUrgent = currentAnnouncement?.priority === "urgent";
  const totalPending = pendingAnnouncements.length;

  return (
    <>
      {/* ═══════════ Modal de Anuncio Activo ═══════════ */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Solo permitir cerrar con el botón "Entendido"
        if (!open && !isDismissing) {
          handleDismiss();
        }
      }}>
        <DialogContent
          className={`max-w-lg rounded-[2rem] p-0 overflow-hidden border-none animate-in zoom-in-95 duration-300 [&>button]:bg-white/10 [&>button]:border [&>button]:border-white/20 [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:rounded-full [&>button]:p-2.5 [&>button]:top-5 [&>button]:right-5 [&>button>svg]:w-5 [&>button>svg]:h-5 ${
            isUrgent
              ? "shadow-[0_0_60px_rgba(239,68,68,0.3)]"
              : "shadow-[0_0_60px_rgba(var(--primary-rgb),0.2)]"
          }`}
        >
          {currentAnnouncement && (
            <AnnouncementCard
              announcement={currentAnnouncement}
              currentIndex={currentIndex}
              totalCount={totalPending}
              isDismissing={isDismissing}
              onDismiss={handleDismiss}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════ Botón flotante de historial ═══════════ */}
      <button
        type="button"
        onClick={() => setIsHistoryOpen(true)}
        className="fixed bottom-8 left-8 w-11 h-11 bg-card border border-border rounded-2xl flex items-center justify-center card-shadow z-20 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
        title="Historial de novedades"
      >
        <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
        {/* Badge de pendientes */}
        {totalPending > 0 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {totalPending}
          </span>
        )}
      </button>

      {/* ═══════════ Modal de Historial ═══════════ */}
      <AnnouncementHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
}

// ── Sub-componente: Tarjeta de Anuncio Premium ────────────────────────

interface AnnouncementCardProps {
  /** El anuncio a mostrar */
  announcement: PendingAnnouncement;
  /** Índice actual (0-based) para el contador "1 de N" */
  currentIndex: number;
  /** Total de anuncios pendientes */
  totalCount: number;
  /** Si el dismiss está en proceso */
  isDismissing: boolean;
  /** Callback para marcar como leído */
  onDismiss: () => void;
}

function AnnouncementCard({
  announcement,
  currentIndex,
  totalCount,
  isDismissing,
  onDismiss,
}: AnnouncementCardProps) {
  const isUrgent = announcement.priority === "urgent";
  const hasImage = announcement.image_url && announcement.image_url.length > 0;
  const [showContent, setShowContent] = useState(false);

  // Animación de entrada escalonada
  useEffect(() => {
    setShowContent(false);
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [announcement.id]);

  return (
    <div
      className={`relative overflow-hidden min-h-[400px] flex flex-col ${
        isUrgent
          ? "bg-gradient-to-br from-[#2c1a1a] via-[#4a1a1a] to-[#2c1a1a]"
          : "bg-gradient-to-br from-[#1a1c2c] via-[#1a2c4a] to-[#1a1c2c]"
      }`}
    >
      {/* Decoraciones de fondo */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-40 h-40 rounded-full blur-3xl animate-pulse ${
          isUrgent ? "bg-red-500/20" : "bg-primary/20"
        }`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-40 h-40 rounded-full blur-3xl animate-pulse delay-700 ${
          isUrgent ? "bg-orange-500/20" : "bg-blue-500/20"
        }`}
      />

      {/* Contenido */}
      <div className="relative z-10 p-8 flex-1 flex flex-col">
        {/* Badge superior */}
        <div
          className={`transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${
                isUrgent
                  ? "bg-red-500/10 border-red-500/20 text-red-300"
                  : "bg-white/10 border-white/20 text-blue-200"
              }`}
            >
              {isUrgent ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {isUrgent ? "Aviso Urgente" : "Novedad"}
              </span>
            </div>
            {totalCount > 1 && (
              <span className="text-[10px] text-gray-400 font-medium">
                {currentIndex + 1} de {totalCount}
              </span>
            )}
          </div>
        </div>

        {/* Ícono Central */}
        <div
          className={`transition-all duration-700 delay-100 ${
            showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 blur-2xl opacity-40 animate-pulse ${
                  isUrgent ? "bg-red-500" : "bg-primary"
                }`}
              />
              <div
                className={`relative p-4 rounded-2xl shadow-2xl ${
                  isUrgent
                    ? "bg-gradient-to-b from-red-400 to-red-600"
                    : "bg-gradient-to-b from-blue-400 to-primary"
                }`}
              >
                <Megaphone className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Título y Cuerpo */}
        <div
          className={`space-y-4 flex-1 transition-all duration-700 delay-300 ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-2xl font-black tracking-tight text-white text-center leading-tight">
            {announcement.title}
          </h2>

          {/* Imagen adjunta (si hay) */}
          {hasImage && (
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg mx-auto max-w-sm">
              <img
                src={announcement.image_url}
                alt={announcement.title}
                className="w-full h-auto object-cover max-h-48"
                loading="lazy"
              />
            </div>
          )}

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {announcement.body}
            </p>
          </div>
        </div>

        {/* Fecha */}
        <div
          className={`flex items-center justify-center gap-1.5 text-gray-500 text-[10px] mt-4 transition-all duration-500 delay-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <Clock className="w-3 h-3" />
          {new Date(announcement.created_at).toLocaleDateString("es-UY", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        {/* Botón Entendido */}
        <div
          className={`pt-4 transition-all duration-700 delay-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            className={`w-full h-12 rounded-2xl text-sm font-bold border-none shadow-lg transition-all hover:scale-[1.02] active:scale-95 gap-2 ${
              isUrgent
                ? "bg-gradient-to-r from-red-400 via-red-500 to-orange-600 hover:from-red-300 hover:to-orange-500 text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)]"
                : "bg-gradient-to-r from-blue-400 via-primary to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)]"
            }`}
            onClick={onDismiss}
            disabled={isDismissing}
          >
            {isDismissing ? (
              "Guardando..."
            ) : totalCount > 1 && currentIndex < totalCount - 1 ? (
              <>
                Entendido — Siguiente
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              "¡Entendido!"
            )}
          </Button>
        </div>
      </div>

      {/* Footer discreto */}
      <div
        className={`p-3 text-center border-t ${
          isUrgent ? "bg-[#1a0f0f] border-red-500/10" : "bg-[#0f111a] border-white/5"
        }`}
      >
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">
          📢 Centro de Novedades
        </p>
      </div>
    </div>
  );
}

// ── Sub-componente: Modal de Historial ────────────────────────────────

interface HistoryModalProps {
  /** Si el modal está abierto */
  open: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
}

function AnnouncementHistoryModal({ open, onClose }: HistoryModalProps) {
  const { history, isLoading } = useAnnouncementHistory();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden max-h-[80vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Historial de Novedades
              </h2>
              <p className="text-xs text-muted-foreground">
                Mensajes anteriores del equipo
              </p>
            </div>
          </div>
        </div>

        {/* Lista de anuncios leídos */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Cargando historial...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aún no tenés novedades leídas
              </p>
            </div>
          ) : (
            history.map((item: AnnouncementHistoryItem) => (
              <HistoryCard key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 border-t border-border">
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-componente: Tarjeta de historial ──────────────────────────────

interface HistoryCardProps {
  /** Item del historial (anuncio leído) */
  item: AnnouncementHistoryItem;
}

function HistoryCard({ item }: HistoryCardProps) {
  const isUrgent = item.priority === "urgent";
  const hasImage = item.image_url && item.image_url.length > 0;

  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        isUrgent
          ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
          : "border-border bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isUrgent ? "bg-red-500/10" : "bg-primary/10"
          }`}
        >
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <Megaphone className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-sm font-bold text-foreground truncate">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.body}
          </p>
          {hasImage && (
            <div className="pt-1">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full max-h-24 object-cover rounded-lg border border-border"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1">
            <Clock className="w-3 h-3" />
            Leído el{" "}
            {new Date(item.dismissed_at).toLocaleDateString("es-UY", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
