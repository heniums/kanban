"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { ImageUpload } from "@/components/upload/image-upload";
import { updateUserAvatarAction, deleteUserAvatarAction } from "@/lib/actions/avatar";
import { mapUploadResultToAttachment } from "@/lib/cloudinary";
import type { CloudinaryUploadResult } from "@/lib/cloudinary";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Header() {
  const { data: session, status, update } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleAvatarUpload = async (result: CloudinaryUploadResult) => {
    if (!session?.user?.id) return;
    setAvatarUploading(true);
    try {
      const meta = mapUploadResultToAttachment(result);
      const res = await updateUserAvatarAction({
        avatarUrl: meta.url,
        avatarPublicId: meta.publicId,
      });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      await update({});
      router.refresh();
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setAvatarUploading(false);
      setMenuOpen(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await deleteUserAvatarAction();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      await update();
      router.refresh();
      toast.success("Avatar removed");
    } catch {
      toast.error("Failed to remove avatar");
    } finally {
      setMenuOpen(false);
    }
  };

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
                    src={avatarUrl}
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
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">
                    {session.user.email}
                  </div>
                  <div className="bg-border my-1 h-px" />

                  <div className="space-y-2 px-2 py-1">
                    <div className="flex items-center gap-2">
                      {avatarUrl ? (
                        <div className="relative">
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <button
                            onClick={handleAvatarDelete}
                            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-white"
                            title="Remove avatar"
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="bg-muted inline-flex h-10 w-10 items-center justify-center rounded-full">
                          <Camera className="text-muted-foreground size-4" />
                        </div>
                      )}
                      <span className="text-sm">{avatarUrl ? "Change avatar" : "Add avatar"}</span>
                    </div>
                    <ImageUpload
                      onUpload={handleAvatarUpload}
                      onError={(err) => toast.error(err)}
                      disabled={avatarUploading}
                      maxFiles={1}
                    />
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
