import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputPhone } from "@/components/ui/InputPhone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { ProfileReferralStatsBlock } from "@/components/ProfileReferralStatsBlock";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal para editar el perfil del usuario: nombre, teléfono y avatar.
 * El avatar se guarda en Supabase Storage y la URL en la tabla profiles.
 */
export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { toast } = useToast();
  const { data: profile, refetch } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del formulario
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Al abrir el modal, sincronizar con el perfil cargado
  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(profile?.displayName || "");
    setPhone(profile?.phone || "");
    setAvatarUrl(profile?.avatarUrl || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen, profile?.displayName, profile?.phone, profile?.avatarUrl]);

  const handleClose = () => {
    onClose();
  };

  // Manejar selección de archivo de avatar
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Por favor seleccioná una imagen (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy pesado",
        description: "La imagen debe pesar menos de 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Subir avatar a Supabase Storage (path: {userId}/avatar-{ts}.{ext} para RLS por carpeta)
  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Guardar cambios del perfil
  const handleSave = async () => {
    if (!profile?.userId) {
      toast({
        title: "Error",
        description: "No se pudo cargar tu perfil. Intentá de nuevo.",
        variant: "destructive",
      });
      return;
    }

    // Validaciones
    if (!displayName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresá tu nombre",
        variant: "destructive",
      });
      return;
    }

    // Validar teléfono (solo dígitos, mínimo 8)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      toast({
        title: "Teléfono inválido",
        description: "El teléfono debe tener al menos 8 dígitos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let newAvatarUrl = avatarUrl;

      // Si hay un nuevo avatar para subir
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          newAvatarUrl = await uploadAvatar(profile.userId, avatarFile);
          setUploadingAvatar(false);
        } catch (error) {
          setUploadingAvatar(false);
          console.error("Error uploading avatar:", error);
          toast({
            title: "Error al subir imagen",
            description: "No se pudo subir la imagen. Intentá de nuevo.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Actualizar perfil en Supabase
      const { error } = await (supabase
        .from("profiles") as any)
        .update({
          display_name: displayName.trim(),
          phone: phone.trim(),
          avatar_url: newAvatarUrl,
        })
        .eq("user_id", profile.userId);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se actualizó correctamente",
      });

      // Recargar perfil
      await refetch();

      // Cerrar modal
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <User className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Editar Perfil
          </DialogTitle>
          <DialogDescription className="text-center">
            Actualizá tu información personal y foto de perfil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 cursor-pointer ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all">
                <AvatarImage src={displayAvatar} alt={displayName || "Usuario"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>

              {/* Overlay: solo subir foto desde archivos */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Subir foto"
              >
                <Upload className="w-8 h-8 text-white" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploadingAvatar ? "Subiendo..." : "Subir foto"}
              </Button>
            </div>

            {avatarFile && (
              <p className="text-xs text-muted-foreground">
                Nueva foto: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(0)} KB)
              </p>
            )}

            <p className="text-xs text-muted-foreground text-center max-w-xs">
              JPG, PNG o GIF. Máximo 5MB.
            </p>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="displayName"
                type="text"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Teléfono */}
          <InputPhone
            id="phone"
            label="Teléfono"
            countryCode="+598"
            placeholder="99 123 456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <ProfileReferralStatsBlock
            countForUserId={profile?.userId}
            referredById={profile?.referredById}
            variant="card"
            countLabel="Cantidad de referidos"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading || uploadingAvatar}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || uploadingAvatar}
            className="flex-1 sm:flex-none gap-2"
          >
            {loading || uploadingAvatar ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
