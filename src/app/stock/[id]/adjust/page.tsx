import AdjustStockPage from "@/components/stock/AdjustStockPage";

export default async function AdjustStockRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdjustStockPage productId={id} />;
}
