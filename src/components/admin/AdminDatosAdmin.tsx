import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KeyRound, Plus, Save, Loader2, Trash2, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminKey {
  id: string;
  cuenta: string;
  descripcion: string;
  texto: string;
  estado: string;
  fecha: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  estado_updated_at: string;
}

export function AdminDatosAdmin() {
  const { data: profile } = useProfile();
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [cuenta, setCuenta] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("valido");
  const [fecha, setFecha] = useState<Date | undefined>(undefined);

  // Inline editing estado
  const [editingEstado, setEditingEstado] = useState<Record<string, string>>({});

  const fetchKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_keys" as any)
      .select("id, cuenta, descripcion, texto, estado, fecha, created_by, created_by_name, created_at, updated_at, estado_updated_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching admin_keys:", error);
      toast.error("Error al cargar datos");
    } else {
      setKeys((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSave = async () => {
    if (!cuenta.trim()) {
      toast.error("El campo Cuenta es obligatorio");
      return;
    }
    setSaving(true);
    try {
      if (!profile) throw new Error("No autenticado");

      const { error } = await supabase.from("admin_keys" as any).insert({
        cuenta: cuenta.trim(),
        descripcion: descripcion.trim(),
        texto: texto.trim(),
        estado,
        fecha: fecha ? format(fecha, "yyyy-MM-dd") : null,
        created_by: profile.userId,
        created_by_name: profile?.displayName || user.email || "",
      } as any);

      if (error) throw error;
      toast.success("Dato guardado correctamente");
      setCuenta("");
      setDescripcion("");
      setTexto("");
      setEstado("valido");
      setFecha(undefined);
      fetchKeys();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (id: string, newEstado: string) => {
    const { error } = await supabase
      .from("admin_keys" as any)
      .update({ estado: newEstado } as any)
      .eq("id", id);
    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success("Estado actualizado");
      fetchKeys();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    const { error } = await supabase.from("admin_keys" as any).delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Registro eliminado");
      fetchKeys();
    }
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDateOnly = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <KeyRound className="w-4 h-4" />
        <p>Datos privados del administrador. Solo visibles para admins.</p>
      </div>

      {/* Form */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nuevo registro
        </h3>

        {/* Row 1: Cuenta + Descripción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cuenta *</Label>
            <Input
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value)}
              placeholder="Pegá la cuenta aquí..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del dato..."
              className="text-sm"
            />
          </div>
        </div>

        {/* Row 2: Texto */}
        <div className="space-y-1.5">
          <Label className="text-xs">Texto</Label>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Texto adicional..."
            className="text-sm min-h-[80px]"
          />
        </div>

        {/* Row 3: Estado + Fecha (left) | Admin + Guardar (right) */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="w-[140px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valido">Válido</SelectItem>
                  <SelectItem value="caducado">Caducado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left text-sm font-normal",
                      !fecha && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {fecha ? format(fecha, "dd/MM/yyyy") : "Seleccionar..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={setFecha}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Admin</Label>
              <Input
                value={profile?.displayName || ""}
                disabled
                className="text-sm w-[180px] bg-muted"
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !cuenta.trim()} size="sm" className="gap-1.5">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay registros aún.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Cuenta</TableHead>
                <TableHead className="text-xs">Descripción</TableHead>
                <TableHead className="text-xs">Texto</TableHead>
                <TableHead className="text-xs">Estado</TableHead>
                <TableHead className="text-xs">Fecha</TableHead>
                <TableHead className="text-xs">Admin</TableHead>
                <TableHead className="text-xs">Creado</TableHead>
                <TableHead className="text-xs">Mod. Estado</TableHead>
                <TableHead className="text-xs w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="text-xs font-mono max-w-[200px] truncate" title={k.cuenta}>
                    {k.cuenta}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate" title={k.descripcion}>
                    {k.descripcion}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate" title={k.texto}>
                    {k.texto}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editingEstado[k.id] ?? k.estado}
                      onValueChange={(val) => {
                        setEditingEstado(prev => ({ ...prev, [k.id]: val }));
                        handleUpdateEstado(k.id, val);
                      }}
                    >
                      <SelectTrigger className="w-[110px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valido">
                          <Badge variant="default" className="text-[10px]">Válido</Badge>
                        </SelectItem>
                        <SelectItem value="caducado">
                          <Badge variant="secondary" className="text-[10px]">Caducado</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateOnly(k.fecha)}</TableCell>
                  <TableCell className="text-xs">{k.created_by_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(k.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(k.estado_updated_at)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(k.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
