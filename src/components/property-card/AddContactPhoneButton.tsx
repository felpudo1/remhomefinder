/**
 * AddContactPhoneButton
 * Botón inline que aparece junto al nombre de contacto en la PropertyCard
 * cuando el listing aún no tiene teléfono guardado. Abre un mini-form para
 * capturar el celular en formato internacional. Una vez guardado desaparece.
 */
import { useState } from "react";
import { Phone, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAddContactPhone } from "@/hooks/useAddContactPhone";

interface AddContactPhoneButtonProps {
    listingId: string;
    /** Si no hay nombre tampoco, ofrecemos capturarlo en el mismo paso. */
    hasContactName: boolean;
}

export function AddContactPhoneButton({ listingId, hasContactName }: AddContactPhoneButtonProps) {
    const { saveContactPhone, isSaving } = useAddContactPhone(listingId);
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");

    const handleSave = async (e: React.MouseEvent | React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const ok = await saveContactPhone(phone, hasContactName ? undefined : name);
        if (ok) {
            setOpen(false);
            setPhone("");
            setName("");
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-[10px] font-medium shadow-sm shrink-0 ml-2"
                title="Agregar celular de contacto"
            >
                <Phone className="w-3 h-3" />
                Agregar celular
            </button>
        );
    }

    return (
        <div
            className="mt-1 flex flex-col gap-1.5 bg-muted/50 border border-border rounded-md px-2 py-2 w-full"
            onClick={(e) => e.stopPropagation()}
        >
            {!hasContactName && (
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre (opcional)"
                    className="h-7 text-xs px-2"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(e);
                    }}
                />
            )}
            <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Input
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="099123456 o +59899123456"
                    className="h-7 text-xs px-2 flex-1"
                    inputMode="tel"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(e);
                        if (e.key === "Escape") setOpen(false);
                    }}
                />
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
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                        setPhone("");
                        setName("");
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-muted hover:bg-muted/70 border border-border text-muted-foreground shrink-0"
                    title="Cancelar"
                    aria-label="Cancelar"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
                Se guarda en formato internacional. No se podrá editar luego.
            </p>
        </div>
    );
}
