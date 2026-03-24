import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputPhone } from "@/components/ui/InputPhone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados del formulario
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Estados de la cámara
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Resetear estados cuando se abre el modal
  useState(() => {
    if (isOpen) {
      setDisplayName(profile?.displayName || "");
      setPhone(profile?.phone || "");
      setAvatarUrl(profile?.avatarUrl || "");
      setAvatarFile(null);
      setAvatarPreview(null);
      setShowCamera(false);
      setCameraError(null);
      stopCamera();
    }
  });

  // Cleanup al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  // Manejar cierre del modal
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // Abrir la cámara
  const openCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setCameraError("No se pudo acceder a la cámara. Verificá los permisos.");
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verificá los permisos del navegador.",
        variant: "destructive",
      });
    }
  };

  // Tomar foto de la cámara
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con el tamaño del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a blob y crear file
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `selfie-${Date.now()}.png`, {
        type: 'image/png',
      });

      setAvatarFile(file);
      setAvatarPreview(canvas.toDataURL('image/png'));
      stopCamera();

      toast({
        title: "¡Foto tomada!",
        description: "Tu selfie se cargó correctamente",
      });
    }, 'image/png');
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

  // Subir avatar a Supabase Storage
  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

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
      const { error } = await supabase
        .from("profiles")
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

  // Eliminar avatar actual
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
              
              {/* Overlay para subir avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Cambiar foto"
              >
                <Camera className="w-8 h-8 text-white" />
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
                disabled={uploadingAvatar || showCamera}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploadingAvatar ? "Subiendo..." : "Subir foto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openCamera}
                disabled={uploadingAvatar || showCamera}
                className="gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Tomar selfie
              </Button>
              {displayAvatar && !showCamera && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="text-red-600 hover:text-red-700"
                >
                  Eliminar
                </Button>
              )}
            </div>

            {avatarFile && (
              <p className="text-xs text-muted-foreground">
                Nueva foto: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(0)} KB)
              </p>
            )}

            <p className="text-xs text-muted-foreground text-center max-w-xs">
              JPG, PNG o GIF. Máximo 5MB.
            </p>

            {/* Vista previa de la cámara */}
            {showCamera && (
              <div className="relative bg-black rounded-xl overflow-hidden mt-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Controles de la cámara */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      size="lg"
                      onClick={takePhoto}
                      className="bg-white text-black hover:bg-gray-200 gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Tomar foto
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="lg"
                      onClick={stopCamera}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-red-600 text-center">{cameraError}</p>
            )}
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
