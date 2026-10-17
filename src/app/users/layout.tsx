import DashboardShell from "@/components/dashboard/DashboardShell";

export default function UsersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
