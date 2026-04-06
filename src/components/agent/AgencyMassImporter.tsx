import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import {
  Globe, Loader2, Search, Download, Minimize2, CheckCircle2, XCircle,
  ImageIcon, ExternalLink, RotateCw, Settings2,
  Filter, Zap, Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useImportModalOpen, useImportActions, useActiveImportTask,
} from "@/store/useImportStore";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";

interface DiscoveredLink {
  id: string;
  url: string;
  title: string;
  thumbnail_url: string;
  is_selected: boolean;
  status: string;
  is_duplicate?: boolean;
}

interface Props {
  orgId: string;
  userId: string;
}

export const AgencyMassImporter: React.FC<Props> = ({ orgId, userId }) => {
  const isOpen = useImportModalOpen();
  const task = useActiveImportTask();
  const { closeModal, minimize, setTask, reset } = useImportActions();

  const [domainUrl, setDomainUrl] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [links, setLinks] = useState<DiscoveredLink[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // FILTROS AVANZADOS (Discovery Pro)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    excludeExtensions: ".pdf, .jpg, .png, .jpeg, .docx",
    minUrlLength: 30,
    blockBrokenEnds: true
  });

  const resetFilters = () => {
    setFilters({
      excludeExtensions: ".pdf, .jpg, .png, .jpeg, .docx",
      minUrlLength: 30,
      blockBrokenEnds: true
    });
    toast.info("Valores por defecto aplicados ⚡");
  };

  const handleSaveAsProfile = async () => {
    if (!domainUrl.trim()) return;
    
    const pureDomain = domainUrl.toLowerCase().trim().replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    
    const payload = {
      domain: pureDomain,
      discovery_config: {
        minUrlLength: filters.minUrlLength,
        excludeExtensions: filters.excludeExtensions.split(",").map(e => e.trim()).filter(Boolean),
        blockBrokenEnds: filters.blockBrokenEnds,
      }
    };

    const { error } = await supabase
      .from("scraping_domain_profiles" as any)
      .upsert(payload as any, { onConflict: 'domain' });

    if (error) {
      toast.error("Error al guardar perfil: " + error.message);
    } else {
      toast.success(`Perfil de ${pureDomain} actualizado 💎`);
    }
  };

  // Lógica de agentes (Carga Delegada para Admins)
  const { data: roles = [] } = useUserRoles(userId);
  const isAdmin = roles.includes("admin") || roles.includes("sysadmin");
  const [onBehalfOfUserId, setOnBehalfOfUserId] = useState<string>(userId); 
  const [orgMembers, setOrgMembers] = useState<{ user_id: string; display_name: string; email: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Cargar miembros si es admin
  useEffect(() => {
    if (isAdmin && orgId) {
      const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
          const { data, error } = await supabase
            .from("organization_members")
            .select(`
              user_id,
              profiles:user_id (
                display_name,
                email
              )
            `)
            .eq("org_id", orgId);

          if (error) throw error;

          const members = (data || []).map((m: any) => ({
            user_id: m.user_id,
            display_name: m.profiles?.display_name || m.profiles?.email || "Sin nombre",
            email: m.profiles?.email || ""
          }));
          setOrgMembers(members);
        } catch (err) {
          console.error("Error fetching members:", err);
        } finally {
          setLoadingMembers(false);
        }
      };
      fetchMembers();
    }
  }, [isAdmin, orgId]);

  const isImporting = task?.status === "importing";
  const isCompleted = task?.status === "completed";

  // Descubrir links del dominio
  const handleDiscover = async () => {
    if (!domainUrl.trim()) {
      toast.error("Ingresá la URL del sitio web");
      return;
    }

    setDiscovering(true);
    setLinks([]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Limpiar y empaquetar filtros
      const apiFilters = {
        ...filters,
        excludeExtensions: filters.excludeExtensions.split(",").map(e => e.trim()).filter(Boolean)
      };

      const res = await supabase.functions.invoke("discover-agency-links", {
        body: { domain_url: domainUrl.trim(), org_id: orgId, filters: apiFilters },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.error) {
        toast.error("Error al descubrir links: " + (res.error.message || "Error desconocido"));
        return;
      }

      const data = res.data as any;
      const taskId = data.task_id;

      // Cargar links desde BD
      const { data: dbLinks } = await supabase
        .from("discovered_links" as any)
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      // OBTENER FILTROS DE EXCLUSIÓN (Para doble chequeo en frontend)
      const { data: appSettings } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "scraper_exclude_urls")
        .single();
      
      const excludePatterns = (appSettings?.value || "").split(",").map((p: string) => p.trim().toLowerCase()).filter(Boolean);

      const discoveredLinks: DiscoveredLink[] = (dbLinks || [])
        .filter((l: any) => {
          const lowUrl = l.url.toLowerCase();
          
          // Aplicar filtros locales de nuevo por seguridad
          if (lowUrl.length < filters.minUrlLength) return false;
          if (filters.blockBrokenEnds && (lowUrl.endsWith('-') || lowUrl.endsWith('_'))) return false;
          
          return !excludePatterns.some(pattern => lowUrl.includes(pattern));
        })
        .map((l: any) => ({
          id: l.id,
          url: l.url,
          title: l.title || "",
          thumbnail_url: l.thumbnail_url || "",
          is_selected: false,
          status: l.status,
        }));

      // Marcar duplicados del response original
      const dupeUrls = new Set(
        (data.links || [])
          .filter((l: any) => l.is_duplicate)
          .map((l: any) => l.url.toLowerCase().replace(/\/$/, ""))
      );

      const enrichedLinks = discoveredLinks.map((l) => ({
        ...l,
        is_duplicate: dupeUrls.has(l.url.toLowerCase().replace(/\/$/, "")),
      }));

      setLinks(enrichedLinks);
      setTask({
        taskId,
        orgId,
        domainUrl: domainUrl.trim(),
        totalLinks: enrichedLinks.length,
        completedLinks: 0,
        failedLinks: 0,
        status: "selecting",
      });

      if (data.duplicates > 0) {
        toast.info(`${data.duplicates} propiedades ya existen en tu cartera`);
      }
    } catch (err) {
      console.error("Error discovery:", err);
      toast.error("Error al conectar con el servicio de descubrimiento");
    } finally {
      setDiscovering(false);
    }
  };

  // Toggle selección individual
  const toggleLink = (linkId: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId && !l.is_duplicate ? { ...l, is_selected: !l.is_selected } : l
      )
    );
  };

  // Toggle seleccionar todos
  useEffect(() => {
    setLinks((prev) =>
      prev.map((l) => (l.is_duplicate ? l : { ...l, is_selected: selectAll }))
    );
  }, [selectAll]);

  const selectedCount = useMemo(() => links.filter((l) => l.is_selected).length, [links]);

  // Iniciar importación
  const handleImport = async () => {
    if (!task?.taskId || selectedCount === 0) return;

    try {
      // Actualizar is_selected en BD
      const selectedIds = links.filter((l) => l.is_selected).map((l) => l.id);

      // Marcar los seleccionados como queued
      await supabase
        .from("discovered_links" as any)
        .update({ is_selected: true, status: "queued" } as any)
        .in("id", selectedIds);

      // Actualizar la tarea en la BD con el nuevo total real (solo seleccionados)
      await supabase
        .from("agency_discovery_tasks" as any)
        .update({ 
          total_links: selectedCount,
          status: "processing",
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", task.taskId);

      // Actualizar store local
      setTask({
        ...task,
        totalLinks: selectedCount,
        status: "importing",
      });

      // Disparar primera llamada al procesador de lotes
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      supabase.functions.invoke("process-import-batch", {
        body: { task_id: task.taskId, org_id: orgId, user_id: onBehalfOfUserId },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      toast.success(`Importación iniciada: ${selectedCount} propiedades en cola`);
    } catch (err) {
      console.error("Error iniciando importación:", err);
      toast.error("Error al iniciar la importación");
    }
  };

  const handleTerminateProcess = async () => {
    if (!task?.taskId) return;

    setTerminating(true);

    try {
      const manualStopMessage = "Proceso finalizado manualmente";

      const { error: linksError } = await supabase
        .from("discovered_links" as any)
        .update({ status: "failed", error_message: manualStopMessage } as any)
        .eq("task_id", task.taskId)
        .in("status", ["queued", "processing"]);

      if (linksError) throw linksError;

      const { data: refreshedLinks, error: refreshedLinksError } = await supabase
        .from("discovered_links" as any)
        .select("status")
        .eq("task_id", task.taskId);

      if (refreshedLinksError) throw refreshedLinksError;

      const completed = (refreshedLinks || []).filter((link: any) => link.status === "completed").length;
      const failed = (refreshedLinks || []).filter((link: any) => link.status === "failed").length;

      const { error: taskError } = await supabase
        .from("agency_discovery_tasks" as any)
        .update({
          status: "completed",
          completed_links: completed,
          failed_links: failed,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", task.taskId);

      if (taskError) throw taskError;

      setTask({
        ...task,
        totalLinks: Math.max(task.totalLinks, refreshedLinks?.length || 0),
        completedLinks: completed,
        failedLinks: failed,
        status: "completed",
      });

      toast.success("Proceso finalizado manualmente");
    } catch (err) {
      console.error("Error finalizando importación:", err);
      toast.error("No se pudo finalizar el proceso");
    } finally {
      setTerminating(false);
    }
  };

  // Progreso
  const progressPercent = task
    ? Math.round(((task.completedLinks + task.failedLinks) / Math.max(task.totalLinks, 1)) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Importación Masiva de Propiedades via AI
          </DialogTitle>
          <DialogDescription>
            Escaneá el sitio web de tu agencia para importar propiedades automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1: Ingresar dominio */}
        {!task || task.status === "discovering" ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://www.acsa.com.uy"
                    className="pl-9 h-11 rounded-xl"
                    value={domainUrl}
                    onChange={(e) => setDomainUrl(e.target.value)}
                    disabled={discovering}
                    onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                  />
                </div>
                <Button onClick={handleDiscover} disabled={discovering} className="h-11 rounded-xl px-6 gap-2">
                  {discovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {discovering ? "Escaneando..." : "Descubrir Propiedades"}
                </Button>
              </div>

              {/* Botones de Presets (Chips) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 tracking-wider shrink-0">Presets Pro:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFilters}
                  className="rounded-full h-7 text-xs gap-1.5 shrink-0 hover:bg-primary/5 hover:text-primary transition-all border-dashed"
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  Restaurar Valores
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="rounded-full h-7 text-xs gap-1.5 ml-auto text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="w-3 h-3" />
                  {showAdvanced ? "Ocultar Avanzado" : "Ajustes Avanzados"}
                </Button>
              </div>
            </div>

            {/* Panel de Filtros Avanzados */}
            {showAdvanced && (
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Configuración Técnica de Escaneo</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono opacity-60">Filtros Activos</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-len" className="text-xs font-medium text-muted-foreground">Largo Mínimo URL</Label>
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 rounded">{filters.minUrlLength} ch</span>
                    </div>
                    <Input 
                      id="min-len"
                      type="number" 
                      value={filters.minUrlLength}
                      onChange={(e) => setFilters(prev => ({ ...prev, minUrlLength: parseInt(e.target.value) || 0 }))}
                      className="h-10 rounded-lg text-sm"
                      placeholder="Ej: 30"
                    />
                    <p className="text-[10px] text-muted-foreground leading-tight italic">
                      Las propiedades reales suelen tener URLs largas ({">"}30). ACSA usa ({">"}45).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-muted-foreground">Ignorar Extensiones</Label>
                    <Input 
                      value={filters.excludeExtensions}
                      onChange={(e) => setFilters(prev => ({ ...prev, excludeExtensions: e.target.value }))}
                      className="h-10 rounded-lg text-sm font-mono"
                      placeholder=".pdf, .jpg, .png"
                    />
                    <p className="text-[10px] text-muted-foreground leading-tight italic">
                      Separadas por coma. Evita procesar archivos estáticos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Bloquear URLs rotas</Label>
                    <p className="text-[10px] text-muted-foreground">Descarta links que terminan en guión o guión bajo.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {isAdmin && domainUrl && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={handleSaveAsProfile}
                        className="text-[10px] text-primary h-auto p-0 hover:no-underline font-bold"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Guardar para {domainUrl.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0]}
                      </Button>
                    )}
                    <Switch 
                      checked={filters.blockBrokenEnds}
                      onCheckedChange={(v) => setFilters(prev => ({ ...prev, blockBrokenEnds: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {discovering && (
              <div className="text-center py-10 space-y-4">
                <div className="relative inline-flex">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="absolute inset-0 m-auto h-4 w-4 bg-primary/20 rounded-full animate-ping" />
                </div>
                <p className="text-sm font-medium animate-pulse">
                  Escaneando arquitectura de {domainUrl.replace(/^https?:\/\//, '').split('/')[0]}...
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Paso 2: Seleccionar links */}
        {task?.status === "selecting" && links.length > 0 && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={(v) => setSelectAll(v === true)}
                />
                <span className="text-sm text-muted-foreground">
                  Seleccionar todas ({links.filter((l) => !l.is_duplicate).length})
                </span>
              </div>
              <Badge variant="secondary">{selectedCount} seleccionadas</Badge>
            </div>

            <div className="flex-1 max-h-[50vh] overflow-y-auto border rounded-lg">
              <div className="divide-y divide-border">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center gap-3 p-3 transition-colors ${
                      link.is_duplicate
                        ? "opacity-50 bg-muted/30"
                        : link.is_selected
                        ? "bg-primary/5"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <Checkbox
                      checked={link.is_selected}
                      disabled={link.is_duplicate}
                      onCheckedChange={() => toggleLink(link.id)}
                    />

                    {link.thumbnail_url ? (
                      <img
                        src={link.thumbnail_url}
                        alt=""
                        className="w-12 h-12 rounded object-cover shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {link.title || link.url}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.url}
                      </p>
                    </div>

                    {link.is_duplicate && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Ya existe
                      </Badge>
                    )}

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Carga Delegada (Modo Admin)
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Asignar este lote de propiedades al agente:</Label>
                  <Select value={onBehalfOfUserId} onValueChange={setOnBehalfOfUserId}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Seleccionar agente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orgMembers.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{member.display_name}</span>
                            <span className="text-[10px] opacity-70">{member.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => reset()}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || loadingMembers}>
                <Download className="h-4 w-4 mr-2" />
                Importar {selectedCount} seleccionadas
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Progreso de importación */}
        {(task?.status === "importing" || task?.status === "completed") && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">
                  {task.completedLinks + task.failedLinks} / {task.totalLinks}
                </span>
              </div>
              <Progress value={progressPercent} />
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {task.completedLinks} exitosas
              </div>
              {task.failedLinks > 0 && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-4 w-4" />
                  {task.failedLinks} fallidas
                </div>
              )}
            </div>

            {isImporting && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <RotateCw className="h-3 w-3 animate-spin" />
                Procesando en segundo plano. Podés navegar a otras pestañas.
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              {isImporting && (
                <>
                  <Button variant="outline" onClick={minimize} disabled={terminating}>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimizar al fondo
                  </Button>
                  <Button variant="destructive" onClick={handleTerminateProcess} disabled={terminating}>
                    {terminating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Terminar proceso
                  </Button>
                </>
              )}
              {isCompleted && (
                <Button onClick={reset}>Cerrar</Button>
              )}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {task?.status === "selecting" && links.length === 0 && !discovering && (
          <div className="text-center py-8 space-y-3">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No se encontraron propiedades en este dominio.
            </p>
            <Button variant="outline" onClick={() => setTask(null)}>
              Intentar con otro dominio
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
