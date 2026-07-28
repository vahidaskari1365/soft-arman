import { redirect } from "next/navigation";
import { getCurrentUser, ensureSuperAdmin } from "@/lib/auth";
import AppShell from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureSuperAdmin();
  const user = await getCurrentUser();
  if (!user || !user.active) {
    redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}

export const dynamic = "force-dynamic";
