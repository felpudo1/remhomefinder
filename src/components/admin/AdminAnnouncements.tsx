import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useAdminAnnouncements } from "@/hooks/useAnnouncements";
import type { AdminAnnouncement } from "@/hooks/useAnnouncements";
import type { AnnouncementAudience, AnnouncementPriority } from "@/types/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Plus,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  Users,
  User,
  Building2,
  Target,
  RefreshCw,
  Clock,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos locales (sin any) ────────────────────────────────────────────

/** Perfil de usuario para el buscador de "Usuario Específico" */
interface UserSearchResult {
  user_id: string;
  display_name: string;
  email: string | null;
}

/** Estado del formulario de creación/edición */
interface AnnouncementForm {
  title: string;
  body: string;
  image_url: string;
  audience: AnnouncementAudience;
  target_user_id: string;
  priority: AnnouncementPriority;
  expires_at: string;
}

/** Valores iniciales del formulario */
const EMPTY_FORM: AnnouncementForm = {
  title: "",
  body: "",
  image_url: "",
  audience: "all",
  target_user_id: "",
  priority: "normal",
  expires_at: "",
};

// ── Constantes de audiencia ────────────────────────────────────────────

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Users },
  { value: "agents", label: "Solo Agentes", icon: Building2 },
  { value: "users", label: "Solo Usuarios", icon: User },
  { value: "specific", label: "Usuario Específico", icon: Target },
];

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: "Todos",
  agents: "Solo Agentes",
  users: "Solo Usuarios",
  specific: "Específico",
};

/**
 * Panel de administración de anuncios/novedades.
 * Permite crear, activar/desactivar y eliminar anuncios broadcast.
 *
 * Incluye:
 * - Tabla de anuncios con estado, audiencia, lecturas y acciones
 * - Modal de creación con buscador de usuario por nombre/email
 * - Soporte para imágenes adjuntas
 * - Prioridad normal/urgente
 * - Fecha de expiración opcional
 */
export function AdminAnnouncements() {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { announcements, isLoading, refetch, invalidateAll } = useAdminAnnouncements();

  // Estado del modal de creación
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Estado del buscador de usuarios
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState("");

  // Estado de confirmación de eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estado de refresco
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtro de búsqueda en la tabla
  const [tableSearch, setTableSearch] = useState("");

  // ── Filtrado de anuncios en la tabla ──────────────────────────────────

  const filteredAnnouncements = useMemo(() => {
    if (!tableSearch.trim()) return announcements;
    const q = tableSearch.toLowerCase();
    return announcements.filter(
      (a: AdminAnnouncement) =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q)
    );
  }, [announcements, tableSearch]);

  // ── Handlers ─────────────────────────────────────────────────────────

  /**
   * Busca usuarios por nombre o email (ambos) para el campo "Usuario Específico".
   * Usa ILIKE en la BD para match parcial case-insensitive.
   */
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Búsqueda dual: por display_name O email con ILIKE
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      setUserSearchResults(
        (data ?? []).map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name || "Sin nombre",
          email: p.email,
        }))
      );
    } catch (err) {
      console.error("Error buscando usuarios:", err);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Selecciona un usuario del buscador para enviarle un anuncio específico.
   */
  const handleSelectUser = (result: UserSearchResult) => {
    setForm((prev) => ({ ...prev, target_user_id: result.user_id }));
    setSelectedUserName(`${result.display_name} (${result.email || "sin email"})`);
    setUserSearchQuery("");
    setUserSearchResults([]);
  };

  /**
   * Crea un nuevo anuncio en la base de datos.
   */
  const handleCreate = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: "Error", description: "Título y cuerpo son obligatorios.", variant: "destructive" });
      return;
    }

    if (form.audience === "specific" && !form.target_user_id) {
      toast({ title: "Error", description: "Seleccioná un usuario para envío específico.", variant: "destructive" });
      return;
    }

    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("announcements").insert({
        title: form.title.trim(),
        body: form.body.trim(),
        image_url: form.image_url.trim(),
        audience: form.audience,
        target_user_id: form.audience === "specific" ? form.target_user_id : null,
        priority: form.priority,
        created_by: user.id,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });

      if (error) throw error;

      toast({ title: "Anuncio creado", description: `"${form.title}" se enviará a ${AUDIENCE_LABELS[form.audience]}.` });
      setForm(EMPTY_FORM);
      setSelectedUserName("");
      setIsCreateOpen(false);
      invalidateAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al crear anuncio", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Activa o desactiva un anuncio (toggle is_active).
   */
  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentlyActive })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: currentlyActive ? "Anuncio desactivado" : "Anuncio activado",
        description: currentlyActive ? "Ya no se mostrará a los usuarios." : "Ahora se mostrará a los usuarios.",
      });
      invalidateAll();
    }
  };

  /**
   * Elimina un anuncio permanentemente.
   */
  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anuncio eliminado", description: "Se eliminó permanentemente." });
      invalidateAll();
    }
    setDeletingId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Mensajes y Novedades
            </h2>
            <p className="text-xs text-muted-foreground">
              {announcements.length} anuncio{announcements.length !== 1 ? "s" : ""} en total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setSelectedUserName("");
              setIsCreateOpen(true);
            }}
            className="rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Mensaje
          </Button>
        </div>
      </div>

      {/* Buscador en tabla */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título o contenido..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          className="pl-9 h-9 rounded-xl text-sm"
        />
      </div>

      {/* Tabla de anuncios */}
      {filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <Megaphone className="w-10 h-10 mx-auto opacity-30" />
          <p>
            {tableSearch ? "No hay anuncios que coincidan." : "Aún no hay anuncios creados."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Título</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[100px]">Audiencia</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[70px]">Prioridad</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[60px] text-center">Leídos</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[80px]">Estado</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[90px]">Fecha</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnnouncements.map((a: AdminAnnouncement) => {
                const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
                return (
                  <TableRow key={a.id} className="group">
                    <TableCell className="py-2 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {a.image_url && (
                          <Image className="w-3 h-3 text-primary/60 shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium max-w-[200px]">
                          {a.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                        a.audience === "all" ? "bg-blue-50 text-blue-700" :
                        a.audience === "agents" ? "bg-purple-100 text-purple-800" :
                        a.audience === "users" ? "bg-green-100 text-green-800" :
                        "bg-orange-100 text-orange-800"
                      )}>
                        {AUDIENCE_LABELS[a.audience] || a.audience}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                        a.priority === "urgent" ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground"
                      )}>
                        {a.priority === "urgent" ? "🔴 Urgente" : "Normal"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 w-6 h-6 rounded-full text-[10px] font-bold">
                        {a.reads_count}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        isExpired ? "bg-gray-100 text-gray-500" :
                        a.is_active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      )}>
                        {isExpired ? "Expirado" : a.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("es-UY", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={a.is_active ? "outline" : "default"}
                          className="h-6 text-[10px] px-2 rounded-lg gap-1"
                          onClick={() => handleToggleActive(a.id, a.is_active)}
                          title={a.is_active ? "Desactivar" : "Activar"}
                        >
                          {a.is_active ? (
                            <><EyeOff className="w-3 h-3" /> Off</>
                          ) : (
                            <><Eye className="w-3 h-3" /> On</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0 rounded-lg"
                          onClick={() => setDeletingId(a.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ═══════════ Modal de Creación ═══════════ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Nuevo Mensaje
            </DialogTitle>
            <DialogDescription>
              Creá un anuncio que se mostrará a los usuarios al iniciar la app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="announcement-title" className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="announcement-title"
                placeholder="Ej: ¡Nueva funcionalidad disponible!"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            {/* Cuerpo */}
            <div className="space-y-1.5">
              <Label htmlFor="announcement-body" className="text-sm font-medium">
                Mensaje <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="announcement-body"
                placeholder="Escribí el contenido del anuncio..."
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                className="rounded-xl min-h-[100px]"
                rows={4}
              />
            </div>

            {/* URL de Imagen */}
            <div className="space-y-1.5">
              <Label htmlFor="announcement-image" className="text-sm font-medium flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-muted-foreground" />
                Imagen (URL)
              </Label>
              <Input
                id="announcement-image"
                placeholder="https://ejemplo.com/imagen.png (opcional)"
                value={form.image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                className="rounded-xl"
              />
              {form.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-border max-h-32">
                  <img
                    src={form.image_url}
                    alt="Vista previa"
                    className="w-full h-full object-cover max-h-32"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Audiencia */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Audiencia</Label>
              <Select
                value={form.audience}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    audience: val as AnnouncementAudience,
                    target_user_id: val !== "specific" ? "" : prev.target_user_id,
                  }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buscador de Usuario Específico */}
            {form.audience === "specific" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Buscar usuario por nombre o email
                </Label>
                {selectedUserName ? (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate flex-1">
                      {selectedUserName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 rounded-lg"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, target_user_id: "" }));
                        setSelectedUserName("");
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Escribí nombre o email..."
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {/* Resultados del buscador */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {userSearchResults.map((result) => (
                          <button
                            key={result.user_id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                            onClick={() => handleSelectUser(result)}
                          >
                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                              {result.display_name}
                            </span>
                            {result.email && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {result.email}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prioridad */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Mensaje Urgente
              </Label>
              <Switch
                checked={form.priority === "urgent"}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: checked ? "urgent" : "normal",
                  }))
                }
              />
            </div>

            {/* Fecha de expiración */}
            <div className="space-y-1.5">
              <Label htmlFor="announcement-expires" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Expira el (opcional)
              </Label>
              <Input
                id="announcement-expires"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !form.title.trim() || !form.body.trim()}
              className="rounded-xl gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Megaphone className="w-4 h-4" />
              )}
              Crear Anuncio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Confirmación de Eliminación ═══════════ */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ Eliminar Anuncio
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro? Esta acción eliminará el anuncio permanentemente junto con
              todos los registros de lectura asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
