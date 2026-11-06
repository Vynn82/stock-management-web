import NewPOPage from "@/components/purchasing/NewPOPage";

export default async function EditPurchaseOrderRoute({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  return <NewPOPage orderId={poId} />;
}
