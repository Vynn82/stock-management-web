import StockInPage from "@/components/stock/StockInPage";

export default async function ProductStockInRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockInPage productId={id} />;
}
