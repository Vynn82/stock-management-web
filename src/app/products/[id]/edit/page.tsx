import EditProductPage from "@/components/products/EditProductPage";

export default async function EditProductRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditProductPage productId={id} />;
}
