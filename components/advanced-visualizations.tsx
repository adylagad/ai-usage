"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolId, ToolSummary } from "@/lib/types";

const TOOL_COLORS: Record<ToolId, string> = {
  claude: "#f59e0b",
  openai: "#10b981",
  copilot: "#3b82f6",
  cursor: "#ec4899",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function intensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/40";
  const ratio = value / max;
  if (ratio >= 0.8) return "bg-[color:var(--brand-blue)]";
  if (ratio >= 0.55) return "bg-[color:var(--brand-blue)]/75";
  if (ratio >= 0.3) return "bg-[color:var(--brand-blue)]/50";
  return "bg-[color:var(--brand-blue)]/30";
}

export function AdvancedVisualizations({ tools }: { tools: ToolSummary[] }) {
  const configuredTools = tools.filter((tool) => tool.configured);

  const toolShareData = configuredTools
    .map((tool) => ({
      name: tool.label,
      value: tool.totalInputTokens + tool.totalOutputTokens,
      color: TOOL_COLORS[tool.tool],
    }))
    .filter((entry) => entry.value > 0);

  const costByToolData = configuredTools
    .map((tool) => ({
      name: tool.label,
      cost: Number(tool.totalCostUsd.toFixed(2)),
      color: TOOL_COLORS[tool.tool],
    }))
    .sort((a, b) => b.cost - a.cost);

  const dayTotals = new Map<string, number>();
  for (const tool of configuredTools) {
    for (const day of tool.daily) {
      dayTotals.set(day.date, (dayTotals.get(day.date) ?? 0) + day.inputTokens + day.outputTokens);
    }
  }

  const activityDays = Array.from(dayTotals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([date, tokens]) => ({ date, tokens }));

  const maxDayTokens = Math.max(...activityDays.map((d) => d.tokens), 0);

  if (toolShareData.length === 0 && costByToolData.length === 0 && activityDays.length === 0) {
    return (
      <Card className="border-white/65 bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle>More Visualizations</CardTitle>
          <CardDescription>No tool data yet. Connect at least one provider to unlock chart insights.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-white/65 bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle>Token Share</CardTitle>
          <CardDescription>How token usage is distributed by tool</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={toolShareData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={86}
                innerRadius={44}
                paddingAngle={2}
              >
                {toolShareData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  fmt(Number(Array.isArray(value) ? value[0] : (value ?? 0))),
                  "Tokens",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {toolShareData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </div>
                <span className="font-mono">{fmt(entry.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/65 bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle>Cost By Tool</CardTitle>
          <CardDescription>Estimated spend concentration across providers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costByToolData} layout="vertical" margin={{ left: 6, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickFormatter={(v) => `$${Number(v).toFixed(1)}`} />
              <YAxis dataKey="name" type="category" width={58} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [
                  `$${Number(Array.isArray(value) ? value[0] : (value ?? 0)).toFixed(2)}`,
                  "Cost",
                ]}
              />
              <Bar dataKey="cost" radius={[0, 6, 6, 0]}>
                {costByToolData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-3 text-xs text-muted-foreground">
            Highest estimated cost: <span className="font-medium text-foreground">{costByToolData[0]?.name ?? "—"}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/65 bg-white/85 shadow-sm">
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
          <CardDescription>30-day intensity of combined token activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-1.5">
            {activityDays.map((day) => (
              <div
                key={day.date}
                className={`aspect-square rounded-md ${intensityClass(day.tokens, maxDayTokens)}`}
                title={`${day.date}: ${fmt(day.tokens)} tokens`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{activityDays[0]?.date ?? "—"}</span>
            <span>High activity</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
