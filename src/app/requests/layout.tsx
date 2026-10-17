import DashboardShell from "@/components/dashboard/DashboardShell";

export default function RequestsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
