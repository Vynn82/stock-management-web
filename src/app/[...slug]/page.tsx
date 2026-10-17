import DataPage from "@/components/dashboard/DataPage";
import { notFound } from "next/navigation";

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const section = slug.join("/");
  if (section === "staff") notFound();
  return <DataPage section={section} />;
}
