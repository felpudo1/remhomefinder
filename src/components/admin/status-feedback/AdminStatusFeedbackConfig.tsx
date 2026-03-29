import { useState } from "react";
import { useAllStatusFeedbackConfigs, useStatusFeedbackConfigMutation } from "@/hooks/useStatusFeedbackConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { FeedbackFieldType } from "@/lib/status-feedback-config";

const STATUS_OPTIONS = [
  { value: "contactado", label: "📞 Contactado" },
  { value: "visita_coordinada", label: "🗓️ Visita Coordinada" },
  { value: "firme_candidato", label: "🔥 Firme Candidato" },
  { value: "posible_interes", label: "💡 Posible Interés" },
  { value: "meta_conseguida", label: "🏆 Meta Conseguida" },
  { value: "descartado", label: "🗑️ Descartado" },
];

interface FieldFormData {
  field_id: string;
  field_label: string;
  field_type: FeedbackFieldType;
  is_required: boolean;
  placeholder: string;
  sort_order: number;
}

export function AdminStatusFeedbackConfig() {
  const { data: configsByStatus, isLoading } = useAllStatusFeedbackConfigs();
  const { createField, updateField, deleteField } = useStatusFeedbackConfigMutation();
  
  const [selectedStatus, setSelectedStatus] = useState<string>("contactado");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FieldFormData>({
    field_id: "",
    field_label: "",
    field_type: "rating",
    is_required: false,
    placeholder: "",
    sort_order: 0,
  });

  const currentFields = configsByStatus?.[selectedStatus] || [];

  const handleCreate = async () => {
    try {
      await createField({
        status: selectedStatus,
        ...formData,
      });
      toast.success("Campo creado correctamente");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`Error al crear: ${error.message}`);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<typeof formData>) => {
    try {
      await updateField(id, updates);
      toast.success("Campo actualizado");
      setEditingFieldId(null);
    } catch (error: any) {
      toast.error(`Error al actualizar: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este campo? Se marcará como inactivo.")) return;
    
    try {
      await deleteField(id);
      toast.success("Campo eliminado");
    } catch (error: any) {
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };

  const handleMove = async (field: typeof currentFields[0], direction: "up" | "down") => {
    const currentIndex = currentFields.findIndex(f => f.field_id === field.field_id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === currentFields.length - 1)
    ) {
      return;
    }

    const newOrder = direction === "up" ? field.sort_order - 1 : field.sort_order + 1;
    await handleUpdate(field.id, { sort_order: newOrder });
  };

  const resetForm = () => {
    setFormData({
      field_id: "",
      field_label: "",
      field_type: "rating",
      is_required: false,
      placeholder: "",
      sort_order: currentFields.length,
    });
  };

  const startEdit = (field: typeof currentFields[0]) => {
    setEditingFieldId(field.id);
    setFormData({
      field_id: field.field_id,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      placeholder: field.placeholder || "",
      sort_order: field.sort_order,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración de Feedback</h2>
          <p className="text-muted-foreground">
            Administra los campos que se muestran en los modales de cambio de estado
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Campo de Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="field_id">ID del Campo</Label>
                <Input
                  id="field_id"
                  placeholder="ej: contacted_interest"
                  value={formData.field_id}
                  onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usá snake_case. Ej: contacted_interest, coordinated_date
                </p>
              </div>
              
              <div>
                <Label htmlFor="field_label">Label</Label>
                <Input
                  id="field_label"
                  placeholder="ej: Interés inicial"
                  value={formData.field_label}
                  onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="field_type">Tipo</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(val: FeedbackFieldType) => setFormData({ ...formData, field_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Estrellas (Rating)</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="date">Fecha/Hora</SelectItem>
                    <SelectItem value="boolean">Booleano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
                <Label htmlFor="is_required">Campo obligatorio</Label>
              </div>
              
              {formData.field_type === "text" && (
                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    placeholder="ej: Completar nombre..."
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCreate}>
                  Crear Campo
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selector de Estado */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status.value}
            variant={selectedStatus === status.value ? "default" : "outline"}
            onClick={() => {
              setSelectedStatus(status.value);
              setEditingFieldId(null);
            }}
          >
            {status.label}
          </Button>
        ))}
      </div>

      {/* Lista de Campos */}
      <Card>
        <CardHeader>
          <CardTitle>Campos para: {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}</CardTitle>
          <CardDescription>
            {currentFields.length} campos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFields.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No hay campos configurados para este estado
            </p>
          ) : (
            <div className="space-y-3">
              {currentFields.map((field, index) => (
                <div
                  key={field.field_id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMove(field, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMove(field, "down")}
                      disabled={index === currentFields.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Field info */}
                  <div className="flex-1 min-w-0">
                    {editingFieldId === field.id ? (
                      <div className="space-y-2">
                        <Input
                          value={formData.field_label}
                          onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(field.id, { field_label: formData.field_label })}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFieldId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{field.field_label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {field.field_type}
                          </Badge>
                          {field.is_required && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {field.field_id}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {editingFieldId !== field.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(field)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>
            Así se verá el modal cuando los usuarios cambien a este estado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentFields.map((field) => (
            <div key={field.field_id} className="p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{field.field_label}</span>
                {field.is_required && <span className="text-xs text-destructive">*</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                Tipo: <code>{field.field_type}</code>
                {field.placeholder && <span className="ml-2">Placeholder: "{field.placeholder}"</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
