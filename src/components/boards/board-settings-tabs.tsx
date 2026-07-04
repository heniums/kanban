"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Board } from "@/lib/db/schema/boards";
import { GeneralTab } from "./general-tab";
import { MembersTab } from "./members-tab";

interface BoardSettingsTabsProps {
  board: Board;
}

export function BoardSettingsTabs({ board }: BoardSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralTab board={board} />
      </TabsContent>

      <TabsContent value="members">
        <MembersTab board={board} />
      </TabsContent>
    </Tabs>
  );
}
