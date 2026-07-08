"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { getAvatarUrl } from "@/lib/cloudinary/client-safe";
import { toast } from "sonner";

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

  const avatarUrl = (session?.user as Record<string, unknown> | undefined)?.avatarUrl as
    string | undefined;

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
                {avatarUrl ? (
                  <img
                    src={getAvatarUrl(avatarUrl) || avatarUrl}
                    alt=""
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full object-cover"
                  />
                ) : (
                  <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ||
                      session.user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                )}
                <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
              </button>

              {menuOpen && (
                <div className="bg-popover absolute right-0 mt-2 w-56 rounded-md border p-2 shadow-md">
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    {avatarUrl ? (
                      <img
                        src={getAvatarUrl(avatarUrl) || avatarUrl}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-primary text-primary-foreground inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold">
                        {session.user.name?.charAt(0).toUpperCase() ||
                          session.user.email?.charAt(0).toUpperCase() ||
                          "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {session.user.name || session.user.email}
                      </span>
                      <span className="text-muted-foreground text-xs">{session.user.email}</span>
                    </div>
                  </div>
                  <div className="bg-border my-1 h-px" />
                  <a
                    href="/profile"
                    className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="size-4" />
                    Profile Settings
                  </a>

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
