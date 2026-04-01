import { Building2, Home, Shield, Users2 } from "lucide-react";
import type { Stats, SummaryCardData } from "./adminEstadisticasTypes";

interface AdminStatsSummaryCardsProps {
  stats: Stats | null;
}

/**
 * Renderiza las cards de resumen del dashboard admin.
 */
export function AdminStatsSummaryCards({ stats }: AdminStatsSummaryCardsProps) {
  const cards: SummaryCardData[] = [
    {
      title: "Publicaciones",
      subtitle: "Marketplace",
      totalLabel: "TOTAL",
      total: stats?.properties.total || 0,
      icon: Home,
      iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
      breakdown: stats?.properties.breakdown,
    },
    {
      title: "Agencias",
      subtitle: "Socios HF",
      totalLabel: "TOTAL",
      total: stats?.agencies.total || 0,
      icon: Building2,
      iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20",
      breakdown: stats?.agencies.breakdown,
    },
    {
      title: "Usuarios",
      subtitle: "Clientes",
      totalLabel: "REGISTRADOS",
      total: stats?.users.total || 0,
      icon: Users2,
      iconClassName: "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
      breakdown: stats?.users.breakdown,
    },
    {
      title: "Admin",
      subtitle: "Sistema",
      totalLabel: "ADMINS",
      total: stats?.admins || 0,
      icon: Shield,
      iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconClassName}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">{card.title}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  {card.subtitle}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-foreground">{card.total}</span>
                <span className="text-xs text-muted-foreground mb-1">{card.totalLabel}</span>
              </div>

              {card.breakdown && card.breakdown.length > 0 && (
                <div className="pt-3 border-t border-border/50 space-y-2">
                  {card.breakdown.map((item) => (
                    <div key={item.label} className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={item.color}>{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
