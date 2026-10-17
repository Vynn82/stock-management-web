import DataPage from "@/components/dashboard/DataPage";
import DashboardHome from "@/components/dashboard/DashboardHome";

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (slug.length === 1 && slug[0] === "dashboard") return <DashboardHome />;
  return <DataPage section={slug.join("/")} />;
}
