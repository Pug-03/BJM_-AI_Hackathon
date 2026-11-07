import { AppShell } from "@/components/able/app-shell";
import type { ShellUser } from "@/components/able/nav-items";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

async function unread(userId: string) {
  try {
    const [messages, notifications] = await Promise.all([
      db.message.count({
        where: {
          readAt: null,
          senderUserId: { not: userId },
          conversation: { OR: [{ talentUserId: userId }, { employerUserId: userId }] },
        },
      }),
      db.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { messages, notifications };
  } catch {
    return { messages: 0, notifications: 0 };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let shellUser: ShellUser | null = null;
  if (user) {
    const counts = await unread(user.id);
    shellUser = {
      name: user.name,
      image: user.image,
      role: user.role,
      profileHref: "/me",
      unreadMessages: counts.messages,
      unreadNotifications: counts.notifications,
    };
  }
  return <AppShell user={shellUser}>{children}</AppShell>;
}
