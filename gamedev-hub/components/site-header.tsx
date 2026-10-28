"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-background/50 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-lg tracking-tight">
          GameDev Hub
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/create-profile"
            className="text-xs font-semibold bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Přihlásit se / Registrovat
          </Link>
        </div>
      </div>
    </header>
  );
}
