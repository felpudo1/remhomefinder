/**
 * QuickNoteField
 * Cuadro de "nota rápida" de gestión que aparece debajo del bloque de contacto
 * en cada PropertyCard del listado personal/familiar.
 *
 * - Texto corto de hasta 30 caracteres (ej: "Llamé y no respondió").
 * - Cualquier miembro de la familia puede editarla.
 * - Muestra quién la modificó por última vez y cuándo.
 */
import { useEffect, useState } from "react";
import { Pencil, Check, X, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuickNote, QUICK_NOTE_MAX_LENGTH } from "@/hooks/useQuickNote";

interface QuickNoteFieldProps {
    listingId: string;
    initialNote?: string;
    editedByName?: string;
    editedAt?: Date | null;
}

function formatEditedAt(date: Date): string {
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
        return `hoy ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" }) +
        ` ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function QuickNoteField({ listingId, initialNote = "", editedByName, editedAt }: QuickNoteFieldProps) {
    const { saveQuickNote, isSaving } = useQuickNote(listingId);
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialNote);

    useEffect(() => {
        setValue(initialNote);
    }, [initialNote]);

    const hasNote = (initialNote || "").trim().length > 0;

    const handleSave = async (e: React.MouseEvent | React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const ok = await saveQuickNote(value);
        if (ok) setIsEditing(false);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setValue(initialNote);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div
                className="mt-2 flex items-center gap-1.5 bg-muted/50 border border-border rounded-md px-2 py-1.5"
                onClick={(e) => e.stopPropagation()}
            >
                <StickyNote className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, QUICK_NOTE_MAX_LENGTH))}
                    maxLength={QUICK_NOTE_MAX_LENGTH}
                    placeholder="Ej: llamé y no respondió"
                    className="h-7 text-xs px-2"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(e);
                        if (e.key === "Escape") handleCancel(e as any);
                    }}
                />
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {value.length}/{QUICK_NOTE_MAX_LENGTH}
                </span>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 shrink-0"
                    title="Guardar"
                    aria-label="Guardar"
                >
                    <Check className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-muted hover:bg-muted/70 border border-border text-muted-foreground shrink-0"
                    title="Cancelar"
                    aria-label="Cancelar"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div
            className="mt-2 flex items-center gap-1.5 bg-amber-50/60 border border-amber-200 rounded-md px-2 py-1.5"
            onClick={(e) => e.stopPropagation()}
        >
            <StickyNote className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <div className="flex-1 min-w-0">
                {hasNote ? (
                    <>
                        <p className="text-xs text-foreground truncate" title={initialNote}>
                            {initialNote}
                        </p>
                        {(editedByName || editedAt) && (
                            <p className="text-[10px] text-muted-foreground truncate">
                                {editedByName || "Alguien"}
                                {editedAt && <> · {formatEditedAt(editedAt)}</>}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground italic">
                        Agregar nota de gestión…
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white hover:bg-amber-100 border border-amber-300 text-amber-700 shrink-0"
                title={hasNote ? "Editar nota" : "Agregar nota"}
                aria-label={hasNote ? "Editar nota" : "Agregar nota"}
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
