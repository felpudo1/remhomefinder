import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PropertyComment } from "@/types/property";

interface CommentsSectionProps {
  comments: PropertyComment[];
  onAddComment: (comment: Omit<PropertyComment, "id" | "createdAt">) => void;
  currentUserDisplayName?: string | null;
  currentUserEmail?: string | null;
  title?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * COMPONENTE: CommentsSection
 * REUTILIZABLE: Maneja la visualización y envío de comentarios/mensajes.
 * Se puede usar en el detalle de propiedad de familias o en paneles de agentes.
 */
export function CommentsSection({
  comments,
  onAddComment,
  currentUserDisplayName,
  currentUserEmail,
  title = "Comentarios",
  placeholder = "Compartí tu opinión sobre esta propiedad...",
  emptyMessage = "Sin comentarios aún. ¡Sé el primero en compartir tu opinión!",
  className = "",
}: CommentsSectionProps) {
  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const author = currentUserDisplayName || currentUserEmail || "Me";
    onAddComment({
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          {title} ({comments.length})
        </span>
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {emptyMessage}
        </p>
      )}

      {/* Frase de seguridad solicitada por JP, siempre visible antes del input */}
      <div className="pb-1 text-center">
        <p className="text-[11px] text-amber-600/80 font-medium">
          🛡️ Este chat es anónimo, solo los miembros del grupo tienen acceso
        </p>
      </div>

      <div className="space-y-3">
        {[...comments]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm">
                {comment.avatar}
              </div>
              <div className="flex-1 bg-muted/60 rounded-xl px-3 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Add comment */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <Textarea
          placeholder={placeholder}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="resize-none text-sm min-h-[80px] rounded-xl border-border/40 focus:border-primary/40 transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">
            ⌘+Enter para enviar
          </span>
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            className="rounded-lg px-4 font-medium shadow-sm active:scale-95 transition-transform"
          >
            Agregar comentario
          </Button>
        </div>
      </div>
    </div>
  );
}
