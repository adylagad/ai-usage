"use client";

import type { CSSProperties } from "react";
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

const TOOL_SHORT_LABELS: Record<ToolId, string> = {
  claude: "Claude",
  openai: "OpenAI",
  copilot: "Copilot",
  cursor: "Cursor",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
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

export function AdvancedVisualizations({ tools }: { tools: ToolSummary[] }) {
  const configuredTools = tools.filter((tool) => tool.configured);

  const toolShareData = configuredTools
    .map((tool) => ({
      name: TOOL_SHORT_LABELS[tool.tool],
      value: tool.totalInputTokens + tool.totalOutputTokens,
      color: TOOL_COLORS[tool.tool],
    }))
    .filter((entry) => entry.value > 0);

  const costByToolData = configuredTools
    .map((tool) => ({
      name: TOOL_SHORT_LABELS[tool.tool],
      fullName: tool.label,
      cost: Number(tool.totalCostUsd.toFixed(2)),
      color: TOOL_COLORS[tool.tool],
    }))
    .filter((entry) => entry.cost > 0)
    .sort((a, b) => b.cost - a.cost);

  if (toolShareData.length === 0 && costByToolData.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>More Visualizations</CardTitle>
          <CardDescription>No tool data yet. Connect at least one provider to unlock chart insights.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border bg-card">
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
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
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

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Cost By Tool</CardTitle>
          <CardDescription>Estimated spend concentration across providers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costByToolData} layout="vertical" margin={{ left: 6, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${Number(v).toFixed(1)}`} />
              <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={false}
                formatter={(value, _name, item) => [
                  `$${Number(Array.isArray(value) ? value[0] : (value ?? 0)).toFixed(2)}`,
                  `Cost (${String(item?.payload?.fullName ?? item?.payload?.name ?? "Tool")})`,
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
    </div>
  );
}
