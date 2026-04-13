"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
