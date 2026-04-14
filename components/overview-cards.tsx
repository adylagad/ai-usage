import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolSummary } from "@/lib/types";
import { Activity, Coins, DollarSign, TrendingUp } from "lucide-react";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function OverviewCards({ tools }: { tools: ToolSummary[] }) {
  const totalTokens = tools.reduce(
    (s, t) => s + t.totalInputTokens + t.totalOutputTokens,
    0
  );
  const totalCost = tools.reduce((s, t) => s + t.totalCostUsd, 0);
  const dailyTotals = new Map<string, number>();

  for (const tool of tools) {
    for (const day of tool.daily) {
      const tokens = day.inputTokens + day.outputTokens;
      dailyTotals.set(day.date, (dailyTotals.get(day.date) ?? 0) + tokens);
    }
  }

  const activeDays = dailyTotals.size;
  const avgDailyTokens = activeDays > 0 ? Math.round(totalTokens / activeDays) : 0;
  const peakDay = Array.from(dailyTotals.entries()).sort((a, b) => b[1] - a[1])[0];
  const peakDayLabel = peakDay ? `${peakDay[0]} · ${fmt(peakDay[1])}` : "No usage yet";

  const cards = [
    {
      title: "Total Tokens",
      value: fmt(totalTokens),
      sub: `${fmt(tools.reduce((s, t) => s + t.totalInputTokens, 0))} in / ${fmt(tools.reduce((s, t) => s + t.totalOutputTokens, 0))} out`,
      icon: Coins,
    },
    {
      title: "Total Cost",
      value: `$${totalCost.toFixed(2)}`,
      sub: activeDays > 0 ? `$${(totalCost / activeDays).toFixed(2)} per active day` : "Across all configured tools",
      icon: DollarSign,
    },
    {
      title: "Avg Daily Tokens",
      value: fmt(avgDailyTokens),
      sub: `Across ${activeDays} active days`,
      icon: Activity,
    },
    {
      title: "Peak Day",
      value: peakDay ? peakDay[0] : "—",
      sub: peakDayLabel,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border-border bg-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className="rounded-lg border border-border bg-muted/50 p-2">
              <card.icon className="h-4 w-4 text-[color:var(--brand-blue)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
