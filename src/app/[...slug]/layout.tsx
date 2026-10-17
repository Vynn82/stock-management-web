import DashboardShell from "@/components/dashboard/DashboardShell";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
