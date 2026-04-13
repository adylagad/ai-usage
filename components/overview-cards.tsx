import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolSummary } from "@/lib/types";
import { Activity, CalendarRange, Coins, DollarSign, Plug, TrendingUp } from "lucide-react";

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
  const configured = tools.filter((t) => t.configured).length;
  const connected = tools.filter((t) => t.configured && !t.error).length;
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
  const connectionRate = configured > 0 ? Math.round((connected / configured) * 100) : 0;

  const cards = [
    {
      title: "Total Tokens",
      value: fmt(totalTokens),
      sub: `${fmt(tools.reduce((s, t) => s + t.totalInputTokens, 0))} in / ${fmt(tools.reduce((s, t) => s + t.totalOutputTokens, 0))} out`,
      icon: Coins,
      tone: "from-[color:var(--brand-blue)]/20 via-white to-[color:var(--brand-blue)]/5",
    },
    {
      title: "Total Cost",
      value: `$${totalCost.toFixed(2)}`,
      sub: activeDays > 0 ? `$${(totalCost / activeDays).toFixed(2)} per active day` : "Across all configured tools",
      icon: DollarSign,
      tone: "from-[color:var(--brand-coral)]/20 via-white to-[color:var(--brand-coral)]/5",
    },
    {
      title: "Avg Daily Tokens",
      value: fmt(avgDailyTokens),
      sub: `Across ${activeDays} active days`,
      icon: Activity,
      tone: "from-[color:var(--brand-mint)]/22 via-white to-[color:var(--brand-mint)]/5",
    },
    {
      title: "Peak Day",
      value: peakDay ? peakDay[0] : "—",
      sub: peakDayLabel,
      icon: TrendingUp,
      tone: "from-[color:var(--brand-sun)]/25 via-white to-[color:var(--brand-sun)]/5",
    },
    {
      title: "Active Days",
      value: activeDays.toString(),
      sub: activeDays > 0 ? "Days with tracked usage" : "No historical activity yet",
      icon: CalendarRange,
      tone: "from-[color:var(--brand-blue)]/18 via-white to-[color:var(--brand-mint)]/8",
    },
    {
      title: "Connection Health",
      value: `${connectionRate}%`,
      sub: configured > 0 ? `${connected}/${configured} tools connected` : "No tools configured yet",
      icon: Plug,
      tone: "from-[color:var(--brand-coral)]/18 via-white to-[color:var(--brand-sun)]/8",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`border-white/65 bg-gradient-to-br ${card.tone} shadow-sm`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className="rounded-lg border border-white/80 bg-white/70 p-2">
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
