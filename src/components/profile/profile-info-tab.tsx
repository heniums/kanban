"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/actions/profile";
import type { PublicUser } from "@/lib/data/auth";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function ProfileInfoTab({ user }: { user: PublicUser }) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const { update } = useSession();

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateProfileAction({ name: name.trim() });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated");
      await update({ name: name.trim() });
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Display Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={user.email} disabled readOnly />
        <p className="text-muted-foreground text-xs">Email cannot be changed.</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !name.trim() || name.trim() === user.name}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
