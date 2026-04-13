import { Badge } from "@/components/ui/badge";
import { ToolSummary } from "@/lib/types";

export function ToolStatusBadge({ summary }: { summary: ToolSummary }) {
  if (!summary.configured) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not configured
      </Badge>
    );
  }
  if (summary.error) {
    return <Badge variant="destructive">Error</Badge>;
  }
  if (summary.info) {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
        Connected
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20">
      Connected
    </Badge>
  );
}
