"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import Image from "next/image";

export function GitHubAuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="px-4 py-3 border-t">
        <div className="h-8 w-full rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="px-4 py-3 border-t space-y-2">
        <div className="flex items-center gap-2">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ""}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {session.user?.name ?? session.login}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-7 px-2"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-xs"
        onClick={() => signIn("github")}
      >
        <GitBranch className="h-3.5 w-3.5" />
        Sign in with GitHub
      </Button>
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
        Enables Copilot usage tracking
      </p>
    </div>
  );
}
