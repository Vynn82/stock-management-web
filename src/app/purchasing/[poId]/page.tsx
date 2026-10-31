import PODetailPage from "@/components/purchasing/PODetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ poId: string }>;
}) {
  const { poId } = await params;
  return <PODetailPage poId={poId} />;
}
