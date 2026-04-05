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
  ImageIcon, ExternalLink, RotateCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useImportModalOpen, useImportActions, useActiveImportTask,
} from "@/store/useImportStore";

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

      const res = await supabase.functions.invoke("discover-agency-links", {
        body: { domain_url: domainUrl.trim(), org_id: orgId },
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

      const discoveredLinks: DiscoveredLink[] = (dbLinks || []).map((l: any) => ({
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
        body: { task_id: task.taskId, org_id: orgId, user_id: userId },
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
            Importación Mágica de Propiedades
          </DialogTitle>
          <DialogDescription>
            Escaneá el sitio web de tu agencia para importar propiedades automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1: Ingresar dominio */}
        {!task || task.status === "discovering" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.tuagencia.com"
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
                disabled={discovering}
                onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
              />
              <Button onClick={handleDiscover} disabled={discovering}>
                {discovering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {discovering ? "Escaneando..." : "Escanear"}
              </Button>
            </div>
            {discovering && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Descubriendo propiedades en el sitio...
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

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => reset()}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
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
