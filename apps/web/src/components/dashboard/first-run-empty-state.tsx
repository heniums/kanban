import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FirstRunEmptyState() {
  return (
    <main className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-16 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          No boards yet.
        </h1>
        <p className="text-lg text-muted-foreground">
          Create your first board to get started.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/boards/new">Create your first board</Link>
          </Button>
          <Link
            href="/boards"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Browse shared boards
          </Link>
        </div>
      </div>
    </main>
  );
}
