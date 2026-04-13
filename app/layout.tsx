import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { SessionProvider } from "@/components/session-provider";
import { GitHubAuthButton } from "@/components/github-auth-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Usage Tracker",
  description: "Track your AI tool usage, tokens, and costs in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <SessionProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-56 border-r bg-muted/30 flex flex-col shrink-0">
              <div className="flex items-center gap-2 px-4 py-5 border-b">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">AI Usage Tracker</span>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
              <GitHubAuthButton />
              <div className="px-4 py-3 border-t text-xs text-muted-foreground">
                <a
                  href="https://github.com/adylagad/ai-usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View on GitHub
                </a>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
