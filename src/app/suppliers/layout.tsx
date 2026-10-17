import DashboardShell from "@/components/dashboard/DashboardShell";

export default function SuppliersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
