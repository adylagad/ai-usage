import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolSummary } from "@/lib/types";
import { Coins, DollarSign, Plug, Wrench } from "lucide-react";

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
      sub: "Across all configured tools",
      icon: DollarSign,
    },
    {
      title: "Tools Configured",
      value: `${configured} / ${tools.length}`,
      sub: "Add API keys to connect more",
      icon: Wrench,
    },
    {
      title: "Connected",
      value: `${connected} / ${configured}`,
      sub: connected === configured ? "All tools healthy" : "Some tools have errors",
      icon: Plug,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
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
