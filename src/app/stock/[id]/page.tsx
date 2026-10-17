import StockDetailPage from "@/components/stock/StockDetailPage";

export default async function StockDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockDetailPage productId={id} />;
}
