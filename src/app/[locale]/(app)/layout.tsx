import { AppShell } from "@/components/able/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Session wiring arrives in Stage 2 (auth); signed-out shell until then.
  return <AppShell user={null}>{children}</AppShell>;
}
