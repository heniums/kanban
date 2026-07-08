import Link from "next/link";
import { Zap, Layers, Share2, MousePointerClick, Lock, Tag, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

const features = [
  {
    icon: Lock,
    title: "Authentication & accounts",
    body: "Register, sign in, and manage your profile with secure session-based auth.",
  },
  {
    icon: Layers,
    title: "Board management",
    body: "Create, edit, and organize boards with lists and cards that match your workflow.",
  },
  {
    icon: MousePointerClick,
    title: "Drag-and-drop",
    body: "Reorder lists and move cards with accessible, keyboard-native drag-and-drop.",
  },
  {
    icon: Zap,
    title: "Real-time collaboration",
    body: "See board updates the moment they happen across every connected user via WebSockets.",
  },
  {
    icon: Share2,
    title: "Board sharing",
    body: "Invite registered users to collaborate on your boards with an owner + member model.",
  },
  {
    icon: Tag,
    title: "Labels & attachments",
    body: "Organize cards with color-coded labels and attach images powered by Cloudinary.",
  },
  {
    icon: Monitor,
    title: "Responsive design",
    body: "Works beautifully on desktop and tablet with a clean, accessible interface.",
  },
] as const;

export function MarketingLanding() {
  return (
    <PageContainer as="main" py="16">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Kanban</h1>
        <p className="text-muted-foreground mt-4 text-lg">
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
            <div key={feature.title} className="bg-card rounded-lg border p-6">
              <Icon className="text-primary size-6" aria-hidden="true" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{feature.body}</p>
            </div>
          );
        })}
      </section>

      <section className="mx-auto mt-20 flex max-w-3xl flex-col items-center text-center">
        <h2 className="text-2xl font-semibold">Open source hobby project</h2>
        <p className="text-muted-foreground mt-2 max-w-xl">
          This is an open source project built as a portfolio showcase. Contributions, feedback, and
          stars are always welcome.
        </p>
      </section>

      <footer className="mx-auto mt-20 flex max-w-3xl flex-col items-center gap-4 border-t pt-8 text-center text-sm">
        <div className="flex gap-6">
          <a
            href={process.env.NEXT_PUBLIC_PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfolio
          </a>
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
        <p className="text-muted-foreground">Built with Next.js, Socket.io, and PostgreSQL.</p>
      </footer>
    </PageContainer>
  );
}
