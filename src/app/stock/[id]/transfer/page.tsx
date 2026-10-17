import TransferStockPage from "@/components/stock/TransferStockPage";

export default async function TransferStockRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TransferStockPage productId={id} />;
}
