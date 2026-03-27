import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, MemoryStick, Plug } from "lucide-react";

interface ResourceCardsProps {
  cpuUsage: number | null;
  ramUsedMb: number | null;
  ramTotalMb: number | null;
  dbConnections: number | null;
}

export function ResourceCards({ cpuUsage, ramUsedMb, ramTotalMb, dbConnections }: ResourceCardsProps) {
  const ramPct = ramUsedMb !== null && ramTotalMb !== null && ramTotalMb > 0
    ? Math.round((ramUsedMb / ramTotalMb) * 100)
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CPU */}
      <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-300 flex items-center gap-2 text-sm">
            <Cpu className="w-4 h-4" /> CPU
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-sky-400">
            {cpuUsage !== null ? `${cpuUsage}%` : "N/A"}
          </p>
          {cpuUsage !== null && (
            <Progress value={cpuUsage} className="mt-2 h-2 bg-slate-700 [&>div]:bg-sky-500" />
          )}
        </CardContent>
      </Card>

      {/* RAM */}
      <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-300 flex items-center gap-2 text-sm">
            <MemoryStick className="w-4 h-4" /> RAM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-amber-400">
            {ramUsedMb !== null ? `${ramUsedMb} MB` : "N/A"}
            {ramTotalMb !== null && <span className="text-sm text-slate-500"> / {ramTotalMb} MB</span>}
          </p>
          {ramPct !== null && (
            <Progress value={ramPct} className="mt-2 h-2 bg-slate-700 [&>div]:bg-amber-500" />
          )}
        </CardContent>
      </Card>

      {/* DB Connections */}
      <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-300 flex items-center gap-2 text-sm">
            <Plug className="w-4 h-4" /> Conexiones DB
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-teal-400">
            {dbConnections !== null ? dbConnections : "N/A"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Activas</p>
        </CardContent>
      </Card>
    </div>
  );
}
