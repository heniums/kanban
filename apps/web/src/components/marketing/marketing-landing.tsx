import Link from "next/link";
import { Zap, Layers, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

const features = [
  {
    icon: Zap,
    title: "Real-time collaboration",
    body: "See board updates the moment they happen across every connected user.",
  },
  {
    icon: Layers,
    title: "Kanban boards",
    body: "Organize work into boards, lists, and cards that match your team's flow.",
  },
  {
    icon: Share2,
    title: "Share with your team",
    body: "Invite registered users to any board you own and collaborate together.",
  },
] as const;

export function MarketingLanding() {
  return (
    <PageContainer as="main" py="16">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Kanban
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A real-time collaborative kanban board for teams that want to move work forward.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-lg border bg-card p-6"
            >
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          );
        })}
      </section>

      <section className="mx-auto mt-20 flex max-w-3xl flex-col items-center text-center">
        <h2 className="text-2xl font-semibold">Move work forward together</h2>
        <p className="mt-2 text-muted-foreground">
          Create your first board in under a minute.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/register">Get started</Link>
        </Button>
      </section>
    </PageContainer>
  );
}
