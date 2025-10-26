import Link from "next/link";
import { Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { fetchSidebarSessions } from "@/app/actions/chat";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export async function AppSidebar() {
  const sessions = await fetchSidebarSessions();
  console.log({ sessions });

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/chat" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>New Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Previous Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-muted-foreground">
                      No conversations yet
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/chat/${session.id}`}
                        className="flex-1 truncate"
                      >
                        <span className="truncate">{session.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="w-full">
              <UserButton />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
