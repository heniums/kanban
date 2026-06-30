import { auth } from "@/auth";
import { listBoardsAction } from "@/lib/actions/boards";
import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { FirstRunEmptyState } from "@/components/dashboard/first-run-empty-state";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return <MarketingLanding />;
  }

  const { owned, shared } = await listBoardsAction();

  if (owned.length === 0) {
    return <FirstRunEmptyState />;
  }

  return <DashboardHome owned={owned} shared={shared} />;
}
