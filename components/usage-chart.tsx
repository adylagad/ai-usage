"use client";

import type { CSSProperties } from "react";
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ToolSummary, ToolId } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const TOOL_COLORS: Record<ToolId, string> = {
  claude: "#d97706",
  openai: "#10b981",
  copilot: "#3b82f6",
  cursor: "#8b5cf6",
};

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const tooltipContentStyle: CSSProperties = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--foreground)",
  boxShadow: "none",
  fontFamily: "var(--font-sans)",
};

const tooltipLabelStyle: CSSProperties = {
  color: "var(--foreground)",
  fontWeight: 600,
};

const tooltipItemStyle: CSSProperties = {
  color: "var(--foreground)",
};

export function UsageChart({ tools }: { tools: ToolSummary[] }) {
  const dateSet = new Set<string>();
  for (const tool of tools) {
    for (const d of tool.daily) dateSet.add(d.date);
  }

  const dates = Array.from(dateSet).sort();
  if (dates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>No usage data available yet</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Configure API keys to see usage charts
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartDataPoint[] = dates.map((date) => {
    const point: ChartDataPoint = { date };
    let totalTokens = 0;
    let totalCost = 0;

    for (const tool of tools) {
      if (!tool.configured) continue;
      const bucket = tool.daily.find((d) => d.date === date);
      const tokens = (bucket?.inputTokens ?? 0) + (bucket?.outputTokens ?? 0);
      if (tokens > 0) point[tool.tool] = tokens;
      totalTokens += tokens;
      totalCost += bucket?.costUsd ?? 0;
    }
    point.totalTokens = totalTokens;
    point.totalCost = totalCost;
    return point;
  });

  const activeTools = tools.filter((t) => t.configured && t.daily.length > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Token Velocity</CardTitle>
          <CardDescription>Daily token usage per tool and combined demand</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={52} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }}
                formatter={(value, name) => {
                  const numeric = Number(Array.isArray(value) ? value[0] : (value ?? 0));
                  if (name !== "totalTokens" && numeric <= 0) return null;
                  return [fmt(numeric), name === "totalTokens" ? "Total Tokens" : String(name)];
                }}
                labelFormatter={(label) => `Date: ${String(label)}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalTokens"
                name="Total Tokens"
                stroke="var(--brand-blue)"
                strokeWidth={2}
                fill="color-mix(in oklab, var(--brand-blue) 28%, transparent)"
              />
              {activeTools.map((tool) => (
                <Line
                  key={tool.tool}
                  type="monotone"
                  dataKey={tool.tool}
                  name={tool.label}
                  stroke={TOOL_COLORS[tool.tool]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Daily Cost Pulse</CardTitle>
          <CardDescription>Estimated spend trend for the selected window</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={48} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }}
                formatter={(value) => [
                  `$${Number(Array.isArray(value) ? value[0] : (value ?? 0)).toFixed(2)}`,
                  "Daily cost",
                ]}
                labelFormatter={(label) => `Date: ${String(label)}`}
              />
              <Bar dataKey="totalCost" fill="color-mix(in oklab, var(--brand-coral) 70%, white)" radius={[6, 6, 0, 0]} />
              <Area
                type="monotone"
                dataKey="totalCost"
                stroke="var(--brand-coral)"
                strokeWidth={2}
                fill="color-mix(in oklab, var(--brand-coral) 28%, transparent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
