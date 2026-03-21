import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Genera un UUID compatible con contextos no seguros (HTTP en red local) */
function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback para contextos no seguros
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useImageUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  /**
   * Maneja la selección de una captura de pantalla para previsualización.
   */
  const handleScreenshotSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Seleccioná una imagen");
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  /**
   * Sube múltiples archivos a Storage.
   */
  const uploadFiles = async (files: FileList | null, isPrivate: boolean = false) => {
    if (!files || files.length === 0) return [];
    
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debés estar logueado");
        return [];
      }

      const uploaded: string[] = [];
      const prefix = isPrivate ? "private-" : "";
      
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${prefix}${safeUUID()}.${ext}`;
        
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) {
          console.error("Upload error:", error);
          continue;
        }
        
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      
      if (uploaded.length > 0) {
        toast.success(`${uploaded.length} foto(s) ${isPrivate ? "privada(s) " : ""}subida(s)`);
      }
      return uploaded;
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir fotos");
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Sube un archivo de captura y retorna su URL pública.
   */
  const uploadScreenshot = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/screenshot-${safeUUID()}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Screenshot upload error:", err);
      throw err;
    }
  };

  const resetUploader = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setIsUploading(false);
  };

  return {
    isUploading,
    screenshotFile,
    screenshotPreview,
    handleScreenshotSelect,
    uploadFiles,
    uploadScreenshot,
    resetUploader,
    setScreenshotFile,
    setScreenshotPreview
  };
}
