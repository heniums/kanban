"use client";

import { useState } from "react";
import { User, Camera, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/upload/image-upload";
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/profile";
import { updateUserAvatarAction, deleteUserAvatarAction } from "@/lib/actions/avatar";
import { mapUploadResultToAttachment } from "@/lib/cloudinary/client-safe";
import type { CloudinaryUploadResult } from "@/lib/cloudinary/client-safe";
import type { PublicUser } from "@/lib/data/auth";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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

function ProfileInfoTab({ user }: { user: PublicUser }) {
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

function AvatarTab({ user }: { user: PublicUser }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const { update } = useSession();

  const handleUpload = async (result: CloudinaryUploadResult) => {
    setUploading(true);
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

      setAvatarUrl(meta.url);
      toast.success("Avatar updated");
      await update({ avatarUrl: meta.url });
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteUserAvatarAction();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setAvatarUrl("");
      toast.success("Avatar removed");
      await update({ avatarUrl: null });
    } catch {
      toast.error("Failed to remove avatar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        {avatarUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Avatar"
              className="ring-border size-32 rounded-full object-cover ring-2"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 size-3.5" />
              Remove avatar
            </Button>
          </div>
        ) : (
          <div className="bg-muted ring-border flex size-32 items-center justify-center rounded-full ring-2">
            <Camera className="text-muted-foreground size-10" />
          </div>
        )}
      </div>

      <ImageUpload
        onUpload={handleUpload}
        onError={(err) => toast.error(err)}
        disabled={uploading}
        maxFiles={1}
        maxFileSizeBytes={2 * 1024 * 1024}
      />
    </div>
  );
}

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const result = await updatePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">Must be at least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
        >
          {saving ? "Updating…" : "Update Password"}
        </Button>
      </div>
    </div>
  );
}
