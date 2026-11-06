import CustomerOrderDetailPage from "@/components/customer-orders/CustomerOrderDetailPage";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <CustomerOrderDetailPage orderId={orderId} />;
}
