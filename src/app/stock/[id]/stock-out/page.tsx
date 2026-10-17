import StockOutPage from "@/components/stock/StockOutPage";

export default async function ProductStockOutRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockOutPage productId={id} />;
}
