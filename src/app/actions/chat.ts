"use server";

import { currentUser } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/server/auth/user-sync";
import { getUserSessions } from "@/server/db/chat-persistence";

export async function fetchSidebarSessions(
  limit = 20
): Promise<{
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}[]> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return [];
  }

  // We only need the numeric ID to query existing sessions.
  const user = await ensureUserExists(clerkUser);

  return getUserSessions(user.id, limit);
}

