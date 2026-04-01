import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentSummaryCardData } from "./agentEstadisticasTypes";

interface AgentStatsSummaryCardsProps {
  cards: AgentSummaryCardData[];
}

/**
 * Renderiza las tarjetas resumen del dashboard del agente.
 */
export function AgentStatsSummaryCards({
  cards,
}: AgentStatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.iconClassName}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
