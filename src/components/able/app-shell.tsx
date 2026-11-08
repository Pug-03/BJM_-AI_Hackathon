import { IconRail } from "./icon-rail";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";
import { PageTransition } from "./page-transition";
import type { ShellUser } from "./nav-items";
import { KeyNotice } from "./key-notice";
import { noticeServices } from "@/lib/env";

/** Signed-in / explore shell: icon rail ≥768px, top bar + floating bottom nav below. */
export function AppShell({
  user,
  children,
  banner,
}: {
  user: ShellUser | null;
  children: React.ReactNode;
  banner?: React.ReactNode;
}) {
  return (
    <div className="bg-paper min-h-dvh">
      <IconRail user={user} />
      <div className="md:pl-[var(--rail-w)]">
        {banner}
        <TopBar user={user} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+112px)] focus:outline-none md:px-8 md:pt-10 md:pb-28"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <BottomNav user={user} />
      <KeyNotice missing={noticeServices()} aboveBottomNav />
    </div>
  );
}
