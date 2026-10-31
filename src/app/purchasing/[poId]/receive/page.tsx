import ReceiveGoodsPage from "@/components/purchasing/ReceiveGoodsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ poId: string }>;
}) {
  const { poId } = await params;
  return <ReceiveGoodsPage poId={poId} />;
}
