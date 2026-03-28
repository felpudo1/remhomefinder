import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { DiskIoGauge } from "@/components/infra/DiskIoGauge";
import { DiskIoTrendChart } from "@/components/infra/DiskIoTrendChart";
import { RequestsCharts } from "@/components/infra/RequestsCharts";
import { ResourceCards } from "@/components/infra/ResourceCards";
import { ActiveSessionsList } from "@/components/infra/ActiveSessionsList";
import { AdminMaintenance } from "@/components/admin/system/AdminMaintenance";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, LogOut, ArrowLeft } from "lucide-react";
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

      {isLoading ? (
        <MetricsSkeleton />
      ) : data ? (
        <div className="space-y-6">
          <div className="mb-4">
            <AdminMaintenance />
          </div>
          <DiskIoGauge
            value={data.diskIoBudget}
            source={data.diskIoSource}
            lastSampleAt={data.diskIoLastSampleAt}
          />
          <DiskIoTrendChart history={data.diskIoHistory ?? []} />
          <RequestsCharts
            restRequests={data.restRequests}
            authRequests={data.authRequests}
            realtimeRequests={data.realtimeRequests}
            storageRequests={data.storageRequests}
          />
          <ResourceCards
            cpuUsage={data.cpuUsage}
            ramUsedMb={data.ramUsedMb}
            ramTotalMb={data.ramTotalMb}
            dbConnections={data.dbConnections}
          />
          <ActiveSessionsList />
        </div>
      ) : null}
    </div>
  );
}
