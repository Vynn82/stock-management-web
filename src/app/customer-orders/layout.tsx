import DashboardShell from "@/components/dashboard/DashboardShell";

export default function CustomerOrdersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
