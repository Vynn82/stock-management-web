import DashboardShell from "@/components/dashboard/DashboardShell";

export default function StockLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
