"use client";

import { User, Camera, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileInfoTab } from "./profile-info-tab";
import { AvatarTab } from "./avatar-tab";
import { PasswordTab } from "./password-tab";
import type { PublicUser } from "@/lib/data/auth";

interface ProfileSettingsProps {
  user: PublicUser;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="profile" className="gap-1.5">
          <User className="size-4" /> Profile Info
        </TabsTrigger>
        <TabsTrigger value="avatar" className="gap-1.5">
          <Camera className="size-4" /> Avatar
        </TabsTrigger>
        <TabsTrigger value="password" className="gap-1.5">
          <Lock className="size-4" /> Password
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileInfoTab user={user} />
      </TabsContent>
      <TabsContent value="avatar">
        <AvatarTab user={user} />
      </TabsContent>
      <TabsContent value="password">
        <PasswordTab />
      </TabsContent>
    </Tabs>
  );
}
