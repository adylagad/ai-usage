import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToolSummary } from "@/lib/types";
import { ToolStatusBadge } from "./tool-status-badge";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n === 0) return "—";
  return n.toString();
}

function fmtCost(n: number): string {
  if (n === 0) return "—";
  return `$${n.toFixed(2)}`;
}

function CopilotDetail({ tool }: { tool: ToolSummary }) {
  // Personal plan: premium request count
  if (tool.totalOutputTokens > 0) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {tool.totalOutputTokens.toLocaleString()} premium requests
        {tool.totalCostUsd > 0 && ` · $${tool.totalCostUsd.toFixed(2)}`}
      </p>
    );
  }
  // Org plan: suggestions + acceptances
  if ((tool.suggestions ?? 0) > 0 || (tool.acceptances ?? 0) > 0) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {(tool.suggestions ?? 0).toLocaleString()} suggestions
        {" · "}
        {(tool.acceptances ?? 0).toLocaleString()} accepted
        {(tool.activeUsers ?? 0) > 0 && ` · ${tool.activeUsers} users`}
      </p>
    );
  }
  // Connected but no data available
  if (tool.ghLogin) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        @{tool.ghLogin} · no usage data available
      </p>
    );
  }
  return null;
}

export function ToolBreakdown({ tools }: { tools: ToolSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Breakdown</CardTitle>
        <CardDescription>Usage summary per AI tool</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead className="text-right">Input Tokens</TableHead>
              <TableHead className="text-right">Output Tokens</TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
              <TableHead>Top Model</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map((tool) => (
              <TableRow key={tool.tool}>
                <TableCell className="font-medium">{tool.label}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {tool.tool === "copilot" ? "—" : tool.configured && !tool.error ? fmt(tool.totalInputTokens) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {tool.configured && !tool.error
                    ? tool.tool === "copilot"
                      ? "—"
                      : tool.tool === "cursor"
                        ? `${fmt(tool.totalOutputTokens)} msgs`
                        : fmt(tool.totalOutputTokens)
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {tool.tool === "copilot"
                    ? tool.totalCostUsd > 0 ? fmtCost(tool.totalCostUsd) : "—"
                    : tool.configured && !tool.error ? fmtCost(tool.totalCostUsd) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                  {tool.topModel ?? "—"}
                </TableCell>
                <TableCell>
                  <ToolStatusBadge summary={tool} />
                  {tool.tool === "copilot" && tool.configured && (
                    <CopilotDetail tool={tool} />
                  )}
                  {tool.tool !== "copilot" && tool.error && (
                    <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={tool.error}>
                      {tool.error}
                    </p>
                  )}
                  {tool.info && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]" title={tool.info}>
                      {tool.info}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
