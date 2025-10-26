"use server";

import { currentUser } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/server/auth/user-sync";
import { getSessionWithMessages, getUserSessions } from "@/server/db/chat-persistence";
import { UIMessage } from "ai";
import { revalidatePath } from "next/cache";

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


export async function fetchChatMessages(sessionId: string): Promise<UIMessage[]>{
  const session = await getSessionWithMessages(sessionId);
  console.log({ session });
  if (!session) {
    return [];
  }
  return session.messages;
}

export async function revalidateSidebar() {
  revalidatePath('/chat', 'layout');
}