"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

export function UsageChart({ tools }: { tools: ToolSummary[] }) {
  // Collect all unique dates across tools
  const dateSet = new Set<string>();
  for (const tool of tools) {
    for (const d of tool.daily) dateSet.add(d.date);
  }

  const dates = Array.from(dateSet).sort();
  if (dates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tokens Over Time</CardTitle>
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
    for (const tool of tools) {
      if (!tool.configured) continue;
      const bucket = tool.daily.find((d) => d.date === date);
      const tokens = (bucket?.inputTokens ?? 0) + (bucket?.outputTokens ?? 0);
      point[tool.tool] = tokens;
    }
    return point;
  });

  const activeTools = tools.filter((t) => t.configured && t.daily.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokens Over Time</CardTitle>
        <CardDescription>Daily token usage per tool</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)} // MM-DD
            />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [fmt(Number(value ?? 0)), ""]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: any) => `Date: ${label}`}
            />
            <Legend />
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
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
