"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Board } from "@/lib/db/schema/boards";
import { addMemberAction } from "@/lib/actions/members/add";
import { removeMemberAction } from "@/lib/actions/members/remove";
import { searchUsersAction } from "@/lib/actions/members/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  userId: string;
  role: "owner" | "member";
  joinedAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface SearchUser {
  id: string;
  email: string;
  name: string | null;
}

interface MembersTabProps {
  board: Board;
  initialMembers: Member[];
}

export function MembersTab({ board, initialMembers }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      const result = await searchUsersAction({ boardId: board.id, query });
      if ("error" in result) {
        toast.error(result.error);
        setSearchResults([]);
      } else {
        setSearchResults(result.users);
      }
      setSearching(false);
    },
    [board.id],
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAdding(true);
    const result = await addMemberAction({ boardId: board.id, userId });
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Member added successfully");
      setAddDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      const membersResult = await (
        await import("@/lib/actions/members/list")
      ).getBoardMembersAction({ boardId: board.id });
      if ("members" in membersResult && membersResult.members) {
        setMembers(membersResult.members);
      }
    }
    setAdding(false);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const memberBeingRemoved = memberToRemove;
    setRemoving(true);
    setMembers((prev) => prev.filter((m) => m.userId !== memberBeingRemoved.userId));
    setRemoveDialogOpen(false);

    const result = await removeMemberAction({
      boardId: board.id,
      userId: memberBeingRemoved.userId,
    });
    if ("error" in result) {
      toast.error(result.error);
      setMembers((prev) => [...prev, memberBeingRemoved]);
      setRemoveDialogOpen(true);
    } else {
      toast.success("Member removed successfully");
      setMemberToRemove(null);
    }
    setRemoving(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage who has access to this board.</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>Add member</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No members yet.</div>
            ) : (
              members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{member.user.name || member.user.email}</div>
                    <div className="text-muted-foreground text-sm">{member.user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm capitalize">{member.role}</span>
                    {member.role === "member" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMemberToRemove(member);
                          setRemoveDialogOpen(true);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Search for users by email to add them to this board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searching && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-muted-foreground text-sm">{user.email}</div>
                    </div>
                    <Button size="sm" onClick={() => handleAddMember(user.id)} disabled={adding}>
                      {adding ? "Adding..." : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-muted-foreground text-sm">No users found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              {memberToRemove?.user.name || memberToRemove?.user.email} from this board? They will
              lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={removing}>
              {removing ? "Removing..." : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
