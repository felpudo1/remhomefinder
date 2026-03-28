import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Info } from "lucide-react";

interface DiskIoGaugeProps {
  value: number | null;
  source?: "live" | "history" | "unavailable";
  lastSampleAt?: string | null;
}

export function DiskIoGauge({ value, source = "live", lastSampleAt = null }: DiskIoGaugeProps) {
  const hasValidValue = typeof value === "number" && Number.isFinite(value);
  const pct = hasValidValue ? Math.max(0, Math.min(100, value)) : null;
  const color =
    pct === null
      ? "text-slate-600"
      : pct > 50
        ? "text-emerald-400"
        : pct > 20
          ? "text-yellow-400"
          : "text-red-500";
  const isDanger = pct !== null && pct <= 20 && source !== "unavailable";
  const isLowIoMode = source === "live" && pct !== null && pct <= 5;
  const showValueArc = pct !== null && pct > 0;
  const valueLabel =
    pct === null
      ? "N/D"
      : pct > 0 && pct < 1
        ? `${pct.toFixed(1)}%`
        : `${Math.round(pct)}%`;
  const formattedLastSample = lastSampleAt
    ? new Date(lastSampleAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
    : null;

  // SVG semicircle gauge
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - ((pct ?? 0) / 100) * circumference;

  return (
    <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50 col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 flex items-center gap-2 text-lg">
          <HardDrive className="w-5 h-5" />
          Disk IO Budget
          {isDanger && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              ⚠️ PELIGRO: Ralentización inminente
            </Badge>
          )}
          {source === "history" && (
            <Badge variant="outline" className="ml-2 border-yellow-500/50 text-yellow-300">
              Dato histórico
            </Badge>
          )}
          {source === "unavailable" && (
            <Badge variant="outline" className="ml-2 border-slate-500/60 text-slate-300">
              Sin dato en vivo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 10 110 A 80 80 0 0 1 190 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-700"
          />
          {/* Value arc */}
          {showValueArc && (
            <path
              d="M 10 110 A 80 80 0 0 1 190 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={color}
            />
          )}
          <text x="100" y="95" textAnchor="middle" className="fill-slate-100 text-3xl font-bold" fontSize="32">
            {valueLabel}
          </text>
          <text x="100" y="115" textAnchor="middle" className="fill-slate-400" fontSize="12">
            Burst Balance
          </text>
        </svg>
        <div className="flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> &gt;50% OK</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> 20-50% Precaución</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt;20% Peligro</span>
        </div>

        {pct === null && (
          <div className="mt-2 w-full max-w-lg rounded-md border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
            <span>Métrica no disponible temporalmente; no hay lectura en vivo reciente de Supabase para mostrar un valor confiable.</span>
          </div>
        )}

        {source === "history" && formattedLastSample && (
          <div className="mt-2 w-full max-w-lg rounded-md border border-yellow-700/60 bg-yellow-900/30 px-3 py-2 text-xs text-yellow-300 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-yellow-400" />
            <span>Mostrando último dato histórico válido ({formattedLastSample}) porque la métrica en vivo llegó como nula.</span>
          </div>
        )}

        {/* Nota técnica */}
        <div className="mt-3 w-full max-w-lg rounded-md border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-xs text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
          <span>
            El <strong className="text-slate-300">100%</strong> representa el Burst Balance de AWS disponible.
            Cada operación de lectura/escritura consume créditos. Si llega a <strong className="text-red-400">0%</strong>,
            la base de datos entrará en modo throttling severo (I/O limitado), provocando timeouts y potencial colapso del servicio.
          </span>
        </div>

        {isLowIoMode && (
          <div className="mt-2 w-full max-w-lg rounded-md border border-yellow-700/60 bg-yellow-900/30 px-3 py-2 text-xs text-yellow-300 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-yellow-400" />
            <span>
              <strong>Modo bajo I/O activo:</strong> El polling se redujo a cada 5 min y se pausó el guardado de historial
              para permitir la recuperación del balance. La tasa de recuperación de AWS depende del tamaño del volumen
              (~3 IOPS/GB baseline). En instancias pequeñas, puede tardar <strong>varias horas</strong> en volver a subir
              si hay procesos internos de Postgres (vacuuming, WAL, heartbeats del pool).
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
