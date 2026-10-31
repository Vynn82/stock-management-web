import DashboardShell from "@/components/dashboard/DashboardShell";

export default function PurchasingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
