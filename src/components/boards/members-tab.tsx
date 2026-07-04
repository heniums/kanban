"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Board } from "@/lib/db/schema/boards";
import { getBoardMembersAction } from "@/lib/actions/members/list";
import { addMemberAction } from "@/lib/actions/members/add";
import { removeMemberAction } from "@/lib/actions/members/remove";
import { searchUsersAction } from "@/lib/actions/members/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function MembersTab({ board }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const initializedRef = useRef(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const result = await getBoardMembersAction(board.id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setMembers(result.members);
    }
    setLoading(false);
  }, [board.id]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadMembers();
    }
  }, [loadMembers]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      const result = await searchUsersAction(board.id, query);
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleAddMember = async (userId: string) => {
    setAdding(true);
    const result = await addMemberAction(board.id, userId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Member added successfully");
      setAddDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      await loadMembers();
    }
    setAdding(false);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemoving(true);
    const result = await removeMemberAction(board.id, memberToRemove.userId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Member removed successfully");
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      await loadMembers();
    }
    setRemoving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center">Loading members...</div>
        </CardContent>
      </Card>
    );
  }

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
            {members.map((member) => (
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
            ))}
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searching && <div className="text-muted-foreground text-sm">Searching...</div>}
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
