import DashboardShell from "@/components/dashboard/DashboardShell";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
