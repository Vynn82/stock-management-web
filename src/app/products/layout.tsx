import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
