import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ManageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
