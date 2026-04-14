import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Activity, BarChart3 } from "lucide-react";
import Link from "next/link";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
      className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen overflow-hidden">
          <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
            <div className="border-b border-border px-5 py-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[color:var(--brand-blue)]" />
                <span className="font-semibold tracking-tight">AI Usage Tracker</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Tool analytics command center</p>
            </div>
            <nav className="flex-1 space-y-2 px-3 py-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:border-border hover:bg-accent hover:text-foreground"
              >
                <Activity className="h-4 w-4 text-[color:var(--brand-blue)]" />
                Dashboard
              </Link>
            </nav>
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <a
                href="https://github.com/adylagad/ai-usage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground hover:underline"
              >
                View on GitHub
              </a>
            </div>
          </aside>

          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-5 rounded-2xl border border-border bg-card p-4 md:hidden">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[color:var(--brand-blue)]" />
                  <span className="font-semibold tracking-tight">AI Usage Tracker</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Dashboard</p>
              </div>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
