import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { DiskIoGauge } from "@/components/infra/DiskIoGauge";
import { DiskIoTrendChart } from "@/components/infra/DiskIoTrendChart";
import { RequestsCharts } from "@/components/infra/RequestsCharts";
import { ResourceCards } from "@/components/infra/ResourceCards";
import { ActiveSessionsList } from "@/components/infra/ActiveSessionsList";
import { DbSchemaTab } from "@/components/infra/DbSchemaTab";
import { AdminMaintenance } from "@/components/admin/system/AdminMaintenance";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Activity, LogOut, ArrowLeft, Database, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";

function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full bg-slate-800" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-slate-800" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 bg-slate-800" />)}
      </div>
    </div>
  );
}

export default function InfraMonitorPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refresh, isFetching, dataUpdatedAt } = useSystemMetrics();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH);
  };

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitoreo de Infraestructura</h1>
            <p className="text-sm text-slate-400">Métricas en tiempo real · Polling cada 60s</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-slate-500">
              Última actualización: {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isFetching}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refrescar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {isError && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
          Error al obtener métricas: {(error as Error)?.message || "Error desconocido"}
        </div>
      )}

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 mb-6">
          <TabsTrigger value="metrics" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 text-slate-400">
            <Activity className="w-4 h-4 mr-1.5" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 text-slate-400">
            <Users className="w-4 h-4 mr-1.5" />
            Sesiones
          </TabsTrigger>
          <TabsTrigger value="db-schema" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 text-slate-400">
            <Database className="w-4 h-4 mr-1.5" />
            Datos BD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          {isLoading ? (
            <MetricsSkeleton />
          ) : data ? (
            <div className="space-y-6">

              <DiskIoGauge
                value={data.diskIoBudget}
                source={data.diskIoSource}
                lastSampleAt={data.diskIoLastSampleAt}
              />

              {/* Info Card: Disk IO Budget Explanation */}
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-tight">
                  <Activity className="w-4 h-4" />
                  <h2 className="text-sm uppercase">AWS Burst Balance (Disk IO Budget)</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  El 100% representa el Burst Balance de AWS disponible. Cada operación de lectura/escritura consume créditos. Si llega a 0%, la base de datos entrará en modo throttling severo (I/O limitado), provocando timeouts y potencial colapso del servicio.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-[10px] text-emerald-500 font-bold uppercase">Sano</div>
                    <div className="text-xs text-emerald-400 font-medium">&gt; 50% OK</div>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                    <div className="text-[10px] text-amber-500 font-bold uppercase">Precaución</div>
                    <div className="text-xs text-amber-400 font-medium">20-50%</div>
                  </div>
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-center">
                    <div className="text-[10px] text-rose-500 font-bold uppercase">Peligro</div>
                    <div className="text-xs text-rose-400 font-medium">&lt; 20%</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <AdminMaintenance />
              </div>

              <DiskIoTrendChart history={data.diskIoHistory ?? []} />
              <RequestsCharts
                restRequests={data.restRequests}
                authRequests={data.authRequests}
                realtimeRequests={data.realtimeRequests}
                storageRequests={data.storageRequests}
                history={data.requestsHistory ?? data.diskIoHistory}
              />
              <ResourceCards
                cpuUsage={data.cpuUsage}
                ramUsedMb={data.ramUsedMb}
                ramTotalMb={data.ramTotalMb}
                dbConnections={data.dbConnections}
              />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="sessions">
          <ActiveSessionsList />
        </TabsContent>

        <TabsContent value="db-schema">
          <DbSchemaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
