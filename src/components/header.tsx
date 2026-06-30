"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

export function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <PageContainer as="div" py="0" className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          Kanban
        </Link>

        <nav className="flex items-center gap-4">
          {isLoading ? (
            <div className="bg-muted h-8 w-20 animate-pulse rounded" />
          ) : isAuthenticated && session?.user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium"
              >
                <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                  {session.user.name?.charAt(0).toUpperCase() ||
                    session.user.email?.charAt(0).toUpperCase() ||
                    "U"}
                </span>
                <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
              </button>

              {menuOpen && (
                <div className="bg-popover absolute right-0 mt-2 w-48 rounded-md border p-1 shadow-md">
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">
                    {session.user.email}
                  </div>
                  <div className="bg-border my-1 h-px" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="text-destructive hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </PageContainer>
    </header>
  );
}
