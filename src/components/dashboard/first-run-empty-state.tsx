import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

export function FirstRunEmptyState() {
  return (
    <PageContainer
      as="main"
      py="16"
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center"
    >
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">No boards yet.</h1>
        <p className="text-muted-foreground text-lg">Create your first board to get started.</p>
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/boards/new">Create your first board</Link>
          </Button>
          <Link
            href="/boards"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Browse shared boards
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
