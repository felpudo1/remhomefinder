import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Info } from "lucide-react";

interface DiskIoGaugeProps {
  value: number | null;
}

export function DiskIoGauge({ value }: DiskIoGaugeProps) {
  const pct = value ?? 0;
  const color = pct > 50 ? "text-emerald-400" : pct > 20 ? "text-yellow-400" : "text-red-500";
  const isDanger = pct <= 20;

  // SVG semicircle gauge
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

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
          <text x="100" y="95" textAnchor="middle" className="fill-slate-100 text-3xl font-bold" fontSize="32">
            {value !== null ? `${Math.round(pct)}%` : "N/A"}
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
        {/* Nota técnica */}
        <div className="mt-3 w-full max-w-lg rounded-md border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-xs text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
          <span>
            El <strong className="text-slate-300">100%</strong> representa el Burst Balance de AWS disponible.
            Cada operación de lectura/escritura consume créditos. Si llega a <strong className="text-red-400">0%</strong>,
            la base de datos entrará en modo throttling severo (I/O limitado), provocando timeouts y potencial colapso del servicio.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
