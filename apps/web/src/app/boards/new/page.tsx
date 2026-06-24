import { verifySession } from "@/lib/dal";
import NewBoardForm from "@/components/boards/new-board-form";

export default async function NewBoardPage() {
  await verifySession();
  return <NewBoardForm />;
}
