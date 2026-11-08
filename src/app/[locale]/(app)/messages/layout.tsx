import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { listConversations } from "@/server/messages";
import { Inbox } from "@/components/messages/inbox";
import { MessagesShell } from "@/components/messages/messages-shell";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/messages", locale });
  const items = await listConversations();
  return <MessagesShell inbox={<Inbox initial={items} meId={user.id} />}>{children}</MessagesShell>;
}
