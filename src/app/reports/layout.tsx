import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ReportsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
